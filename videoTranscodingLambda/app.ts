import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import crypto from "node:crypto";
import type { S3Event } from "aws-lambda";

const ecsClient = new ECSClient({
  region: process.env["AWS_REGION"] ?? "ap-south-1",
});

const taskDefinitionARN = process.env["TASK_DEFINITION_ARN"]?.trim()!;
const clusterARN = process.env["CLUSTER_ARN"]?.trim()!;
const subnetIDs = process.env["SUBNET_IDS"]?.trim().split(",")!;
const securityGroupId = process.env["SECURITY_GROUP_ID"]?.trim()!;
const outputBucket = process.env["OUTPUT_BUCKET"]?.trim();

export const lambda = async (event: S3Event) => {
  const objectKey = decodeURIComponent(
    event.Records[0]?.s3?.object?.key?.replace(/\+/g, " ") || "",
  );
  const objectUniqueName = objectKey.replace(".mp4", "").replace(".mkv", "");
  const objectSize = event.Records[0]?.s3.object.size ?? 0;
  const tempBucketName = event.Records[0]?.s3.bucket.name;

  const isSupported = [".mp4", ".mkv"].some((extension) =>
    objectKey.endsWith(extension),
  );

  // skipping empty file + folder which is also of size=0
  // skipping unsupported files
  if (objectSize === 0 || !isSupported) {
    return;
  }

  const runTaskCommand = new RunTaskCommand({
    taskDefinition: taskDefinitionARN,
    cluster: clusterARN,
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: subnetIDs,
        securityGroups: [securityGroupId],
        assignPublicIp: "ENABLED",
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "video-transcoder",
          environment: [
            { name: "JOB_ID", value: crypto.randomUUID() },
            { name: "INPUT_BUCKET", value: tempBucketName },
            { name: "INPUT_KEY", value: objectUniqueName },
            { name: "OUTPUT_BUCKET", value: outputBucket },
          ],
        },
      ],
    },
  });

  const runTaskResult = await ecsClient.send(runTaskCommand);
  if (runTaskResult.failures?.length)
    throw new Error(
      `ECS Task failed:${JSON.stringify(runTaskResult.failures)}`,
    );
};

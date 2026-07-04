import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import crypto from "node:crypto";
import type { S3Event } from "aws-lambda";

const ecsClient = new ECSClient({
  region: process.env["AWS_REGION"] ?? "ap-south-1",
});

export const lamda = async (event: S3Event) => {
  const objectKey = decodeURIComponent(
    event.Records[0]?.s3?.object?.key?.replace(/\+/g, " ") || "",
  );
  const objectSize = event.Records[0]?.s3.object.size ?? 0;
  const tempBucketName = event.Records[0]?.s3.bucket.name;

  // skipping empty file + folder which is also of size=0
  if (objectSize === 0) {
    return;
  }

  const runTaskCommand = new RunTaskCommand({
    taskDefinition: process.env["TASK_DEFINITION_ARN"],
    cluster: process.env["CLUSTER_ARN"],
    launchType: "FARGATE",
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: process.env["SUBNET_IDS"]?.split(","),
        securityGroups: [process.env["SECURITY_GROUP_ID"]!],
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
            { name: "INPUT_KEY", value: objectKey },
            { name: "OUTPUT_BUCKET", value: process.env["OUTPUT_BUCKET"] },
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

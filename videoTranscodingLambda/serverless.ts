import type { AWS } from "@serverless/typescript";

const config: AWS = {
  service: "video-streaming",
  frameworkVersion: "4",
  provider: {
    name: "aws",
    runtime: "nodejs24.x",
    region: "ap-south-1",
    timeout: 30, //lambda timeout=30s
    memorySize: 128,
    deploymentBucket: {
      maxPreviousDeploymentArtifacts: 3, //max 3 snapshots in bucket
    },
  },
  plugins: [],
  functions: {
    s3Handler: {
      name: "videoTranscoder-managed",
      handler: "dist/app.lambda",
      role: "arn:aws:iam::482707530865:role/service-role/videoTranscoder-role-3aqfllmz", //use this existing role on lambda
      events: [
        {
          s3: {
            bucket: "temp-bucket-raquib",
            event: "s3:ObjectCreated:*",
            existing: true, //use this existing bucket
          },
        },
      ],
      environment: {
        CLUSTER_ARN:
          "arn:aws:ecs:ap-south-1:482707530865:cluster/video-transcoding-cluster",
        OUTPUT_BUCKET: "raquib-permanent-bucket",
        SECURITY_GROUP_ID: "sg-07a8442e62e426dc9",
        SUBNET_IDS:
          "subnet-02f4934bf05d48283,subnet-004c2cc6320c53db4,subnet-0b8ba7663f1e58b3d",
        TASK_DEFINITION_ARN:
          "arn:aws:ecs:ap-south-1:482707530865:task-definition/video-transcoder:4",
      },
      package: {
        individually: true,
        patterns: [
          "!app.ts",
          "!tsconfig.json",
          "!package-lock.json",
          "!node_modules/@types/**",
        ],
      },
    },
  },
};

export default config;

import type { AWS } from "@serverless/typescript";

const config: AWS = {
  service: "video-streaming",
  frameworkVersion: "4",
  provider: {
    name: "aws",
    runtime: "nodejs24.x",
    region: "ap-south-1",
    timeout: 30,
    memorySize: 128,
    deploymentBucket: {
      maxPreviousDeploymentArtifacts: 3,
    },
  },
  functions: {
    httpHandler: {
      name: "httpApiHandler-managed",
      handler: "dist/app.lambda",
      role: "arn:aws:iam::482707530865:role/put-to-temp-bucket-role",
      url: {
        cors: {
          allowedOrigins: ["http://localhost:5173", "http://local.com:5173"],
          allowedMethods: ["GET", "POST"],
          allowCredentials: true,
          exposedResponseHeaders: ["Set-Cookie"],
          maxAge: 86400,
        },
      },
      environment: {
        BUCKET_NAME: "temp-bucket-raquib",
        CLOUDFRONT_KEY_PAIR_ID: "KUYLHDJWPQMEO",
        CLOUDFRONT_DOMAIN: "d2tqc45o39v2m3.cloudfront.net",
      },
      package: {
        individually: true,
        patterns: [
          "!src",
          "!app.ts",
          "!db.ts",
          "!serverless.ts",
          "!tsconfig.json",
          "!package-lock.json",
          "!node_modules/@types/**",
          "!node_modules/serverless",
          "!node_modules/typescript",
        ],
      },
    },
  },
};

export default config;

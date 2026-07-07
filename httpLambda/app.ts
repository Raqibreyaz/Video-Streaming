import express, { NextFunction, Request, Response } from "express";
import serverless from "serverless-http";
import connectDB from "./db.js";
import listVideos from "./src/controllers/listVideos.controllers.js";
import uploadVideo from "./src/controllers/uploadVideo.controllers.js";
import streamVideo from "./src/controllers/streamVideo.controllers.js";

const app = express();
await connectDB();

app.use(express.json());

app.get("/", listVideos);

app.post("/", uploadVideo);

app.get("/:id", streamVideo);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof Error) {
    return res.json({ message: err.message });
  } else {
    console.log(err);
    return res.json({ message: "internal server error" });
  }
});

const isLambda = Boolean(process.env["AWS_EXECUTION_ENV"]);
if (!isLambda) {
  app.listen(8080, (err) => {
    if (err) return console.log(err);
  });
}

export const lambda = serverless(app, { provider: "aws" });

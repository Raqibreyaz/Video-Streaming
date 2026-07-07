import { Request, Response } from "express";
import { getSignedCookies } from "@aws-sdk/cloudfront-signer";
import Video from "../models/video.models.js";

interface StreamVideoParams {
  id: string;
}

const cloudfrontDomain = process.env["CLOUDFRONT_DOMAIN"]!;
const cloudfrontPrivateKey = process.env["CLOUDFRONT_PRIVATE_KEY"]!;
const cloudfrontKeyPairId = process.env["CLOUDFRONT_KEY_PAIR_ID"]!;

export default async function streamVideo(
  req: Request<StreamVideoParams>,
  res: Response,
) {
  const videoId = req.params.id;
  const video = await Video.findById(videoId).lean();

  if (!video) throw new Error("video doesn't exist!");

  const now = Date.now();
  const baseUrl = `https://${cloudfrontDomain}/${video.videoId}/*`;
  const dateGreaterThan = new Date(now).toISOString();
  const dateLessThan = new Date(now + 3600 * 1000).toISOString();

  // Use the FULL distribution domain, e.g., "d1234567890.cloudfront.net"
  // NOT "cloudfront.net"
  const cookieDomain = cloudfrontDomain
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");

  const cookies = getSignedCookies({
    keyPairId: cloudfrontKeyPairId,
    privateKey: cloudfrontPrivateKey,
    url: baseUrl,
    dateLessThan,
    dateGreaterThan,
  });

  const cookieAttrs = `Domain=${cookieDomain}; Path=/; Secure; HttpOnly; SameSite=None`;

  const setCookieHeaders = [
    `CloudFront-Policy=${cookies["CloudFront-Policy"]};${cookieAttrs}`,
    `CloudFront-Signature=${cookies["CloudFront-Signature"]};${cookieAttrs}`,
    `CloudFront-Key-Pair-Id=${cookies["CloudFront-Key-Pair-Id"]};${cookieAttrs}`,
  ];

  setCookieHeaders.forEach((setCookieHeader) =>
    res.append("Set-Cookie", setCookieHeader),
  );

  res.json({ success: true, videoUrl: `https://${cloudfrontDomain}/${video.videoId}/master.m3u8` });
}

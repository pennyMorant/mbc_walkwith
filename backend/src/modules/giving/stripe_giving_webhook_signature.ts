import { createHmac, timingSafeEqual } from "node:crypto";

import { appError } from "../../shared/http/app-error.js";

const stripeSignatureToleranceSeconds = 300;

export function verifyStripeWebhookSignature(
  payload: Buffer,
  signature: string | undefined,
  webhookSecret: string | undefined
) {
  if (!signature || !webhookSecret) {
    throw signatureError("Stripe webhook signature is missing.");
  }
  const fields = parseStripeSignatureHeader(signature);
  const timestamp = fields.timestamps.at(-1);
  if (!timestamp || fields.signatures.length === 0) {
    throw signatureError("Stripe webhook signature is invalid.");
  }
  const timestampSeconds = Number(timestamp);
  if (
    !Number.isInteger(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) >
      stripeSignatureToleranceSeconds
  ) {
    throw signatureError(
      "Stripe webhook signature timestamp is outside tolerance."
    );
  }
  const signedPayload = `${timestamp}.${payload.toString("utf8")}`;
  const actual = createHmac("sha256", webhookSecret)
    .update(signedPayload)
    .digest("hex");
  const actualBuffer = Buffer.from(actual, "hex");
  const matches = fields.signatures.some((expected) => {
    const expectedBuffer = Buffer.from(expected, "hex");
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  });
  if (!matches) {
    throw signatureError("Stripe webhook signature verification failed.");
  }
}

function parseStripeSignatureHeader(signature: string) {
  const timestamps: string[] = [];
  const signatures: string[] = [];
  for (const part of signature.split(",")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }
    const key = part.slice(0, separatorIndex);
    const value = part.slice(separatorIndex + 1);
    if (key === "t") {
      timestamps.push(value);
    }
    if (key === "v1") {
      signatures.push(value);
    }
  }
  return { timestamps, signatures };
}

function signatureError(message: string) {
  return appError({
    code: "webhook_signature_invalid",
    category: "validation_error",
    sourceLayer: "external",
    statusCode: 400,
    message,
    recoverable: false,
    retryable: false,
    nextAction: "check_provider_signature",
    evidence: { provider: "stripe" }
  });
}

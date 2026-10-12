import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

import { LifePostImageStorageService } from "../src/modules/life/life-post-image-storage.service.js";
import { testConfig } from "./route_test_harness.js";

describe("LifePostImageStorageService", () => {
  it("stores local images under the configured media root", async () => {
    const mediaUploadDir = await mkdtemp(join(tmpdir(), "mbc-life-media-"));
    const storage = LifePostImageStorageService.fromConfig({
      ...testConfig,
      mediaUploadDir
    });

    try {
      const image = await storage.saveImage({
        buffer: Buffer.from("image bytes"),
        fileName: "weekly photo.png",
        mimeType: "image/png"
      });

      expect(image.storagePath.startsWith(`local:${mediaUploadDir}`)).toBe(true);
      expect(image.storagePath).toContain("/life-images/");
      expect(image.url).toBe(`/v1/life/images/${basename(image.storagePath)}`);
    } finally {
      await rm(mediaUploadDir, { recursive: true, force: true });
    }
  });

  it("returns structured errors for invalid image uploads", async () => {
    const storage = new LifePostImageStorageService({
      async saveImage() {
        throw new Error("driver should not be called");
      },
      async readImage() {
        throw new Error("driver should not be called");
      }
    });

    await expect(
      Promise.resolve().then(() =>
        storage.saveImage({
          buffer: Buffer.from("not an image"),
          fileName: "image.txt",
          mimeType: "text/plain"
        })
      )
    ).rejects.toMatchObject({
      code: "life_image_type_unsupported",
      category: "validation_error",
      sourceLayer: "capability",
      statusCode: 400,
      evidence: {
        mimeType: "text/plain"
      },
      nextAction: "review_request"
    });

    await expect(
      Promise.resolve().then(() =>
        storage.saveImage({
          buffer: Buffer.alloc(0),
          fileName: "empty.png",
          mimeType: "image/png"
        })
      )
    ).rejects.toMatchObject({
      code: "life_image_empty",
      category: "validation_error",
      sourceLayer: "capability",
      statusCode: 400,
      nextAction: "review_request"
    });

    await expect(
      Promise.resolve().then(() =>
        storage.saveImage({
          buffer: Buffer.alloc(8 * 1024 * 1024 + 1),
          fileName: "large.png",
          mimeType: "image/png"
        })
      )
    ).rejects.toMatchObject({
      code: "life_image_too_large",
      category: "validation_error",
      sourceLayer: "capability",
      statusCode: 400,
      evidence: {
        sizeBytes: 8 * 1024 * 1024 + 1,
        maxSizeBytes: 8 * 1024 * 1024
      },
      nextAction: "review_request"
    });
  });
});

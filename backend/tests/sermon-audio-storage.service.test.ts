import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SermonAudioStorageService } from "../src/modules/sermons/sermon-audio-storage.service.js";
import { testConfig } from "./route_test_harness.js";

describe("SermonAudioStorageService", () => {
  it("keeps local audio reads inside the configured media root", async () => {
    const mediaUploadDir = await mkdtemp(join(tmpdir(), "mbc-sermon-media-"));
    const storage = SermonAudioStorageService.fromConfig({
      ...testConfig,
      mediaUploadDir
    });

    try {
      const stored = await storage.saveAudio({
        sermonId: "sermon-1",
        buffer: Buffer.from("safe audio bytes"),
        fileName: "sermon.mp3",
        mimeType: "audio/mpeg"
      });
      expect(stored.storagePath.startsWith(`local:${mediaUploadDir}`)).toBe(true);
      expect(stored.storagePath).toContain("/sermon-audio/");

      const audio = await storage.readAudio({
        storagePath: stored.storagePath,
        mimeType: stored.mimeType,
        rangeHeader: undefined
      });
      expect(await streamText(audio.stream)).toBe("safe audio bytes");

      const outsidePath = join(mediaUploadDir, "outside.mp3");
      await writeFile(outsidePath, "outside audio");
      await expect(
        storage.readAudio({
          storagePath: `local:${outsidePath}`,
          mimeType: "audio/mpeg",
          rangeHeader: undefined
        })
      ).rejects.toMatchObject({
        code: "object_not_found",
        category: "not_found",
        sourceLayer: "capability",
        statusCode: 404
      });
      await expect(
        storage.deleteAudio(`local:${outsidePath}`)
      ).rejects.toMatchObject({
        code: "object_delete_failed",
        category: "validation_error",
        sourceLayer: "capability",
        statusCode: 400,
        retryable: false
      });
      await storage.deleteAudio(stored.storagePath);
      await expect(storage.deleteAudio(stored.storagePath)).resolves.toBeUndefined();
      await expect(
        storage.readAudio({
          storagePath: outsidePath,
          mimeType: "audio/mpeg",
          rangeHeader: undefined
        })
      ).rejects.toMatchObject({
        code: "object_not_found",
        category: "not_found",
        sourceLayer: "capability",
        statusCode: 404
      });
    } finally {
      await rm(mediaUploadDir, { recursive: true, force: true });
    }
  });

  it("returns structured object storage errors for invalid uploads", async () => {
    const storage = new SermonAudioStorageService({
      async saveAudio() {
        throw new Error("driver should not be called");
      },
      async deleteAudio() {},
      async readAudio() {
        throw new Error("driver should not be called");
      }
    });

    await expect(
      Promise.resolve().then(() =>
        storage.saveAudio({
          sermonId: "sermon-1",
          buffer: Buffer.from("not audio"),
          fileName: "sermon.txt",
          mimeType: "text/plain"
        })
      )
    ).rejects.toMatchObject({
      code: "object_upload_failed",
      category: "validation_error",
      sourceLayer: "capability",
      recoverable: true,
      retryable: false,
      nextAction: "review_request"
    });
  });

  it("wraps provider deletion failures as retryable capability errors", async () => {
    const storage = new SermonAudioStorageService({
      async saveAudio() {
        throw new Error("driver should not be called");
      },
      async deleteAudio() {
        throw new Error("provider unavailable");
      },
      async readAudio() {
        throw new Error("driver should not be called");
      }
    });

    await expect(
      storage.deleteAudio("memory:sermon/audio.mp3")
    ).rejects.toMatchObject({
      code: "object_delete_failed",
      category: "external_dependency_failed",
      sourceLayer: "capability",
      statusCode: 503,
      recoverable: true,
      retryable: true,
      nextAction: "retry"
    });
  });
});

async function streamText(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

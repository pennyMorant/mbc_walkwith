import { describe, expect, it } from "vitest";

import type { MediaRepository } from "../src/modules/media/media.repository.js";
import { InMemoryMediaRepository } from "../src/modules/media/in-memory-media.repository.js";
import { InMemoryMediaCleanupRepository } from "../src/modules/media/in_memory_media_cleanup.repository.js";
import {
  MediaStorageService,
  type MediaStorageDriver
} from "../src/modules/media/media-storage.service.js";
import { MediaService } from "../src/modules/media/media.service.js";
import { MediaCleanupService } from "../src/modules/media/media_cleanup.service.js";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("MediaService", () => {
  it("consumes the cleanup candidate when metadata binding succeeds", async () => {
    const storage = new MediaStorageService({
      async put() {
        return { storageKey: "local:bound.png", publicUrl: null };
      },
      async read() {
        return null;
      },
      async relocate() {
        throw new Error("not used");
      },
      async delete() {}
    });
    const cleanupRepository = new InMemoryMediaCleanupRepository();
    const cleanupService = new MediaCleanupService(cleanupRepository, storage);
    const service = new MediaService(
      new InMemoryMediaRepository(cleanupRepository),
      storage,
      cleanupService
    );

    await service.uploadImage({
      buffer: onePixelPng,
      fileName: "bound.png",
      mimeType: "image/png",
      kind: "image",
      visibility: "private",
      consentStatus: "pending",
      altText: "",
      caption: "",
      copyrightSource: null
    });

    expect(await cleanupService.list({ limit: 50 })).toEqual([]);
  });

  it("removes a newly uploaded object when metadata persistence fails", async () => {
    const deleted: string[] = [];
    const storageDriver: MediaStorageDriver = {
      async put() {
        return {
          storageKey: "local:uncommitted.png",
          publicUrl: "http://localhost/media/uncommitted/content"
        };
      },
      async read() {
        return null;
      },
      async relocate() {
        throw new Error("not used");
      },
      async delete(storageKey) {
        deleted.push(storageKey);
      }
    };
    const repository: MediaRepository = {
      async create() {
        throw new Error("database unavailable");
      },
      async getById() {
        return null;
      },
      async getByIds() {
        return [];
      },
      async getStorageKey() {
        return null;
      },
      async list() {
        return [];
      },
      async update() {
        return null;
      }
    };
    const service = new MediaService(
      repository,
      new MediaStorageService(storageDriver),
      new MediaCleanupService(
        new InMemoryMediaCleanupRepository(),
        new MediaStorageService(storageDriver)
      )
    );

    await expect(
      service.uploadImage({
        buffer: onePixelPng,
        fileName: "uncommitted.png",
        mimeType: "image/png",
        kind: "image",
        visibility: "public",
        consentStatus: "approved",
        altText: "",
        caption: "",
        copyrightSource: null
      })
    ).rejects.toThrow("database unavailable");
    expect(deleted).toEqual(["local:uncommitted.png"]);
  });

  it("retains a retryable cleanup task when object deletion fails", async () => {
    let deletionShouldFail = true;
    const storage = new MediaStorageService({
      async put() {
        return { storageKey: "local:orphan.png", publicUrl: null };
      },
      async read() {
        return null;
      },
      async relocate() {
        throw new Error("not used");
      },
      async delete() {
        if (deletionShouldFail) throw new Error("storage unavailable");
      }
    });
    const cleanupRepository = new InMemoryMediaCleanupRepository();
    const cleanupService = new MediaCleanupService(cleanupRepository, storage);
    const repository = failingMediaRepository();
    const service = new MediaService(repository, storage, cleanupService);

    await expect(
      service.uploadImage({
        buffer: onePixelPng,
        fileName: "orphan.png",
        mimeType: "image/png",
        kind: "image",
        visibility: "private",
        consentStatus: "pending",
        altText: "",
        caption: "",
        copyrightSource: null
      })
    ).rejects.toThrow("database unavailable");

    const [failed] = await cleanupService.list({ status: "failed", limit: 50 });
    expect(failed).toMatchObject({
      reason: "unbound_upload",
      status: "failed",
      attempts: 1
    });
    expect(failed).not.toHaveProperty("storageKey");

    deletionShouldFail = false;
    const retried = await cleanupService.retry(failed!.id);
    expect(retried).toMatchObject({ status: "succeeded", attempts: 2 });
  });
});

function failingMediaRepository(): MediaRepository {
  return {
    async create() {
      throw new Error("database unavailable");
    },
    async getById() {
      return null;
    },
    async getByIds() {
      return [];
    },
    async getStorageKey() {
      return null;
    },
    async list() {
      return [];
    },
    async update() {
      return null;
    }
  };
}

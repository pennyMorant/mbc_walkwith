import { describe, expect, it } from "vitest";

import type { MediaRepository } from "../src/modules/media/media.repository.js";
import {
  MediaStorageService,
  type MediaStorageDriver
} from "../src/modules/media/media-storage.service.js";
import { MediaService } from "../src/modules/media/media.service.js";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("MediaService", () => {
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
      new MediaStorageService(storageDriver)
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
});

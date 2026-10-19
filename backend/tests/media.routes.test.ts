import {
  mediaAssetSchema,
  mediaAssetUsageListResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("media routes", () => {
  it("stores an image, records metadata, and serves public content", async () => {
    const harness = await buildTestApp();
    const session = await login(harness.app);

    try {
      const uploadResponse = await harness.app.inject({
        method: "POST",
        url: "/v1/admin/media/images?altText=Sunday%20worship&consentStatus=approved",
        headers: {
          authorization: `Bearer ${session.accessToken}`,
          "content-type": "image/png",
          "x-file-name": encodeURIComponent("sunday worship.png")
        },
        payload: onePixelPng
      });
      expect(uploadResponse.statusCode).toBe(200);
      const asset = expectResponseData(
        uploadResponse,
        mediaAssetSchema,
        "media upload"
      );
      expect(asset.altText).toBe("Sunday worship");
      expect(asset.url).toContain(`/v1/media/${asset.id}/content`);

      const contentResponse = await harness.app.inject({
        method: "GET",
        url: `/v1/media/${asset.id}/content`
      });
      expect(contentResponse.statusCode).toBe(200);
      expect(contentResponse.headers["content-type"]).toContain("image/png");
      expect(contentResponse.headers["cross-origin-resource-policy"]).toBe(
        "cross-origin"
      );
      expect(contentResponse.headers["cache-control"]).toBe("no-store");
      expect(contentResponse.rawPayload.equals(onePixelPng)).toBe(true);

      const listResponse = await harness.app.inject({
        method: "GET",
        url: "/v1/admin/media?kind=image",
        headers: { authorization: `Bearer ${session.accessToken}` }
      });
      expect(listResponse.statusCode).toBe(200);
      expect(listResponse.json().data.items).toHaveLength(1);
      expect(JSON.stringify(listResponse.json())).not.toContain("storageKey");
    } finally {
      await harness.close();
    }
  });

  it("rejects a body whose bytes do not match its image content type", async () => {
    const harness = await buildTestApp();
    const session = await login(harness.app);

    try {
      const response = await harness.app.inject({
        method: "POST",
        url: "/v1/admin/media/images",
        headers: {
          authorization: `Bearer ${session.accessToken}`,
          "content-type": "image/png",
          "x-file-name": "fake.png"
        },
        payload: Buffer.from("not an image")
      });
      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe("media_image_invalid");
    } finally {
      await harness.close();
    }
  });

  it("reports canonical Life and public landing image usages", async () => {
    const harness = await buildTestApp();
    const session = await login(harness.app);
    const headers = { authorization: `Bearer ${session.accessToken}` };

    try {
      const uploadResponse = await harness.app.inject({
        method: "POST",
        url: "/v1/admin/media/images",
        headers: {
          ...headers,
          "content-type": "image/png",
          "x-file-name": "shared.png"
        },
        payload: onePixelPng
      });
      const asset = expectResponseData(
        uploadResponse,
        mediaAssetSchema,
        "shared media upload"
      );

      const lifeResponse = await harness.app.inject({
        method: "POST",
        url: "/v1/admin/life-posts",
        headers,
        payload: {
          type: "announcement",
          title: "Shared image announcement",
          body: "This post uses the shared image.",
          meta: "",
          iconName: "church",
          imageMediaId: asset.id,
          visibility: "private"
        }
      });
      expect(lifeResponse.statusCode).toBe(200);

      const settingResponse = await harness.app.inject({
        method: "PATCH",
        url: "/v1/admin/settings/publicLanding.gallery",
        headers,
        payload: {
          value: {
            eyebrow: "Gallery",
            title: "Church life",
            body: "Shared moments",
            items: [
              {
                id: "shared-image",
                mediaId: asset.id,
                altText: "Church gathering",
                title: "Together",
                body: "A church gathering",
                sort: 10
              }
            ]
          }
        }
      });
      expect(settingResponse.statusCode).toBe(200);

      const usageResponse = await harness.app.inject({
        method: "GET",
        url: `/v1/admin/media/${asset.id}/usages`,
        headers
      });
      expect(usageResponse.statusCode).toBe(200);
      const usages = expectResponseData(
        usageResponse,
        mediaAssetUsageListResponseSchema,
        "media usages"
      );
      expect(usages.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: "life_post",
            sourceLabel: "Shared image announcement",
            slot: "life_post_image"
          }),
          expect.objectContaining({
            source: "public_landing",
            sourceId: "publicLanding.gallery#shared-image",
            slot: "landing_gallery_image"
          })
        ])
      );
    } finally {
      await harness.close();
    }
  });

  it("keeps pending media private and relocates it across consent changes", async () => {
    const harness = await buildTestApp();
    const session = await login(harness.app);
    const authorization = `Bearer ${session.accessToken}`;

    try {
      const uploadResponse = await harness.app.inject({
        method: "POST",
        url: "/v1/admin/media/images?consentStatus=pending",
        headers: {
          authorization,
          "content-type": "image/png",
          "x-file-name": "pending.png"
        },
        payload: onePixelPng
      });
      expect(uploadResponse.statusCode).toBe(200);
      const pending = expectResponseData(
        uploadResponse,
        mediaAssetSchema,
        "pending media upload"
      );
      expect(pending.url).toBeNull();
      expect(
        (
          await harness.app.inject({
            method: "GET",
            url: `/v1/media/${pending.id}/content`
          })
        ).statusCode
      ).toBe(404);

      const approvalResponse = await harness.app.inject({
        method: "PATCH",
        url: `/v1/admin/media/${pending.id}`,
        headers: { authorization },
        payload: { consentStatus: "approved" }
      });
      const approved = expectResponseData(
        approvalResponse,
        mediaAssetSchema,
        "approved media"
      );
      expect(approved.url).toContain(`/v1/media/${pending.id}/content`);
      expect(
        (
          await harness.app.inject({
            method: "GET",
            url: `/v1/media/${pending.id}/content`
          })
        ).statusCode
      ).toBe(200);

      const restrictionResponse = await harness.app.inject({
        method: "PATCH",
        url: `/v1/admin/media/${pending.id}`,
        headers: { authorization },
        payload: { consentStatus: "restricted" }
      });
      const restricted = expectResponseData(
        restrictionResponse,
        mediaAssetSchema,
        "restricted media"
      );
      expect(restricted.url).toBeNull();
      expect(
        (
          await harness.app.inject({
            method: "GET",
            url: `/v1/media/${pending.id}/content`
          })
        ).statusCode
      ).toBe(404);
    } finally {
      await harness.close();
    }
  });

  it("never exposes an approved asset whose visibility is private", async () => {
    const harness = await buildTestApp();
    const session = await login(harness.app);

    try {
      const uploadResponse = await harness.app.inject({
        method: "POST",
        url: "/v1/admin/media/images?visibility=private&consentStatus=approved",
        headers: {
          authorization: `Bearer ${session.accessToken}`,
          "content-type": "image/png",
          "x-file-name": "private.png"
        },
        payload: onePixelPng
      });
      const asset = expectResponseData(
        uploadResponse,
        mediaAssetSchema,
        "private media upload"
      );
      expect(asset.url).toBeNull();
      const contentResponse = await harness.app.inject({
        method: "GET",
        url: `/v1/media/${asset.id}/content`
      });
      expect(contentResponse.statusCode).toBe(404);
    } finally {
      await harness.close();
    }
  });
});

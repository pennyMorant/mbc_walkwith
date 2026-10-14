import {
  appSettingListResponseSchema,
  appSettingSchema,
  lifePostSchema,
  publicLandingResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("public landing routes", () => {
  it("returns public landing resources without sermon content", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const response = await app.inject({
      method: "GET",
      url: "/v1/public/landing"
    });

    expect(response.statusCode).toBe(200);
    const landing = expectResponseData(
      response,
      publicLandingResponseSchema,
      "public landing"
    );
    expect(landing.identity.name).toBe("格兰朵拉国语浸信会");
    expect(landing.locale).toBe("zh-Hans");
    expect(landing.identity.logoUrl).toBe("/mbc_web_logo.png");
    expect(landing.identity.mission).toBe("造就门徒，差派工人，领人归主");
    expect(landing.hero.imageUrl).toBe("");
    expect(landing.service.imageUrl).toBe("");
    expect(landing.service.facts).toEqual([]);
    expect(landing.schedule.items).toEqual([]);
    expect(landing.people.items).toEqual([]);
    expect(landing.events.items).toEqual([]);
    expect(landing.contact.links).toEqual([]);
    expect(landing.entrance.actions.every((action) => action.kind === "anchor"))
      .toBe(true);
    expect(landing.hero.quickActions.map((action) => action.id)).not.toContain(
      "quick-sermons"
    );
    expect(landing.navigation.map((action) => action.title)).not.toContain(
      "讲道"
    );
    expect(landing.brandAction.href).toBe("#top");
    expect(landing.headerActions.map((action) => action.href)).toEqual([
      "#service",
      "#contact"
    ]);
    expect(landing.footerActions.map((action) => action.href)).toEqual(["#top"]);
    expect(landing.entrance.actions.length).toBeGreaterThan(0);
    await harness.close();
  });

  it("projects upcoming published events from the life feature", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        type: "event",
        title: "Community welcome lunch",
        body: "Meet church families and ministry leaders after worship.",
        meta: "Fellowship Hall",
        startsAt: "2099-06-20T20:30:00.000Z",
        endsAt: "2099-06-20T22:00:00.000Z",
        visibility: "private",
        ctaLabel: "Event details",
        ctaUrl: "https://example.com/events/welcome-lunch"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const created = expectResponseData(
      createResponse,
      lifePostSchema,
      "landing event create"
    );

    const reviewResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${created.id}/submit-review`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(created.revision)
      }
    });
    const reviewed = expectResponseData(
      reviewResponse,
      lifePostSchema,
      "landing event review"
    );
    const publishResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${created.id}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(reviewed.revision)
      }
    });
    expect(publishResponse.statusCode).toBe(200);

    const landingResponse = await app.inject({
      method: "GET",
      url: "/v1/public/landing?locale=en"
    });
    const landing = expectResponseData(
      landingResponse,
      publicLandingResponseSchema,
      "public landing with events"
    );
    expect(landing.events.items).toEqual([
      expect.objectContaining({
        id: created.id,
        title: "Community welcome lunch",
        summary: "Fellowship Hall",
        ctaLabel: "Event details"
      })
    ]);
    await harness.close();
  });

  it("returns localized public landing resources by locale query", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const spanishResponse = await app.inject({
      method: "GET",
      url: "/v1/public/landing?locale=es"
    });
    expect(spanishResponse.statusCode).toBe(200);
    const spanishLanding = expectResponseData(
      spanishResponse,
      publicLandingResponseSchema,
      "spanish public landing"
    );
    expect(spanishLanding.locale).toBe("es");
    expect(spanishLanding.identity.name).toBe(
      "Iglesia Bautista Mandarin de Glendora"
    );
    expect(spanishLanding.navigation.map((action) => action.title)).toContain(
      "Soy nuevo"
    );

    const traditionalResponse = await app.inject({
      method: "GET",
      url: "/v1/public/landing?locale=zh-Hant"
    });
    expect(traditionalResponse.statusCode).toBe(200);
    const traditionalLanding = expectResponseData(
      traditionalResponse,
      publicLandingResponseSchema,
      "traditional public landing"
    );
    expect(traditionalLanding.locale).toBe("zh-Hant");
    expect(traditionalLanding.identity.name).toBe("格蘭朵拉國語浸信會");
    await harness.close();
  });

  it("uses admin settings as public landing resource source of truth", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const settingsResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/settings?category=public_landing",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(settingsResponse.statusCode).toBe(200);
    const settings = expectResponseData(
      settingsResponse,
      appSettingListResponseSchema,
      "public landing settings"
    );
    expect(settings.items.map((setting) => setting.key)).toContain(
      "publicLanding.contact"
    );
    expect(settings.items.map((setting) => setting.key)).toContain(
      "publicLanding.schedule"
    );
    expect(settings.items.map((setting) => setting.key)).toContain(
      "publicLanding.people"
    );
    expect(settings.items.map((setting) => setting.key)).toContain(
      "publicLanding.events"
    );
    expect(settings.items.map((setting) => setting.key)).toContain(
      "publicLanding.es.contact"
    );

    const publicResponse = await app.inject({
      method: "GET",
      url: "/v1/public/landing"
    });
    const landing = expectResponseData(
      publicResponse,
      publicLandingResponseSchema,
      "public landing before setting update"
    );
    const updatedContact = {
      ...landing.contact,
      links: [
        ...landing.contact.links,
        {
          id: "contact-app-store",
          title: "App Store",
          subtitle: null,
          href: "https://apps.apple.com/",
          iconName: "mdi-apple",
          kind: "external_link",
          target: "new_tab"
        }
      ]
    };

    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/publicLanding.contact",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: updatedContact
      }
    });

    expect(updateResponse.statusCode).toBe(200);
    const updatedSetting = expectResponseData(
      updateResponse,
      appSettingSchema,
      "updated public landing contact setting"
    );
    expect(updatedSetting.key).toBe("publicLanding.contact");

    const afterResponse = await app.inject({
      method: "GET",
      url: "/v1/public/landing"
    });
    const afterLanding = expectResponseData(
      afterResponse,
      publicLandingResponseSchema,
      "public landing after setting update"
    );
    expect(afterLanding.contact.links.map((link) => link.id)).toContain(
      "contact-app-store"
    );
    expect(afterLanding.contact.links.at(-1)?.href).toBe(
      "https://apps.apple.com/"
    );
    await harness.close();
  });

  it("rejects invalid public landing settings before publishing", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const invalidResponse = await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/publicLanding.contact",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: {
          title: "Broken contact"
        }
      }
    });

    expect(invalidResponse.statusCode).toBe(400);
    expect(invalidResponse.json().error).toMatchObject({
      code: "setting_value_invalid",
      category: "validation_error",
      sourceLayer: "feature",
      evidence: {
        settingKey: "publicLanding.contact"
      },
      nextAction: "review_request"
    });
    await harness.close();
  });

  it("rejects invalid localized public landing settings", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const invalidResponse = await app.inject({
      method: "PATCH",
      url: "/v1/admin/settings/publicLanding.es.contact",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        value: {
          title: "Broken contact"
        }
      }
    });

    expect(invalidResponse.statusCode).toBe(400);
    expect(invalidResponse.json().error).toMatchObject({
      code: "setting_value_invalid",
      evidence: {
        settingKey: "publicLanding.es.contact"
      }
    });
    await harness.close();
  });
});

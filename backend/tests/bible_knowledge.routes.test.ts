import {
  bibleKnowledgeEntitySchema,
  bibleKnowledgeListResponseSchema,
  deletedResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("Bible knowledge routes", () => {
  it("returns public Bible knowledge entities for the mobile reader", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const response = await app.inject({
      method: "GET",
      url: "/v1/bible-knowledge?type=person&translationId=web&locale=en"
    });

    expect(response.statusCode).toBe(200);
    const entities = expectResponseData(
      response,
      bibleKnowledgeListResponseSchema,
      "public Bible knowledge list"
    );
    expect(entities.items[0]?.id).toBe("jesus");
    expect(entities.items[0]?.status).toBe("published");

    const localizedResponse = await app.inject({
      method: "GET",
      url: "/v1/bible-knowledge?type=person&translationId=cuvs&locale=zh-Hans"
    });
    expect(localizedResponse.statusCode).toBe(200);
    const localizedEntities = expectResponseData(
      localizedResponse,
      bibleKnowledgeListResponseSchema,
      "localized Bible knowledge list"
    );
    expect(localizedEntities.items.map((entity) => entity.id)).not.toContain(
      "jesus"
    );
    await harness.close();
  });

  it("manages Bible knowledge entities through admin API", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/bible-knowledge",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        id: "test-paul",
        type: "person",
        locale: "en",
        translationId: "web",
        name: "Paul",
        category: "Apostle",
        summary: "Apostle to the Gentiles.",
        description: "Paul wrote several New Testament letters.",
        sections: [
          {
            type: "overview",
            title: "Overview",
            body: "Paul appears in Acts and several letters."
          },
          {
            type: "ministry",
            title: "Ministry",
            body: "His ministry carried the gospel to Gentile churches."
          }
        ],
        aliases: ["Paul", "Apostle Paul"],
        verseAliases: {
          "act.9.1": ["Saul"]
        },
        status: "draft"
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const created = expectResponseData(
      createResponse,
      bibleKnowledgeEntitySchema,
      "admin Bible knowledge create"
    );
    expect(created.id).toBe("test-paul");
    expect(created.sections).toHaveLength(2);

    const listResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/bible-knowledge?query=paul&type=person",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(listResponse.statusCode).toBe(200);
    const entities = expectResponseData(
      listResponse,
      bibleKnowledgeListResponseSchema,
      "admin Bible knowledge list"
    );
    expect(
      entities.items.map((entity: { id: string }) => entity.id)
    ).toContain("test-paul");
    expect(
      entities.items.find((entity: { id: string }) => entity.id === "test-paul")
        ?.sections[1]?.title
    ).toBe("Ministry");

    const wrongLocaleResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/bible-knowledge?query=paul&type=person&locale=zh-Hans&translationId=cuvs",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(wrongLocaleResponse.statusCode).toBe(200);
    const wrongLocaleEntities = expectResponseData(
      wrongLocaleResponse,
      bibleKnowledgeListResponseSchema,
      "admin Bible knowledge list wrong locale"
    );
    expect(
      wrongLocaleEntities.items.map((entity: { id: string }) => entity.id)
    ).not.toContain("test-paul");

    const updateResponse = await app.inject({
      method: "PATCH",
      url: "/v1/admin/bible-knowledge/test-paul?locale=en&translationId=web",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        status: "published",
        summary: "Published summary",
        sections: [
          {
            type: "application",
            title: "Application",
            body: "Use this entry when Acts or Pauline letters mention Paul."
          }
        ]
      }
    });
    expect(updateResponse.statusCode).toBe(200);
    const updated = expectResponseData(
      updateResponse,
      bibleKnowledgeEntitySchema,
      "admin Bible knowledge update"
    );
    expect(updated.status).toBe("published");
    expect(updated.sections[0]?.title).toBe("Application");

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/v1/admin/bible-knowledge/test-paul?locale=en&translationId=web",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(deleteResponse.statusCode).toBe(200);
    const deleted = expectResponseData(
      deleteResponse,
      deletedResponseSchema,
      "Bible knowledge delete"
    );
    expect(deleted.deleted).toBe(true);

    const repeatDeleteResponse = await app.inject({
      method: "DELETE",
      url: "/v1/admin/bible-knowledge/test-paul?locale=en&translationId=web",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(repeatDeleteResponse.statusCode).toBe(404);
    expect(repeatDeleteResponse.json().error).toMatchObject({
      code: "bible_knowledge_not_found",
      category: "not_found",
      sourceLayer: "feature",
      recoverable: true,
      retryable: false,
      nextAction: "refresh",
      evidence: {
        entityId: "test-paul",
        locale: "en",
        translationId: "web"
      }
    });
    await harness.close();
  });
});

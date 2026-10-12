import { describe, expect, it } from "vitest";

import {
  buildBibleKnowledgeEntitiesFromAssets,
  summarizeBibleKnowledgeAssetImport
} from "../src/modules/bible-knowledge/bible-knowledge-asset-importer.js";

describe("Bible knowledge asset importer", () => {
  it("expands packaged multilingual people and places into backend entities", () => {
    const rows = buildBibleKnowledgeEntitiesFromAssets({
      people: [
        {
          id: "paul",
          nameEn: "Paul",
          nameZhHans: "保罗",
          nameZhHant: "保羅",
          roleEn: "Apostle to the Gentiles",
          roleZhHans: "外邦人的使徒",
          roleZhHant: "外邦人的使徒",
          descriptionEn: "Paul was an apostle and missionary.",
          descriptionZhHans: "保罗是使徒和宣教者。",
          descriptionZhHant: "保羅是使徒和宣教者。",
          summaryEn: "Paul served Gentile churches.",
          summaryZhHans: "保罗服事外邦教会。",
          summaryZhHant: "保羅服事外邦教會。",
          sections: [
            {
              type: "identity",
              titleEn: "Identity",
              titleZhHans: "身份",
              titleZhHant: "身份",
              bodyEn: "Acts also calls Paul Saul.",
              bodyZhHans: "使徒行传也称保罗为扫罗。",
              bodyZhHant: "使徒行傳也稱保羅為掃羅。"
            }
          ],
          aliases: {
            web: ["Paul", "Apostle Paul"],
            cuvs: ["保罗"],
            cuvt: ["保羅"]
          },
          verseAliases: {
            "act.9.1": {
              web: ["Saul"],
              cuvs: ["扫罗"],
              cuvt: ["掃羅"]
            }
          }
        }
      ],
      places: [
        {
          id: "jerusalem",
          nameEn: "Jerusalem",
          nameZhHans: "耶路撒冷",
          nameZhHant: "耶路撒冷",
          categoryEn: "City",
          categoryZhHans: "城市",
          categoryZhHant: "城市",
          descriptionEn: "Jerusalem was central to worship.",
          descriptionZhHans: "耶路撒冷是敬拜中心。",
          descriptionZhHant: "耶路撒冷是敬拜中心。",
          sections: [],
          aliases: {
            web: ["Jerusalem"],
            cuvs: ["耶路撒冷"],
            cuvt: ["耶路撒冷"]
          }
        }
      ]
    });

    expect(rows).toHaveLength(6);
    expect(summarizeBibleKnowledgeAssetImport(rows)).toEqual({
      total: 6,
      byType: { person: 3, place: 3 },
      byTranslation: { web: 2, cuvs: 2, cuvt: 2 }
    });

    const simplifiedPaul = rows.find(
      (row) => row.id === "paul" && row.translationId === "cuvs"
    );
    expect(simplifiedPaul).toMatchObject({
      locale: "zh-Hans",
      name: "保罗",
      category: "外邦人的使徒",
      aliases: ["保罗"],
      verseAliases: { "act.9.1": ["扫罗"] },
      status: "published"
    });
    expect(simplifiedPaul?.sections[0]).toMatchObject({
      type: "identity",
      title: "身份",
      body: "使徒行传也称保罗为扫罗。"
    });

    const englishJerusalem = rows.find(
      (row) => row.id === "jerusalem" && row.translationId === "web"
    );
    expect(englishJerusalem).toMatchObject({
      locale: "en",
      type: "place",
      summary: "Jerusalem was central to worship."
    });
    expect(englishJerusalem?.sections[0]).toMatchObject({
      type: "overview",
      title: "Overview",
      body: "Jerusalem was central to worship."
    });
  });
});

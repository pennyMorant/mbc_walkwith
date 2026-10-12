import { describe, expect, test } from "bun:test";

describe("admin AI localization", () => {
  test("defines final Spanish and Traditional Chinese AI overrides", async () => {
    const source = await Bun.file(
      new URL("../src/core/i18n/i18n.ts", import.meta.url)
    ).text();
    const spanish = localeAiBlock(source, "messages.es");
    const traditional = localeAiBlock(source, 'messages["zh-Hant"]');

    expect(spanish).toContain('"ai.discardDraft": "Descartar borrador"');
    expect(spanish).toContain("solicitudes de IA");
    expect(spanish).toContain("antes de publicarlo");
    expect(spanish).toContain('"ai.statusUnavailable": "IA no disponible"');

    expect(traditional).toContain('"ai.discardDraft": "捨棄草稿"');
    expect(traditional).toContain("AI 請求或回應不符合系統契約");
    expect(traditional).toContain("目前 AI 服務不支援此任務");
    expect(traditional).toContain('"ai.statusUnavailable": "AI 無法使用"');
  });
});

function localeAiBlock(source: string, localeExpression: string) {
  const marker = `Object.assign(${localeExpression}, {\n  "ai.applyToBody"`;
  const start = source.lastIndexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = source.indexOf("\n});", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

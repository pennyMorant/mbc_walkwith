import type {
  AdminAiDraftRequest,
  AdminAiTask,
  AiDraftResponse,
  AiLocale,
  AiStatusResponse,
  AiTask,
  AiTaskInput,
  MemberAiStudyRequest,
  MemberAiTask
} from "@mbc/api-contracts";

import {
  aiProviderResponseInvalid,
  aiTaskInputRequired
} from "./ai-errors.js";
import type { AiProvider } from "./ai.provider.js";
import { z } from "zod";

const supportedAdminTasks: AdminAiTask[] = [
  "sermon_summary",
  "sermon_outline",
  "life_post_draft",
  "notification_draft"
];

const supportedMemberTasks: MemberAiTask[] = [
  "bible_study_help",
  "sermon_qa"
];

type AiServiceOptions = {
  auditEnabled: boolean;
  maxOutputTokens: number;
};

export class AiService {
  private providerResolver: (task: AiTask | "content_translation") => AiProvider;

  constructor(
    private readonly provider: AiProvider,
    private readonly options: AiServiceOptions
  ) {
    this.providerResolver = () => this.provider;
  }

  setProviderResolver(resolver: (task: AiTask | "content_translation") => AiProvider) {
    this.providerResolver = resolver;
  }

  get auditEnabled() {
    return this.options.auditEnabled;
  }

  status(): AiStatusResponse {
    const provider = this.providerResolver("life_post_draft");
    return {
      enabled: provider.enabled,
      provider: provider.id,
      model: provider.model,
      auditEnabled: this.options.auditEnabled,
      supportedAdminTasks,
      supportedMemberTasks
    };
  }

  async createAdminDraft(
    request: AdminAiDraftRequest
  ): Promise<AiDraftResponse> {
    return this.runTask(request.task, request.locale, request.input);
  }

  async createMemberStudy(
    request: MemberAiStudyRequest
  ): Promise<AiDraftResponse> {
    return this.runTask(request.task, request.locale, request.input);
  }

  async translateContent(locale: AiLocale, fields: Record<string, string>) {
    const provider = this.providerResolver("content_translation");
    const result = await provider.generateText({
      systemPrompt: [
        "You translate approved church content.",
        languageRuleForLocale(locale),
        "Return only one JSON object. Keep exactly the same keys and translate every string value. Do not add Markdown or commentary."
      ].join("\n"),
      userPrompt: JSON.stringify(fields),
      temperature: 0.2,
      maxOutputTokens: maxOutputTokensFor(provider, this.options.maxOutputTokens)
    });
    const parsed = z.record(z.string(), z.string()).safeParse(parseJsonObject(result.text));
    if (!parsed.success || Object.keys(parsed.data).length !== Object.keys(fields).length || Object.keys(fields).some((key) => !(key in parsed.data))) {
      throw aiProviderResponseInvalid(result.provider ?? provider.id);
    }
    return { fields: parsed.data, provider: result.provider ?? provider.id, model: result.model ?? provider.model, usage: result.usage, latencyMs: result.latencyMs };
  }

  private async runTask(
    task: AiTask,
    locale: AiLocale,
    input: AiTaskInput
  ): Promise<AiDraftResponse> {
    if (!hasTaskInput(input)) {
      throw aiTaskInputRequired(task);
    }

    const provider = this.providerResolver(task);
    const result = await provider.generateText({
      systemPrompt: buildSystemPrompt(task, locale),
      userPrompt: buildUserPrompt(task, input),
      temperature: temperatureForTask(task),
      maxOutputTokens: maxOutputTokensFor(provider, this.options.maxOutputTokens)
    });

    const markdown = result.text.trim();
    if (!markdown) {
      throw aiProviderResponseInvalid(provider.id);
    }

    return {
      task,
      markdown,
      provider: result.provider ?? provider.id,
      model: result.model ?? provider.model ?? "unknown",
      safetyNotice: safetyNoticeForTask(task, locale),
      usage: result.usage,
      latencyMs: result.latencyMs
    };
  }
}

function maxOutputTokensFor(provider: AiProvider, fallback: number) {
  return provider.maxOutputTokens ?? fallback;
}

function parseJsonObject(value: string): unknown {
  try { return JSON.parse(value.trim()); } catch { return null; }
}

export function summarizeAiTaskInput(input: AiTaskInput) {
  return {
    hasTitle: Boolean(input.title?.trim()),
    hasBody: Boolean(input.body?.trim()),
    hasReference: Boolean(input.reference?.trim()),
    hasQuestion: Boolean(input.question?.trim()),
    hasAudience: Boolean(input.audience?.trim()),
    contextCount: input.context.length,
    bodyLength: input.body?.trim().length ?? 0,
    questionLength: input.question?.trim().length ?? 0
  };
}

function hasTaskInput(input: AiTaskInput): boolean {
  return (
    Boolean(input.title?.trim()) ||
    Boolean(input.body?.trim()) ||
    Boolean(input.reference?.trim()) ||
    Boolean(input.question?.trim()) ||
    input.context.some((item) => item.value.trim().length > 0)
  );
}

function buildSystemPrompt(task: AiTask, locale: AiLocale): string {
  const languageRule = languageRuleForLocale(locale);
  const baseRules = [
    "You are an assistant for a local church app.",
    "Respect Christian pastoral tone while staying concise and practical.",
    "Do not claim pastoral authority, final doctrine authority, legal advice, tax advice, medical advice, or financial advice.",
    "Do not invent facts about the church, people, donations, events, or schedules.",
    "Use Markdown only. Avoid tables unless the task explicitly benefits from them.",
    languageRule
  ];

  return [...baseRules, taskRule(task)].join("\n");
}

function buildUserPrompt(task: AiTask, input: AiTaskInput): string {
  const sections = [
    `Task: ${task}`,
    optionalLine("Title", input.title),
    optionalLine("Reference", input.reference),
    optionalLine("Audience", input.audience),
    optionalLine("Question", input.question),
    optionalBlock("Body", input.body),
    contextBlock(input)
  ].filter(Boolean);

  return sections.join("\n\n");
}

function taskRule(task: AiTask): string {
  switch (task) {
    case "sermon_summary":
      return "Return a sermon summary with a title, 3-5 key points, Bible references if supplied, and short application prompts.";
    case "sermon_outline":
      return "Return 3-8 Markdown bullet lines in the exact form '- Title: summary'. Include introduction, main points, application, and closing prayer when supported by the source. Do not invent timestamps.";
    case "life_post_draft":
      return "Return a church life post draft suitable for announcements, events, or community updates.";
    case "notification_draft":
      return "Return exactly two lines using the English machine-readable keys 'Title:' and 'Body:' followed by localized content. Do not add headings, bullets, commentary, or extra sections. Keep the body clear, warm, and action-oriented.";
    case "bible_study_help":
      return "Return Bible study help that explains the passage, asks reflection questions, and encourages the user to talk with church leaders for pastoral matters.";
    case "sermon_qa":
      return "Answer based only on the supplied sermon or notes. If context is missing, say what information is needed.";
  }
}

function safetyNoticeForTask(task: AiTask, locale: AiLocale): string {
  const isMemberTask = task === "bible_study_help" || task === "sermon_qa";
  if (locale === "es") {
    return isMemberTask
      ? "La ayuda de IA es solo para reflexionar y no reemplaza el cuidado pastoral ni la enseñanza de la iglesia."
      : "Borrador generado por IA. El personal de la iglesia debe revisarlo, editarlo y aprobarlo antes de publicarlo.";
  }
  if (locale === "zh-Hant") {
    return isMemberTask
      ? "AI 學習輔助僅供反思，不取代牧養關懷或教會教導。"
      : "AI 生成草稿，發布前必須由教會同工審核、編輯並批准。";
  }
  if (locale === "zh-Hans") {
    return isMemberTask
      ? "AI 学习辅助仅供反思，不取代牧养关怀或教会教导。"
      : "AI 生成草稿，发布前必须由教会同工审核、编辑并批准。";
  }
  return isMemberTask
    ? "AI study help is for reflection only and does not replace pastoral care or church teaching."
    : "AI generated draft. Church staff should review, edit, and approve before publishing.";
}

function languageRuleForLocale(locale: AiLocale): string {
  if (locale === "en") {
    return "Respond in English.";
  }
  if (locale === "es") {
    return "Respond in Spanish.";
  }
  if (locale === "zh-Hant") {
    return "Respond in Traditional Chinese.";
  }
  return "Respond in Simplified Chinese.";
}

function temperatureForTask(task: AiTask): number {
  if (task === "notification_draft") {
    return 0.4;
  }
  if (task === "bible_study_help" || task === "sermon_qa") {
    return 0.2;
  }
  return 0.5;
}

function optionalLine(label: string, value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? `${label}: ${trimmed}` : null;
}

function optionalBlock(label: string, value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? `${label}:\n${trimmed}` : null;
}

function contextBlock(input: AiTaskInput): string | null {
  if (input.context.length === 0) {
    return null;
  }

  const lines = input.context.map(
    (item, index) => `${index + 1}. ${item.label}: ${item.value}`
  );
  return `Context:\n${lines.join("\n")}`;
}

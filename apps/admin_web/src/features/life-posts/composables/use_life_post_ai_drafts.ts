import type {
  AiResourceReference,
  AiTaskInput,
  LifePost,
  LifePostVisibility
} from "@mbc/api-contracts";
import { computed, type Ref } from "vue";

type Translate = (key: string) => string;

type LifePostAiDraftForm = {
  type: string;
  title: string;
  body: string;
  meta: string;
  startsAt: string;
  endsAt: string;
  visibility: LifePostVisibility;
  ctaLabel: string;
  ctaUrl: string;
  notifyAppOnPublish: boolean;
  notificationTitle: string;
  notificationBody: string;
};

type UseLifePostAiDraftsInput = {
  form: LifePostAiDraftForm;
  selectedPost: Ref<LifePost | null>;
  t: Translate;
  showToast: (message: string, color?: string) => void;
};

export function useLifePostAiDrafts(input: UseLifePostAiDraftsInput) {
  const { form, selectedPost, t, showToast } = input;

  const lifePostAiInput = computed<AiTaskInput>(() => ({
    title: form.title.trim(),
    body: form.body.trim() || form.meta.trim(),
    audience: form.visibility,
    context: compactAiContext([
      ["Type", form.type],
      ["Meta", form.meta],
      ["Schedule", [form.startsAt, form.endsAt].filter(Boolean).join(" - ")],
      ["Action", [form.ctaLabel, form.ctaUrl].filter(Boolean).join(" ")]
    ])
  }));

  const notificationAiInput = computed<AiTaskInput>(() => ({
    title: form.notificationTitle.trim() || form.title.trim(),
    body: form.notificationBody.trim() || form.body.trim(),
    audience: form.visibility,
    context: compactAiContext([
      ["Post type", form.type],
      ["Post title", form.title],
      ["Post meta", form.meta],
      ["Schedule", [form.startsAt, form.endsAt].filter(Boolean).join(" - ")]
    ])
  }));

  const lifePostAiResource = computed<AiResourceReference>(() => ({
    resourceType: "life_post",
    ...(selectedPost.value?.id ? { resourceId: selectedPost.value.id } : {})
  }));

  function applyLifePostAiDraft(markdown: string) {
    form.body = markdown;
    showToast(t("ai.bodyDraftApplied"));
  }

  function applyNotificationAiDraft(markdown: string) {
    const parsed = notificationDraftFromMarkdown(markdown);
    form.notifyAppOnPublish = true;
    if (!form.notificationTitle.trim()) {
      form.notificationTitle = parsed.title || form.title.trim();
    }
    form.notificationBody = parsed.body || markdown.trim();
    showToast(t("ai.notificationDraftApplied"));
  }

  return {
    lifePostAiInput,
    notificationAiInput,
    lifePostAiResource,
    applyLifePostAiDraft,
    applyNotificationAiDraft
  };
}

function compactAiContext(
  entries: Array<[label: string, value: string]>
): AiTaskInput["context"] {
  return entries
    .map(([label, value]) => ({ label, value: value.trim() }))
    .filter((item) => item.value.length > 0);
}

export function notificationDraftFromMarkdown(markdown: string) {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^[-*]\s*/, "")
        .trim()
    )
    .filter(Boolean);
  const inlineTitle = lines.find((line) => /^title\s*[:：]/i.test(line));
  const inlineBodyIndex = lines.findIndex((line) => /^body\s*[:：]/i.test(line));
  const titleSectionIndex = lines.findIndex((line) => /^title$/i.test(line));
  const bodySectionIndex = lines.findIndex((line) => /^body$/i.test(line));

  const title =
    inlineTitle?.replace(/^title\s*[:：]\s*/i, "").trim() ||
    (titleSectionIndex >= 0 ? lines[titleSectionIndex + 1] : "") ||
    lines.find((line) => !/^(?:title|body)$/i.test(line)) ||
    "";
  const bodyStart = inlineBodyIndex >= 0 ? inlineBodyIndex : bodySectionIndex;
  const bodyPrefix =
    inlineBodyIndex >= 0
      ? lines[inlineBodyIndex]?.replace(/^body\s*[:：]\s*/i, "").trim() ?? ""
      : "";
  const bodyTail = bodyStart >= 0 ? lines.slice(bodyStart + 1) : lines.slice(1);
  const body = [bodyPrefix, ...bodyTail]
    .filter((line) => line && !/^(?:title|body)$/i.test(line))
    .join(" ")
    .trim();
  return {
    title: title.slice(0, 120),
    body: (body || title).slice(0, 180)
  };
}

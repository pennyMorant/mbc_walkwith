import { describe, expect, test } from "bun:test";

import {
  buildLifePostPayload,
  buildLifePostPreview,
  buildLifePostPublishRequest,
  createLifePostEditorForm,
  isLifePostCtaUrlValid,
  isLifePostScheduleValid
} from "../src/features/life-posts/life_post_editor_models";

describe("life post editor models", () => {
  test("removes disabled registration values from the save intent", () => {
    const form = createLifePostEditorForm();
    form.title = "Sunday gathering";
    form.registrationCapacity = 80;
    form.registrationDeadline = "2026-08-01T12:00";

    expect(buildLifePostPayload(form, "draft")).toMatchObject({
      title: "Sunday gathering",
      registrationEnabled: false,
      registrationCapacity: null,
      registrationDeadline: null,
      status: "draft"
    });
  });

  test("builds one publish intent with optional content and notification", () => {
    const form = createLifePostEditorForm();
    form.visibility = "members";
    expect(buildLifePostPublishRequest(form)).toEqual({
      visibility: "members",
      notifyApp: false
    });

    form.notifyAppOnPublish = true;
    form.notificationTitle = "  Fellowship dinner  ";
    expect(buildLifePostPublishRequest(form)).toEqual({
      visibility: "members",
      notifyApp: true,
      notification: { sourceLocale: "zh-Hans", title: "Fellowship dinner" }
    });

    const content = buildLifePostPayload(form, null);
    expect(buildLifePostPublishRequest(form, content)).toMatchObject({
      visibility: "members",
      content,
      notifyApp: true,
      notification: { sourceLocale: "zh-Hans", title: "Fellowship dinner" }
    });

    form.notificationTranslations.es = {
      title: "Cena de confraternidad",
      body: "Acompáñenos esta noche."
    };
    expect(buildLifePostPublishRequest(form)).toMatchObject({
      notification: {
        translations: {
          es: {
            title: "Cena de confraternidad",
            body: "Acompáñenos esta noche."
          }
        }
      }
    });

    form.notificationTitle = "";
    form.notificationBody = "";
    expect(buildLifePostPublishRequest(form)).toMatchObject({
      notification: {
        sourceLocale: "zh-Hans",
        translations: {
          es: { title: "Cena de confraternidad" }
        }
      }
    });
  });

  test("preserves canonical registration counts in editor previews", () => {
    const form = createLifePostEditorForm();
    form.title = "Church picnic";
    form.registrationEnabled = true;
    form.registrationCapacity = 10;
    const preview = buildLifePostPreview(
      form,
      {
        id: "post-1",
        revision: 7,
        type: "fellowship",
        title: "Existing",
        body: "",
        meta: "",
        iconName: "event",
        startsAt: null,
        endsAt: null,
        visibility: "members",
        imageUrl: null,
        displayWeight: 0,
        ctaLabel: null,
        ctaUrl: null,
        registrationEnabled: true,
        registrationCapacity: 10,
        registrationDeadline: null,
        registrationAllowCancellation: true,
        registrationMaxPartySize: 4,
        registrationSummary: {
          enabled: true,
          capacity: 10,
          registeredCount: 6,
          remainingCount: 4,
          deadline: null,
          allowCancellation: true,
          maxPartySize: 4,
          myRegistrationStatus: null,
          myPartySize: null,
          myNote: null,
          myCheckedInAt: null,
          myCheckInMethod: null
        },
        status: "published",
        updatedAt: "2026-07-13T12:00:00.000Z"
      },
      (key) => key
    );

    expect(preview?.registrationSummary).toMatchObject({
      registeredCount: 6,
      remainingCount: 4
    });
    expect(preview?.revision).toBe(7);
  });

  test("validates schedule ordering and HTTP action URLs", () => {
    const form = createLifePostEditorForm();
    form.startsAt = "2026-08-01T12:00";
    form.endsAt = "2026-08-01T11:00";
    form.ctaUrl = "mailto:someone@example.com";
    expect(isLifePostScheduleValid(form)).toBe(false);
    expect(isLifePostCtaUrlValid(form)).toBe(false);

    form.endsAt = "2026-08-01T13:00";
    form.ctaUrl = "https://example.com/register";
    expect(isLifePostScheduleValid(form)).toBe(true);
    expect(isLifePostCtaUrlValid(form)).toBe(false);

    form.ctaLabel = "Register";
    expect(isLifePostCtaUrlValid(form)).toBe(true);
  });
});

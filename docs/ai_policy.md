# MBC WalkWith AI Policy

Status: active draft

AI is a study assistant, not a pastor, elder, counselor, doctor, lawyer, or financial advisor.

## 1. AI Scope

Allowed first-version AI features:

- Admin content assist:
  - sermon summary draft.
  - sermon outline draft.
  - church life post draft.
  - notification draft.
- Member study assist:
  - Bible study help from supplied reference/question.
  - sermon Q&A from supplied sermon notes or context.

Out of scope for first version:

- Open-ended spiritual counseling bot.
- AI confession or pastoral care replacement.
- AI-generated doctrine statements without review.
- AI answers using private prayer requests by default.
- AI financial or legal advice.
- AI access to giving, annual statement, payment dispute, or pastoral care records.

## 2. Required Source Categories

Study AI responses should identify source categories:

```text
scripture_context
original_language
mainstream_commentary
church_sermon_archive
pastoral_note
```

The app can show user-friendly labels:

```text
经文上下文
原文词义
主流注释资料
本教会讲道资料
牧养提醒
```

## 3. Provider Gateway Requirement

The app and admin Web must not call provider APIs directly.

Pipeline:

```text
App/Admin Web
  -> MBC backend API
  -> AiService task prompt
  -> AI provider adapter
  -> OpenAI, Gemini, or OpenAI-compatible relay
```

Provider keys, base URLs, extra headers, model names, timeouts, and token limits are backend configuration only.

Retrieval-grounded AI can be added later. Until then, every response must be based on user-supplied task input and clearly labeled as AI-generated.

## 4. Tone and Boundaries

AI responses should be:

- Humble.
- Clear.
- Scripture-centered.
- Source-aware.
- Careful with disputed passages.

AI responses should avoid:

- Claiming final authority.
- Speaking as God.
- Presenting one disputed interpretation as the only Christian view.
- Shaming users for questions or doubts.
- Giving medical, legal, or financial instructions.

## 5. Disputed Passages

For disputed passages:

- Name that faithful Christians may differ.
- Present major mainstream views briefly.
- Explain which view is most consistent with the selected source set if appropriate.
- Recommend discussing with church leadership for doctrinal or pastoral decisions.

## 6. Safety Referrals

For crisis, self-harm, abuse, medical, legal, or financial requests:

- Do not provide specialized instructions.
- Encourage contacting qualified help.
- For urgent danger, advise contacting local emergency services.
- For church pastoral care, point to pastor/elder contact path if available.

## 7. Private Data Rules

Do not use the following as AI context by default:

```text
Private prayer requests
Private notes
Giving history
Pastoral care records
Raw user identity
```

Private notes may be used only if the user explicitly chooses a future feature that says their notes will be included.

## 8. Logging and Retention

Allowed to log:

```text
request id
verse id
source categories used
model/provider metadata
latency
error code
```

Avoid logging:

```text
full raw question
private note content
prayer request content
personal identifiers
```

If AI history is added later, it must have:

- Clear user-facing purpose.
- Delete option.
- Retention policy.
- Privacy review.

## 9. Human Review

Generated admin content must be reviewed before publishing:

- Transcript cleanup.
- Sermon summary.
- Sermon outline.
- Scripture references.
- Related sermon links.
- Life post draft.
- Notification draft.

AI study help shown on demand does not need pre-review, but it must be constrained, rate-limited before production, and clearly labeled.

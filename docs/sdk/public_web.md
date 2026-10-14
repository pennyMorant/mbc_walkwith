# Public Web SDK

## Owner

`apps/public_web/src/core/api/client.ts` owns Public Web transport. Vue components receive typed props and never call raw HTTP.

## Landing Read Contract

```text
GET /v1/public/landing?locale=en|es|zh-Hans|zh-Hant
-> publicLandingResponseSchema
```

The response includes identity, church timezone, hero, mission, service information, recurring schedule, public people profiles, upcoming events, visitor entrances, App links, contact links, and footer actions.

Rules:

- Schedule and people use locale-specific section copy and fall back to source-locale items when the requested item list is empty.
- Event dates are formatted in the backend-provided church timezone.
- Events are read-only projections of canonical published Life posts.
- Components do not infer visibility, publication state, date eligibility, or translation fallback.
- API failure produces an explicit page error; there is no client-owned content fallback.

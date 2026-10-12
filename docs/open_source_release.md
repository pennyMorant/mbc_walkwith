# Open Source and Self-Hosting

MBC WalkWith publishes application source code so churches and contributors can
inspect, improve, and self-host the platform. Opening the source does not make a
church deployment, its member records, or its credentials public.

## Repository Boundary

The public repository may contain:

- application, backend, admin Web, public Web, and local tooling source code;
- database schema and Drizzle migrations;
- synthetic fixtures and example configuration;
- documentation and public-domain or explicitly licensed resources;
- generic deployment scripts that require operators to provide secrets.

The public repository must not contain:

- member, visitor, prayer, care, giving, registration, or attendance records;
- production database dumps, object-storage exports, logs, or backups;
- API keys, service-account JSON, passwords, certificates, signing material, or
  Firebase project configuration;
- private server addresses or environment files;
- real church addresses, phone numbers, map links, social accounts, domains, or
  App download URLs; these belong in deployment settings;
- church-authored sermon audio, transcripts, bulletins, or images unless the
  church has explicitly approved their public redistribution.

Production content belongs in Postgres and object storage. Runtime secrets
belong in protected server environment files or a secrets manager. Repository
examples must use reserved domains such as `example.com` and synthetic people.

## License and Brand

The software is licensed under Apache License 2.0. The license does not grant
permission to use MBCG, Mandarin Baptist Church of Glendora, the church logo,
or confusingly similar branding. See `TRADEMARKS.md`.

Third-party resources retain their own terms. See `THIRD_PARTY_NOTICES.md` and
the metadata/license evidence under `packages/bible_content/sources/`.

## Safe Publication Checklist

1. Run `bun run check:public-release` against the exact commit to publish.
2. Run `bun run check` and the relevant Flutter checks.
3. Scan the complete Git history with a maintained secret scanner such as
   Gitleaks or TruffleHog, not only the working tree.
4. Review large/binary files and confirm redistribution rights.
5. Confirm environment files, Firebase configuration, signing keys, database
   exports, uploads, backups, and release packages are untracked.
6. Rotate any credential that was ever exposed, even if it was later removed.
7. Create a private mirror or bundle before any intentional history rewrite.
8. Make the remote public only after the final commit and history both pass.

The repository script is a focused guard, not a substitute for a dedicated
secret scanner or human privacy review.

## Self-Hosting

Start from the tracked `.env.example` files and replace every placeholder in a
local, untracked environment file. Configure your own domains, Postgres,
object storage, Firebase, email, Stripe, and AI providers. Do not reuse MBCG
production credentials or data.

Contributors can run `bun run local:init` to create the ignored
`private/local/` files and `bun run local:check` to validate them without
printing secrets. See `docs/local_environment.md`.

The native VPS path is documented in `docs/vps_deployment.md`; optional Docker
support is documented in `docs/docker_deployment.md`. Both paths deploy the same
backend and Web contracts and neither bundles production secrets.

## Content Ownership

Administrators are responsible for rights to sermon audio, transcripts,
photographs, bulletins, translations, and uploaded files. Private pastoral and
financial records must never be converted into demo fixtures or issue reports.
Use minimal synthetic reproduction data when reporting a bug.

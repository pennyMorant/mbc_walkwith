# Security Policy

## Reporting a Vulnerability

Do not open a public issue for vulnerabilities involving authentication,
authorization, member privacy, giving, payment webhooks, annual statements,
object storage, or secret exposure.

Report the issue privately to the repository maintainers through GitHub's
private vulnerability reporting feature. Include the affected commit, impact,
reproduction steps, and a minimal proof of concept without real member data.

Maintainers should acknowledge a complete report within seven days, assess its
severity, prepare a fix, and coordinate disclosure after affected deployments
have had a reasonable opportunity to update.

## Supported Versions

Security fixes target the current default branch. Self-hosters are responsible
for tracking updates, rotating deployment credentials, backing up Postgres, and
maintaining their operating system and provider accounts.

## Sensitive Data

Never include production credentials, database rows, member details, prayer or
care content, giving records, signed URLs, access tokens, or server logs with
identifiers in issues, pull requests, fixtures, or screenshots.

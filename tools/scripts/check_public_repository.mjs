import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { isIP } from "node:net";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const selfPath = "tools/scripts/check_public_repository.mjs";
const failures = [];

function isNonPublicIpv4(address) {
  const octets = address.split(".").map(Number);
  const [first, second, third] = octets;
  return first === 0 || first === 10 || first === 127 || first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113);
}

function git(args) {
  const candidates = [
    process.env.GIT_BINARY,
    "git",
    "/opt/homebrew/bin/git"
  ].filter((candidate, index, values) =>
    candidate && values.indexOf(candidate) === index
  );
  let lastResult;
  for (const candidate of candidates) {
    if (candidate.includes("/") && !existsSync(candidate)) {
      continue;
    }
    const result = spawnSync(candidate, args, {
      cwd: root,
      encoding: args.includes("-z") ? "buffer" : "utf8"
    });
    lastResult = result;
    if (result.status === 0) {
      return result.stdout;
    }
  }
  throw new Error(
    lastResult?.stderr?.toString() || `git ${args.join(" ")} failed`
  );
}

const repositoryOutput = git([
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "-z"
]);
const repositoryFiles = repositoryOutput
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const forbiddenPaths = [
  /(^|\/)(?:google-services\.json|GoogleService-Info\.plist)$/,
  /(^|\/).*(?:service[-_]?account).*\.json$/i,
  /\.(?:jks|keystore|p12|pem|key|mobileprovision)$/i,
  /\.(?:dump|backup|sqlite|sqlite3|db)$/i,
  /\.(?:apk|aab|ipa|tar\.gz)$/i,
  /(^|\/)(?:backups|private|uploads|var)\//i
];

for (const file of repositoryFiles) {
  const isAllowedEnvExample = /\.env(?:\.production)?\.example$/i.test(file) ||
    /\.env\.example$/i.test(file);
  const isRuntimeEnv = /(^|\/)\.env(?:\.|$)/i.test(file) || /\.env$/i.test(file);
  if (isRuntimeEnv && !isAllowedEnvExample) {
    failures.push(`${file}: runtime environment file is tracked`);
    continue;
  }
  if (forbiddenPaths.some((pattern) => pattern.test(file))) {
    failures.push(`${file}: private runtime or generated artifact is tracked`);
  }
}

const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["AWS access key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{20,}\b/],
  ["Stripe key", /\b(?:sk_(?:live|test)|rk_live)_[A-Za-z0-9]{16,}\b/],
  ["Stripe webhook secret", /\bwhsec_[A-Za-z0-9]{16,}\b/],
  ["OpenAI key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/]
];

const deploymentDataPatterns = [
  ["street address", /\b\d{2,6}\s+[A-Za-z][A-Za-z0-9 .'-]{1,60}\s(?:Ave|Avenue|St|Street|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court)\b/i],
  ["map URL", /https?:\/\/(?:maps\.google\.[^/]+|maps\.apple\.com)\//i],
  ["social-media URL", /https?:\/\/(?:www\.)?(?:facebook|instagram|youtube|x)\.com\//i],
  ["telephone link", /\btel:\+?[\d(]/i]
];

const binaryExtensions = new Set([
  ".aab", ".apk", ".gif", ".ico", ".ipa", ".jpeg", ".jpg", ".mov", ".mp3",
  ".mp4", ".otf", ".pdf", ".png", ".tar", ".ttf", ".wav", ".webp", ".zip"
]);

for (const file of repositoryFiles) {
  if (file === selfPath || binaryExtensions.has(path.extname(file).toLowerCase())) {
    continue;
  }
  const buffer = readFileSync(path.join(root, file));
  if (buffer.includes(0)) {
    continue;
  }
  const content = buffer.toString("utf8");
  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(content)) {
      failures.push(`${file}: possible ${label}`);
    }
  }
  for (const [label, pattern] of deploymentDataPatterns) {
    if (pattern.test(content)) {
      failures.push(`${file}: possible deployment-specific ${label}`);
    }
  }
  const ipv4Candidates = content.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? [];
  for (const address of new Set(ipv4Candidates)) {
    if (isIP(address) === 4 && !isNonPublicIpv4(address)) {
      failures.push(`${file}: fixed public IPv4 address ${address} is present`);
    }
  }
}

const firebasePlaceholder = "apps/mobile/lib/firebase_options.dart";
if (repositoryFiles.includes(firebasePlaceholder)) {
  const source = readFileSync(path.join(root, firebasePlaceholder), "utf8");
  if (!source.includes("Placeholder Firebase options file")) {
    failures.push(
      `${firebasePlaceholder}: replace generated Firebase project values with the public placeholder`
    );
  }
}

for (const required of [
  "LICENSE",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "TRADEMARKS.md",
  "THIRD_PARTY_NOTICES.md",
  "docs/open_source_release.md"
]) {
  if (!repositoryFiles.includes(required)) {
    failures.push(`${required}: required public repository document is missing`);
  }
}

if (failures.length > 0) {
  console.error("Public repository check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Public repository check passed for ${repositoryFiles.length} repository files.`
);

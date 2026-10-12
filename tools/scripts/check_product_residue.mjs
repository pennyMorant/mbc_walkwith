import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const errors = [];

const ignoredDirs = new Set([
  ".git",
  ".dart_tool",
  "build",
  "dist",
  "node_modules"
]);

function walk(dir, predicate) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirs.has(entry.name)) {
      return [];
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath, predicate);
    }

    return predicate(fullPath) ? [fullPath] : [];
  });
}

function relative(fullPath) {
  return path.relative(root, fullPath);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assertNoPattern(files, pattern, reason) {
  for (const file of files) {
    const source = read(file);
    if (pattern.test(source)) {
      errors.push(`${file}: ${reason}`);
    }
  }
}

const sermonCodeFiles = walk(root, (file) => {
  const rel = relative(file);
  if (!/\.(dart|ts|vue|md)$/.test(rel)) {
    return false;
  }

  return (
    rel.startsWith("apps/mobile/lib/features/sermons/") ||
    rel.startsWith("apps/admin_web/src/features/sermons/") ||
    rel.startsWith("backend/src/modules/sermons/") ||
    rel.startsWith("backend/src/modules/admin/sermons/") ||
    rel === "docs/features/sermon_publishing.md" ||
    rel === "docs/features/sermon_discovery.md"
  );
}).map(relative);

assertNoPattern(
  sermonCodeFiles,
  /\byoutube\b/i,
  "sermon flow must not reintroduce YouTube import"
);

assertNoPattern(
  sermonCodeFiles,
  /\b(?:transcription|transcribe)\b[\s\S]{0,80}\bworker\b|\bworker\b[\s\S]{0,80}\b(?:transcription|transcribe)\b/i,
  "sermon flow must keep transcription in local tooling, not backend/admin worker code"
);

const legacyYoutubeFiles = walk(
  path.join(root, "backend/src/modules/media/youtube"),
  () => true
).map(relative);

for (const file of legacyYoutubeFiles) {
  errors.push(`${file}: legacy YouTube media module must stay removed`);
}

const adminVueFiles = walk(path.join(root, "apps/admin_web/src/features"), (file) =>
  file.endsWith(".vue")
).map(relative);

assertNoPattern(
  adminVueFiles,
  /\splaceholder=(["'])/,
  "admin feature placeholders must use i18n-bound :placeholder"
);

const backendEnvExamples = ["backend/.env.example", "backend/.env.production.example"];

assertNoPattern(
  backendEnvExamples,
  /\bYOUTUBE_|TRANSCRIPTION_PROVIDER|WHISPER_|JOB_WORKER_/,
  "backend env examples must not expose legacy server-side sermon import or worker configuration"
);

const deploymentScriptFiles = walk(path.join(root, "tools/scripts"), (file) => {
  const rel = relative(file);
  return (
    rel !== "tools/scripts/check_product_residue.mjs" &&
    /\.(sh|mjs)$/.test(rel)
  );
}).map(relative);

assertNoPattern(
  deploymentScriptFiles,
  /\bmbcwalkwith-worker\b|\bJOB_WORKER\b/,
  "deployment scripts must not manage legacy backend worker services"
);

const jobContractFiles = walk(root, (file) => {
  const rel = relative(file);
  if (!/\.(ts|vue|md)$/.test(rel)) {
    return false;
  }

  return (
    rel.startsWith("packages/api_contracts/src/") ||
    rel.startsWith("backend/src/modules/jobs/") ||
    rel.startsWith("apps/admin_web/src/features/jobs/") ||
    rel === "apps/admin_web/src/core/i18n/i18n.ts"
  );
}).map(relative);

assertNoPattern(
  jobContractFiles,
  /\baudio_transcription\b/,
  "backend/admin job diagnostics must not expose server-side audio transcription task types"
);

if (errors.length > 0) {
  console.error(errors.map((error) => `error: ${error}`).join("\n"));
  process.exit(1);
}

console.log("Product residue ok: no legacy sermon import, worker, or raw admin placeholders.");

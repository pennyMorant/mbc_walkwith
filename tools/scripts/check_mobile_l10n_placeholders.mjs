import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const l10nDir = path.join(root, "apps/mobile/lib/l10n");
const baseFile = "app_en.arb";
const errors = [];

function readArb(file) {
  return JSON.parse(readFileSync(path.join(l10nDir, file), "utf8"));
}

function messageKeys(arb) {
  return Object.keys(arb)
    .filter((key) => !key.startsWith("@") && key !== "@@locale")
    .sort();
}

function placeholderNames(message) {
  const names = new Set();
  const pattern = /\{([A-Za-z_][A-Za-z0-9_]*)(?:[,}])/g;
  for (const match of message.matchAll(pattern)) {
    names.add(match[1]);
  }
  return [...names].sort();
}

function metadataPlaceholderNames(arb, key) {
  const metadata = arb[`@${key}`];
  if (!metadata?.placeholders) {
    return [];
  }
  return Object.keys(metadata.placeholders).sort();
}

function sameList(left, right) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function missingFrom(left, right) {
  return left.filter((value) => !right.includes(value));
}

const baseArb = readArb(baseFile);
const baseKeys = messageKeys(baseArb);
const arbFiles = readdirSync(l10nDir)
  .filter((file) => /^app(?:_[A-Za-z]+(?:_[A-Za-z]+)?)?\.arb$/.test(file))
  .sort();

for (const file of arbFiles) {
  const arb = readArb(file);
  const keys = messageKeys(arb);
  const missingKeys = missingFrom(baseKeys, keys);
  const extraKeys = missingFrom(keys, baseKeys);

  for (const key of missingKeys) {
    errors.push(`${file}: missing message key ${key}`);
  }
  for (const key of extraKeys) {
    errors.push(`${file}: extra message key ${key}`);
  }

  for (const key of keys.filter((key) => baseKeys.includes(key))) {
    const messagePlaceholders = placeholderNames(arb[key]);
    const metadataPlaceholders = metadataPlaceholderNames(arb, key);
    const basePlaceholders = placeholderNames(baseArb[key]);

    if (!sameList(messagePlaceholders, basePlaceholders)) {
      const actual = messagePlaceholders.join(",") || "<none>";
      const expected = basePlaceholders.join(",") || "<none>";
      errors.push(
        `${file}: ${key} placeholders ${actual} do not match ${baseFile} ${expected}`
      );
    }

    if (!sameList(messagePlaceholders, metadataPlaceholders)) {
      const actual = metadataPlaceholders.join(",") || "<none>";
      const expected = messagePlaceholders.join(",") || "<none>";
      errors.push(
        `${file}: ${key} metadata placeholders ${actual} do not match message placeholders ${expected}`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `error: ${error}`).join("\n"));
  process.exit(1);
}

console.log(
  `Mobile l10n placeholders ok: ${arbFiles.length} ARB files checked.`
);

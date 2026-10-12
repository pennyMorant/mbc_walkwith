import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const capabilityDir = path.join(root, "docs/capabilities");
const errors = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assertContains(file, value, reason) {
  const source = read(file);
  if (!source.includes(value)) {
    errors.push(`${file}: missing ${reason}: ${value}`);
  }
}

const docs = readdirSync(capabilityDir)
  .filter((file) => file.endsWith(".md"))
  .filter((file) => file !== "README.md")
  .sort();

const readme = read("docs/capabilities/README.md");
const matrix = read("docs/capabilities/capability_matrix.md");

for (const doc of docs) {
  if (!readme.includes(`](${doc})`)) {
    errors.push(`docs/capabilities/README.md: missing link to ${doc}`);
  }
  if (doc !== "capability_matrix.md" && !matrix.includes(`](${doc})`)) {
    errors.push(`docs/capabilities/capability_matrix.md: missing ${doc}`);
  }

  if (doc === "capability_matrix.md") {
    continue;
  }

  const file = `docs/capabilities/${doc}`;
  for (const section of ["## Owner", "## Contract", "## Rules", "## Errors", "## Used By"]) {
    assertContains(file, section, "required capability section");
  }
}

const pathPattern = /`((?:apps|backend|docs|packages|tools)\/[^`]+)`/g;
const pathMatches = [...matrix.matchAll(pathPattern)].map((match) => match[1]);

for (const candidate of pathMatches) {
  if (candidate.includes("*") || candidate.includes(":")) {
    continue;
  }
  if (!existsSync(path.join(root, candidate))) {
    errors.push(`docs/capabilities/capability_matrix.md: missing owner path ${candidate}`);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `error: ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Capability docs ok: ${docs.length - 1} capabilities plus matrix.`);

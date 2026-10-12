import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const errors = [];

function walk(dir, predicate) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
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

function checkFlutterSurfaceBoundaries() {
  const files = walk(path.join(root, "apps/mobile/lib/features"), (file) =>
    file.endsWith(".dart") && file.includes(`${path.sep}presentation${path.sep}`)
  );

  const forbiddenPatterns = [
    {
      pattern: /package:dio\/dio\.dart/,
      reason: "Flutter presentation must not import Dio directly"
    },
    {
      pattern: /package:http\//,
      reason: "Flutter presentation must not import raw HTTP directly"
    },
    {
      pattern: /core\/api\/api_client\.dart/,
      reason: "Flutter presentation must use repositories/providers, not ApiClient"
    },
    {
      pattern: /apiClientProvider/,
      reason: "Flutter presentation must not read apiClientProvider directly"
    },
    {
      pattern: /data\/remote\/mock_|data\/mock_/,
      reason: "Flutter presentation must not import mock data sources directly"
    }
  ];

  for (const file of files.map(relative)) {
    const source = read(file);
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(source)) {
        errors.push(`${file}: ${rule.reason}`);
      }
    }
  }
}

function checkAdminWebSurfaceBoundaries() {
  const files = walk(path.join(root, "apps/admin_web/src/features"), (file) =>
    /\.(ts|vue)$/.test(file)
  );

  const forbiddenPatterns = [
    {
      pattern: /\bfetch\s*\(/,
      reason: "Admin Web feature surfaces must use core/api helpers, not fetch"
    },
    {
      pattern: /from\s+["']@\/core\/api\/client["']/,
      reason: "Admin Web feature surfaces must not import the raw ApiClient"
    }
  ];

  for (const file of files.map(relative)) {
    const source = read(file);
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(source)) {
        errors.push(`${file}: ${rule.reason}`);
      }
    }
  }
}

checkFlutterSurfaceBoundaries();
checkAdminWebSurfaceBoundaries();

if (errors.length > 0) {
  console.error(errors.map((error) => `error: ${error}`).join("\n"));
  process.exit(1);
}

console.log("SDK boundaries ok: mobile/admin surfaces use repository or API helper boundaries.");

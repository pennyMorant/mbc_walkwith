import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { apiRouteContractRegistry } from "../../packages/api_contracts/src/route-registry.ts";

const root = path.resolve(import.meta.dirname, "../..");
const routePattern =
  /\b(?:app|stripeWebhookApp)\s*\.\s*(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/g;

const errors = [];
const warnings = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return fullPath.endsWith(".ts") ? [fullPath] : [];
  });
}

function relative(fullPath) {
  return path.relative(root, fullPath);
}

function readRoutes(filePath) {
  const source = readFileSync(path.join(root, filePath), "utf8");
  const routes = [];
  let match;
  while ((match = routePattern.exec(source))) {
    routes.push(`${match[1].toUpperCase()} ${match[2]}`);
  }
  return routes;
}

function requirePath(filePath, label) {
  if (!existsSync(path.join(root, filePath))) {
    errors.push(`${label} missing: ${filePath}`);
  }
}

const registryRoutes = new Map();

for (const entry of apiRouteContractRegistry) {
  if (entry.contractFile) {
    requirePath(entry.contractFile, `${entry.featureId} contract`);
  }
  for (const doc of entry.sdkDocs) {
    requirePath(doc, `${entry.featureId} doc`);
  }
  for (const file of entry.backendRouteFiles) {
    requirePath(file, `${entry.featureId} backend route file`);
  }
  for (const file of entry.clientFiles) {
    requirePath(file, `${entry.featureId} client file`);
  }

  const declaredRoutes = new Set(
    entry.backendRouteFiles.flatMap((file) =>
      existsSync(path.join(root, file)) ? readRoutes(file) : []
    )
  );

  for (const route of entry.routes) {
    const existing = registryRoutes.get(route);
    if (existing) {
      errors.push(
        `route declared twice: ${route} (${existing} and ${entry.featureId})`
      );
    }
    registryRoutes.set(route, entry.featureId);

    if (!declaredRoutes.has(route)) {
      errors.push(
        `registered route not found in owner files: ${route} (${entry.featureId})`
      );
    }
  }
}

const backendRoutes = walk(path.join(root, "backend/src/modules"))
  .flatMap((file) => readRoutes(relative(file)))
  .sort();

for (const route of backendRoutes) {
  if (!registryRoutes.has(route)) {
    errors.push(`backend route missing from registry: ${route}`);
  }
}

for (const route of registryRoutes.keys()) {
  if (!backendRoutes.includes(route)) {
    warnings.push(`registry route not found by global scan: ${route}`);
  }
}

if (warnings.length > 0) {
  console.warn(warnings.map((warning) => `warning: ${warning}`).join("\n"));
}

if (errors.length > 0) {
  console.error(errors.map((error) => `error: ${error}`).join("\n"));
  process.exit(1);
}

console.log(
  `API contract coverage ok: ${apiRouteContractRegistry.length} groups, ${registryRoutes.size} routes.`
);

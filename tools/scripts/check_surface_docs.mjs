import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const errors = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function extractMobilePaths() {
  const source = read("apps/mobile/lib/app/app_routes.dart");
  const routePathBlock = source.split("class AppRoutePaths")[1] ?? "";
  const matches = [...routePathBlock.matchAll(/static const \w+ = '([^']+)'/g)];
  return matches.map((match) => match[1]).sort();
}

function extractAdminRoutes() {
  const source = read("apps/admin_web/src/router.ts");
  const blockPattern =
    /path:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?meta:\s*(?:adminPageMeta\("([^"]+)"\)|\{[^}]*layout:\s*"auth"[^}]*\})/g;
  const routes = [];
  let match;
  while ((match = blockPattern.exec(source))) {
    routes.push({
      path: match[1],
      name: match[2],
      permission: match[3] ?? "auth-layout"
    });
  }
  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

function assertContains(file, value, reason) {
  const source = read(file);
  if (!source.includes(value)) {
    errors.push(`${file}: missing ${reason}: ${value}`);
  }
}

for (const routePath of extractMobilePaths()) {
  assertContains("docs/surfaces/mobile_app.md", routePath, "mobile route path");
}

for (const route of extractAdminRoutes()) {
  assertContains("docs/surfaces/admin_web.md", route.path, "admin route path");
  assertContains(
    "docs/surfaces/admin_web.md",
    route.permission,
    "admin route permission"
  );
}

assertContains(
  "docs/surfaces/backend_api.md",
  "packages/api_contracts/src/route-registry.ts",
  "backend route registry reference"
);
assertContains(
  "docs/surfaces/backend_api.md",
  "bun run check:contracts",
  "backend route coverage command"
);

if (errors.length > 0) {
  console.error(errors.map((error) => `error: ${error}`).join("\n"));
  process.exit(1);
}

console.log(
  `Surface docs ok: ${extractMobilePaths().length} mobile routes, ${extractAdminRoutes().length} admin routes.`
);

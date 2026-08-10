import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredEvidence = [
  ["apps/web/app/layout.tsx", ["getRequestLocale", "localeDirection(locale)", "lang={locale}", "dir={direction}"]],
  [
    "apps/web/app/api/locale/route.ts",
    ["LOCALE_COOKIE_NAME", "normalizeReturnPath", "headers: { location:", "httpOnly: true", 'sameSite: "lax"'],
  ],
  ["apps/web/components/shared/site-header.tsx", ["LocaleSwitcher", "messageKey"]],
  ["apps/mobile/lib/src/app.dart", ["localizationsDelegates", "supportedLocales"]],
  ["apps/mobile/lib/src/screens/buyer/buyer_home_screen.dart", ["AutoIqLocalizations.of(context)"]],
  ["docs/internationalization-scope.md", ["English (`en-ZW`)", "Shona (`sn-ZW`)", "right-to-left"]],
];

for (const [file, snippets] of requiredEvidence) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  for (const snippet of snippets) {
    assert.ok(source.includes(snippet), `${file} is missing ${snippet}`);
  }
}

const webSources = walk(path.join(root, "apps/web"));
for (const file of webSources) {
  const source = fs.readFileSync(file, "utf8");
  assert.equal(source.includes(".toLocaleString("), false, `${path.relative(root, file)} uses inline locale formatting`);
}

console.log("Internationalization contract check passed.");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".next", "node_modules"].includes(entry.name)) return [];
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return /\.(ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

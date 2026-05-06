import fs from "node:fs/promises";
import path from "node:path";

const informalTokens = [
  "karo",
  "likho",
  "rakho",
  "batao",
  "seekho",
  "suno",
  "pooch sakte ho",
  "try karo",
  "tum",
  "tumhara",
  "tumhe",
  "chalo",
];

const forbiddenExamWords = ["B1", "TELC", "Goethe", "DTZ", "Prüfung", "readiness", "score"];
const scanRoots = ["app", "components"];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const nextPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return walk(nextPath);
      }
      return [nextPath];
    }),
  );

  return files.flat();
}

async function main() {
  const files = (await Promise.all(scanRoots.map((root) => walk(path.join(process.cwd(), root))))).flat();
  let failed = false;

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");

    for (const token of informalTokens) {
      if (content.toLowerCase().includes(token.toLowerCase())) {
        console.error(`Informal token found in ${file}: ${token}`);
        failed = true;
      }
    }

    for (const token of forbiddenExamWords) {
      if (content.includes(token)) {
        console.error(`Forbidden learner-facing exam token found in ${file}: ${token}`);
        failed = true;
      }
    }
  }

  const fewShot = await fs.readFile(path.join(process.cwd(), "prompts", "few_shot_word_phrase.md"), "utf8");
  const mixedGlossLine = fewShot
    .split("\n")
    .find((line) => line.includes(" = ") && line.includes(" / "));

  if (mixedGlossLine) {
    console.error(`Mixed gloss found in prompts/few_shot_word_phrase.md: ${mixedGlossLine}`);
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

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

const forbiddenExamWords = ["B1", "TELC", "Goethe", "DTZ", "Prüfung", "exam", "readiness", "score"];
const scanRoots = ["app", "components"];
const requiredSystemCoreWords = forbiddenExamWords;
const requiredStyleGuidePairs = [
  "`karo` -> `karein`",
  "`likho` -> `likhein`",
  "`rakho` -> `rakhein`",
  "`batao` -> `bataein`",
  "`seekho` -> `seekhein`",
  "`suno` -> `sunein`",
  "`tum`, `tumhara`, `tumhe` -> `aap`, `aapka`, `aapko`",
  "`chalo` -> `chaliye`",
  "`pooch sakte ho` -> `pooch sakte hain`",
  "`try karo` -> `try karein`",
  "`yaad rakho` -> `yaad rakhein`",
];

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

function containsForbiddenExamWord(content, token) {
  if (/^[A-Za-z]+$/.test(token)) {
    return new RegExp(`\\b${token}\\b`, "i").test(content);
  }

  return content.includes(token);
}

async function main() {
  let failed = false;
  const files = (await Promise.all(scanRoots.map((root) => walk(path.join(process.cwd(), root))))).flat();

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");

    for (const token of informalTokens) {
      if (content.toLowerCase().includes(token.toLowerCase())) {
        console.error(`Informal token found in ${file}: ${token}`);
        failed = true;
      }
    }

    for (const token of forbiddenExamWords) {
      if (containsForbiddenExamWord(content, token)) {
        console.error(`Forbidden learner-facing exam token found in ${file}: ${token}`);
        failed = true;
      }
    }
  }

  const systemCore = await fs.readFile(path.join(process.cwd(), "prompts", "system_core.md"), "utf8");
  for (const token of requiredSystemCoreWords) {
    if (!systemCore.includes(token)) {
      console.error(`Missing forbidden-word entry in prompts/system_core.md: ${token}`);
      failed = true;
    }
  }

  const styleGuide = await fs.readFile(path.join(process.cwd(), "prompts", "style_guide_hinglish.md"), "utf8");
  for (const pair of requiredStyleGuidePairs) {
    if (!styleGuide.includes(pair)) {
      console.error(`Missing formality pair in prompts/style_guide_hinglish.md: ${pair}`);
      failed = true;
    }
  }

  const classifierPrompt = await fs.readFile(path.join(process.cwd(), "prompts", "classifier.md"), "utf8");
  for (const key of ['"inputType"', '"taskType"', '"hiddenExamRelevance"', '"depthHint"']) {
    if (!classifierPrompt.includes(key)) {
      console.error(`Missing schema key in prompts/classifier.md: ${key}`);
      failed = true;
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

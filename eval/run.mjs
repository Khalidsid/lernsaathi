import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import OpenAI from "openai";

const forbiddenInformal = [
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

const responderSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    response: { type: "string" },
    learnerVisibleLabel: { type: "string" },
    diagnosis: { type: "array", items: { type: "string" } },
    suggestedVerification: { type: ["string", "null"] },
  },
  required: ["response", "learnerVisibleLabel", "diagnosis", "suggestedVerification"],
};

function similarityScore(a, b) {
  const left = a.toLowerCase().replace(/\s+/g, " ").trim();
  const right = b.toLowerCase().replace(/\s+/g, " ").trim();

  if (!left || !right) {
    return 0;
  }

  const leftWords = new Set(left.split(" "));
  const rightWords = new Set(right.split(" "));
  const overlap = [...leftWords].filter((word) => rightWords.has(word)).length;
  const union = new Set([...leftWords, ...rightWords]).size;

  return overlap / union;
}

function hasForbiddenInformal(output) {
  return forbiddenInformal.some((token) => output.toLowerCase().includes(token.toLowerCase()));
}

function hasForbiddenExamWord(output) {
  return forbiddenExamWords.some((token) => output.includes(token));
}

function hasMixedGloss(output) {
  return output
    .split("\n")
    .some((line) => line.includes(" = ") && line.includes(" / "));
}

async function loadPrompt(filename) {
  return fs.readFile(path.join(process.cwd(), "prompts", filename), "utf8");
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const [systemCore, styleGuide, fewShot, wordPrompt, phrasePrompt] = await Promise.all([
    loadPrompt("system_core.md"),
    loadPrompt("style_guide_hinglish.md"),
    loadPrompt("few_shot_word_phrase.md"),
    loadPrompt("response_word_query.md"),
    loadPrompt("response_phrase_query.md"),
  ]);

  const evalFile = await fs.readFile(path.join(process.cwd(), "eval", "golden", "word_phrase_v1.jsonl"), "utf8");
  const examples = evalFile
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  let failed = false;

  for (const example of examples) {
    const isPhrase = example.input.includes(" ");
    const response = await client.responses.create({
      model: "gpt-5",
      reasoning: { effort: "minimal" },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [systemCore, styleGuide, isPhrase ? phrasePrompt : wordPrompt, fewShot].join("\n\n---\n\n"),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Classified input type: ${isPhrase ? "phrase_query" : "word_query"}\nDepth hint: quick_answer\nHidden exam relevance: vocabulary_in_context\n\nLearner input: ${example.input}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "eval_responder",
          schema: responderSchema,
          strict: true,
        },
      },
    });

    const parsed = JSON.parse(response.output_text);
    const output = parsed.response;
    const score = similarityScore(example.expected, output);
    const informal = hasForbiddenInformal(output);
    const mixedGloss = hasMixedGloss(output);
    const examWord = hasForbiddenExamWord(output);

    console.log(`\n=== ${example.input} ===`);
    console.log(`Similarity: ${score.toFixed(2)}`);
    if (score < 0.45 || informal || mixedGloss || examWord) {
      failed = true;
      console.log("Status: FAIL");
    } else {
      console.log("Status: PASS");
    }
    console.log(output);
    if (informal) console.log("Negative check: informal form found");
    if (mixedGloss) console.log("Negative check: mixed gloss found");
    if (examWord) console.log("Negative check: forbidden exam word found");
  }

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

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

const forbiddenExamWords = ["B1", "TELC", "Goethe", "DTZ", "Prüfung", "exam", "readiness", "score"];

const responderSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    response: { type: "string" },
    learnerVisibleLabel: { type: "string" },
    diagnosis: { type: "array", items: { type: "string" } },
    suggestedVerification: { type: ["string", "null"] },
    structured: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        lemma: {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                article: { type: ["string", "null"], enum: ["der", "die", "das", null] },
                word: { type: "string" },
                plural: { type: ["string", "null"] },
                gloss: { type: "string" },
              },
              required: ["article", "word", "plural", "gloss"],
            },
            { type: "null" },
          ],
        },
        examples: {
          type: ["array", "null"],
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              de: { type: "string" },
              hi: { type: "string" },
            },
            required: ["de", "hi"],
          },
        },
        use: { type: ["string", "null"] },
        pattern: { type: ["string", "null"] },
        common: { type: ["string", "null"] },
        note: { type: ["string", "null"] },
      },
      required: ["lemma", "examples", "use", "pattern", "common", "note"],
    },
  },
  required: ["response", "learnerVisibleLabel", "diagnosis", "suggestedVerification", "structured"],
};

const classifierSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    inputType: {
      type: "string",
      enum: ["word_query", "phrase_query", "grammar_question", "sentence_correction", "out_of_scope"],
    },
    taskType: { type: ["string", "null"] },
    hiddenExamRelevance: { type: "array", items: { type: "string" } },
    depthHint: { type: "string", enum: ["quick_answer", "guided_explanation", "full_diagnostic"] },
  },
  required: ["inputType", "taskType", "hiddenExamRelevance", "depthHint"],
};

const diagnosticItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    mistakeType: { type: "string" },
    topic: { type: ["string", "null"] },
    subtype: { type: ["string", "null"] },
    friction: { type: ["string", "null"] },
    correctForm: { type: ["string", "null"] },
    explanation: { type: ["string", "null"] },
    hiddenExamImpact: { type: ["array", "null"], items: { type: "string" } },
    likelyTransferContexts: { type: ["array", "null"], items: { type: "string" } },
  },
  required: [
    "mistakeType",
    "topic",
    "subtype",
    "friction",
    "correctForm",
    "explanation",
    "hiddenExamImpact",
    "likelyTransferContexts",
  ],
};

const reflectionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    original: { type: "string" },
    friction: { type: "string" },
    question: { type: "string" },
    corrected: { type: "string" },
    explanation: { type: "string" },
  },
  required: ["original", "friction", "question", "corrected", "explanation"],
};

const diagnosticResponderSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    response: { type: "string" },
    learnerVisibleLabel: { type: "string" },
    diagnosis: { type: "array", items: { type: "string" } },
    suggestedVerification: { type: ["string", "null"] },
    structured: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        intro: { type: ["string", "null"] },
        lemma: {
          anyOf: [
            {
              type: "object",
              additionalProperties: false,
              properties: {
                article: { type: ["string", "null"], enum: ["der", "die", "das", null] },
                word: { type: "string" },
                plural: { type: ["string", "null"] },
                gloss: { type: "string" },
              },
              required: ["article", "word", "plural", "gloss"],
            },
            { type: "null" },
          ],
        },
        examples: {
          type: ["array", "null"],
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              de: { type: "string" },
              hi: { type: "string" },
            },
            required: ["de", "hi"],
          },
        },
        use: { type: ["string", "null"] },
        pattern: { type: ["string", "null"] },
        common: { type: ["string", "null"] },
        note: { type: ["string", "null"] },
        diagnosis: { type: ["array", "null"], items: diagnosticItemSchema },
        reflection: { anyOf: [reflectionSchema, { type: "null" }] },
        priorMistakeReminder: { type: ["string", "null"] },
      },
      required: [
        "intro",
        "lemma",
        "examples",
        "use",
        "pattern",
        "common",
        "note",
        "diagnosis",
        "reflection",
        "priorMistakeReminder",
      ],
    },
  },
  required: ["response", "learnerVisibleLabel", "diagnosis", "suggestedVerification", "structured"],
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
  return forbiddenExamWords.some((token) => containsForbiddenExamWord(output, token));
}

function hasMixedGloss(output) {
  return output
    .split("\n")
    .some((line) => line.includes(" = ") && line.includes(" / "));
}

function hasStructuredShape(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  if (!payload.structured || typeof payload.structured !== "object") {
    return false;
  }

  const { structured } = payload;
  if (!structured.lemma || typeof structured.lemma.word !== "string" || typeof structured.lemma.gloss !== "string") {
    return false;
  }

  return Array.isArray(structured.examples) && structured.examples.every((example) => example.de && example.hi);
}

function hasDiagnosticShape(payload, kind) {
  if (!payload?.structured || typeof payload.structured !== "object") {
    return false;
  }

  const diagnosis = payload.structured.diagnosis;
  if (!Array.isArray(diagnosis) || diagnosis.length === 0 || !diagnosis[0].mistakeType) {
    return false;
  }

  if (kind === "reflection") {
    return Boolean(payload.structured.reflection?.friction && payload.structured.reflection?.question);
  }

  return true;
}

async function loadPrompt(filename) {
  return fs.readFile(path.join(process.cwd(), "prompts", filename), "utf8");
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const [systemCore, styleGuide, fewShot, wordPrompt, phrasePrompt, grammarPrompt, sentencePrompt, classifierPrompt] = await Promise.all([
    loadPrompt("system_core.md"),
    loadPrompt("style_guide_hinglish.md"),
    loadPrompt("few_shot_word_phrase.md"),
    loadPrompt("response_word_query.md"),
    loadPrompt("response_phrase_query.md"),
    loadPrompt("response_grammar_question.md"),
    loadPrompt("response_sentence_correction.md"),
    loadPrompt("classifier.md"),
  ]);

  const evalFile = await fs.readFile(path.join(process.cwd(), "eval", "golden", "word_phrase_v1.jsonl"), "utf8");
  const examples = evalFile
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

  let failed = false;

  for (const example of examples) {
    if (example.mode === "classifier") {
      const response = await client.responses.create({
        model: "gpt-5",
        reasoning: { effort: "minimal" },
        input: [
          { role: "system", content: [{ type: "input_text", text: classifierPrompt }] },
          { role: "user", content: [{ type: "input_text", text: example.input }] },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "eval_classifier",
            schema: classifierSchema,
            strict: true,
          },
        },
      });
      const parsed = JSON.parse(response.output_text);
      const passed = parsed.inputType === example.expectedInputType;
      failed ||= !passed;
      console.log(`\n=== ${example.input} ===`);
      console.log(`Classifier: ${parsed.inputType}`);
      console.log(`Status: ${passed ? "PASS" : "FAIL"}`);
      continue;
    }

    const inputType = example.inputType ?? (example.input.includes(" ") ? "phrase_query" : "word_query");
    const isPhrase = inputType === "phrase_query";
    const isDiagnostic = inputType === "grammar_question" || inputType === "sentence_correction";
    const taskPrompt = inputType === "grammar_question" ? grammarPrompt : inputType === "sentence_correction" ? sentencePrompt : isPhrase ? phrasePrompt : wordPrompt;
    const priorMistakeNote = example.priorMistake
      ? [
          `Note for assistant: This learner has previously struggled with "${example.input}" specifically with ${example.priorMistake.mistakeType}, subtype "${example.priorMistake.subtype}".`,
          `Use this knowledge gently. Example phrasing: "Yeh wala word aapne pehle bhi padha tha - ${example.priorMistake.subtype} yaad kar lete hain."`,
          "Do not repeat the full earlier explanation; reference and continue.",
        ].join("\n")
      : null;
    const displayNameRule = [
      `Display name available: ${example.displayName ?? ""}`,
      "Use the display name only when response depth is guided_explanation and the point is genuinely tricky.",
      "Use it at most once, at the start of one sentence. Never use it in a meaning gloss line.",
    ].join("\n");
    const response = await client.responses.create({
      model: "gpt-5",
      reasoning: { effort: "minimal" },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [systemCore, styleGuide, taskPrompt, fewShot, displayNameRule, priorMistakeNote]
                .filter(Boolean)
                .join("\n\n---\n\n"),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Classified input type: ${inputType}\nDepth hint: ${example.responseDepth ?? "quick_answer"}\nResponse depth: ${example.responseDepth ?? "quick_answer"}\nHidden exam relevance: ${example.hiddenExamRelevance ?? "vocabulary_in_context"}\n\nLearner input: ${example.input}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: isDiagnostic ? "eval_diagnostic_responder" : "eval_responder",
          schema: isDiagnostic ? diagnosticResponderSchema : responderSchema,
          strict: true,
        },
      },
    });

    const parsed = JSON.parse(response.output_text);
    const output = parsed.response;
    const score = example.expected ? similarityScore(example.expected, output) : 1;
    const informal = hasForbiddenInformal(output);
    const mixedGloss = hasMixedGloss(output);
    const examWord = hasForbiddenExamWord(output);
    const structuredShape = isDiagnostic
      ? hasDiagnosticShape(parsed, example.structuredKind)
      : hasStructuredShape(parsed);
    const containsExpected = (example.expectedContains ?? []).every((token) =>
      output.toLowerCase().includes(token.toLowerCase()),
    );

    console.log(`\n=== ${example.input} ===`);
    console.log(`Similarity: ${score.toFixed(2)}`);
    if (score < 0.45 || informal || mixedGloss || examWord || !structuredShape || !containsExpected) {
      failed = true;
      console.log("Status: FAIL");
    } else {
      console.log("Status: PASS");
    }
    console.log(output);
    if (informal) console.log("Negative check: informal form found");
    if (mixedGloss) console.log("Negative check: mixed gloss found");
    if (examWord) console.log("Negative check: forbidden exam word found");
    if (!structuredShape) console.log("Structured check: missing or incomplete structured payload");
    if (!containsExpected) console.log("Content check: expected token missing");
    console.log(`Structured: ${JSON.stringify(parsed.structured)}`);
  }

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
function containsForbiddenExamWord(output, token) {
  if (/^[A-Za-z]+$/.test(token)) {
    return new RegExp(`\\b${token}\\b`, "i").test(output);
  }

  return output.includes(token);
}

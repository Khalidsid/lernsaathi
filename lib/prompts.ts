import { readFile } from "node:fs/promises";
import path from "node:path";

const promptCache = new Map<string, string>();

export async function loadPrompt(filename: string) {
  if (promptCache.has(filename)) {
    return promptCache.get(filename) as string;
  }

  const filePath = path.join(process.cwd(), "prompts", filename);
  const content = await readFile(filePath, "utf8");
  promptCache.set(filename, content);
  return content;
}

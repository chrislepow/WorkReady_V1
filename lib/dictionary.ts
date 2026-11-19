import { wordPattern, type WordContext } from "./word-context";

type DictionaryEntry = {
  meanings?: Array<{
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
};

export async function lookupWordContext(word: string, signal: AbortSignal): Promise<WordContext | null> {
  if (word.length > 64 || !/^\p{L}[\p{L}\p{M}'’ -]*$/u.test(word)) {
    return null;
  }

  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Dictionary request failed with status ${response.status}`);
  }

  const entries = (await response.json()) as DictionaryEntry[];
  if (!Array.isArray(entries)) {
    return null;
  }

  for (const entry of entries) {
    for (const meaning of entry.meanings ?? []) {
      for (const definition of meaning.definitions ?? []) {
        const example = definition.example?.trim();
        if (example && /[.!?]$/.test(example) && wordPattern(word).test(example)) {
          return { kind: "sentence", text: example, fromDictionary: true };
        }

        const gloss = definition.definition?.trim();
        if (gloss) {
          return { kind: "definition", text: gloss, fromDictionary: true };
        }
      }
    }
  }

  return null;
}

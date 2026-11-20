import { containsProfanity } from "./class-words";
import { wordPattern, type WordContext } from "./word-context";

type DictionaryDefinition = {
  definition?: string;
  example?: string;
};

type DictionaryEntry = {
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: DictionaryDefinition[];
  }>;
};

export async function lookupWordContext(word: string, signal: AbortSignal): Promise<WordContext | null> {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    {
      next: { revalidate: 86400 },
      signal: AbortSignal.any([signal, AbortSignal.timeout(4000)]),
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

  const senses = entries.flatMap((entry) =>
    (entry.meanings ?? []).flatMap(({ partOfSpeech, definitions = [] }) =>
      definitions.map((definition) => ({ ...definition, partOfSpeech })),
    ),
  );
  for (const { example } of senses) {
    const sentence = example?.trim();
    if (sentence && sentence.length <= 220 && /[.!?]["'\u2019\u201d]?$/.test(sentence)
      && /^\p{Lu}/u.test(sentence) && wordPattern(word).test(sentence) && !containsProfanity(sentence)) {
      return { text: sentence, fromDictionary: true };
    }
  }

  const sense = senses.find(({ definition }) => definition?.trim() && !containsProfanity(definition));
  const definition = sense?.definition?.trim().replace(/[.!?]+$/, "");
  if (!definition) {
    return null;
  }

  return {
    text: sentenceFromDefinition(word, definition, sense?.partOfSpeech),
    fromDictionary: true,
    adapted: true,
  };
}

function sentenceFromDefinition(word: string, definition: string, partOfSpeech?: string) {
  // Only insert a gloss directly when its form fits the sentence.
  if (partOfSpeech === "noun" && /^(?:a|an) /i.test(definition)) {
    const description = definition[0].toLowerCase() + definition.slice(1);
    if (!wordPattern(word).test(description)) {
      const article = indefiniteArticle(word) === "an" ? "An" : "A";
      return `${article} ${word} is ${description}.`;
    }
  }

  if (partOfSpeech === "verb" && /^to /i.test(definition)) {
    return `To ${word} means to ${definition.slice(3)}.`;
  }

  return `The word "${word}" means "${definition}".`;
}

function indefiniteArticle(word: string) {
  return /^(?:hour|honest|honou?r|heir)/i.test(word)
    || (/^[aeiou]/i.test(word) && !/^(?:uni(?:t|c|f|v|q)|use|usual|user|euro|one)/i.test(word))
    ? "an"
    : "a";
}

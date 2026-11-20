export type WordContext = {
  text: string;
  fromDictionary?: true;
  adapted?: true;
};

export type WordContexts = ReadonlyMap<string, WordContext | null>;

const builtInSentences = new Map([
  ["tomorrow", "The weather tomorrow will be rainy."],
  ["window", "There is one window open in the house."],
  ["bookshelf", "I have one bookshelf at home with a lot of books."],
  ["fireplace", "It is comfortable to sit by the fireplace during the winter."],
  ["television", "Our television is on the wall in our house."],
  ["headphones", "The headphones fit neatly inside the backpack."],
  ["streetlight", "The streetlight turns on when the evening gets dark."],
  ["sidewalk", "We walked along the sidewalk after school."],
  ["picture", "I drew a picture of the park."],
  ["staircase", "The staircase leads to the second floor."],
]);

export function normalizeWord(word: string) {
  return word.trim().toLowerCase().replace(/\s+/g, " ");
}

export function builtInSentenceFor(word: string) {
  return builtInSentences.get(normalizeWord(word));
}

export function wordContextFor(word: string, contexts?: WordContexts): WordContext {
  return contexts?.get(normalizeWord(word)) ?? {
    text: builtInSentenceFor(word) ?? `The teacher asked us to spell "${word.trim()}".`,
  };
}

export function wordPattern(word: string) {
  const pattern = normalizeWord(word)
    .split(" ")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  const letterOrNumber = "[\\p{L}\\p{M}\\p{N}]";

  return new RegExp(`(?<!${letterOrNumber})${pattern}(?!${letterOrNumber})`, "giu");
}

export function blankSentenceFor(word: string, context: WordContext) {
  return context.text.replace(wordPattern(word), "_____");
}

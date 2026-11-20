const WORD_ENTRY = /^\p{L}[\p{L}\p{M}]*(?:[ \t]+\p{L}[\p{L}\p{M}]*)*$/u;
// Match whole terms so words such as "class" and "assistant" remain usable.
const PROFANITY = /\b(?:a+r?seholes?|ass(?:es|holes?|hats?|wipes?)?|bastards?|bitch(?:es|ing|ed|y)?|bollocks|bullshits?|cock(?:s|sucker[s]?)?|cunts?|damn(?:ed|it|s)?|dick(?:s|heads?)?|douche(?:s|bags?)?|fag(?:s|gots?)?|fuck(?:s|ed|er[s]?|ing|in)?|god[ \t]*damn(?:ed|it|s)?|jack[ \t]*ass(?:es)?|mother[ \t]*fuck(?:s|ed|ers?|ing)?|nigg(?:a[s]?|er[s]?)|piss(?:es|ed|er[s]?|ing)?|pricks?|puss(?:y|ies)|retard(?:s|ed)?|shits?|shitt(?:y|ier|iest|ing)|sluts?|twats?|wank(?:s|ed|ers?|ing)?|whores?)\b/i;
const DISTINCTIVE_STEM = /\b(?:asshol|bullshi|cocksuc|dickhea|mother[ \t]*fuc|fuck|shit|cunt|bitch|fagg)/i;
const AMBIGUOUS_ENDING = /\b(?:ass(?:es)?|cock|damn|dick|fag|prick|piss)$/i;

function foldForModeration(text: string) {
  return text.normalize("NFKD").replace(/\p{M}/gu, "");
}

export function containsProfanity(text: string) {
  const folded = foldForModeration(text);
  return PROFANITY.test(folded) || DISTINCTIVE_STEM.test(folded);
}

export function isAllowedClassWordWhileTyping(word: string) {
  return WORD_ENTRY.test(word) && !containsProfanity(foldForModeration(word).replace(AMBIGUOUS_ENDING, ""));
}

export function isAllowedClassWord(word: string) {
  return WORD_ENTRY.test(word) && !containsProfanity(word);
}

export function filterClassWords(text: string) {
  const entries = text.split(/[,\r\n]+/).map((entry) => entry.trim()).filter(Boolean);
  const words = entries.filter(isAllowedClassWord);
  const rejected = entries.length - words.length;

  return { words, rejected, text: rejected ? words.join("\n") : text };
}

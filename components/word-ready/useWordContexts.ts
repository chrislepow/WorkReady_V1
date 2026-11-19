import { useEffect, useRef, useState } from "react";

import { lookupWordContext } from "@/lib/dictionary";
import { builtInSentenceFor, normalizeWord, type WordContexts, type WordContext } from "@/lib/word-context";

export function useWordContexts(words: string[], isEditing: boolean) {
  const cache = useRef(new Map<string, WordContext | null>());
  const [contexts, setContexts] = useState<WordContexts>(() => new Map());

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const pending = words.map(normalizeWord).filter(
      (word) => !builtInSentenceFor(word) && !cache.current.has(word),
    );
    if (pending.length === 0) {
      return;
    }

    const controller = new AbortController();

    async function loadExamples() {
      for (let index = 0; index < pending.length && !controller.signal.aborted; index += 4) {
        const batch = pending.slice(index, index + 4);
        const results = await Promise.allSettled(
          batch.map((word) => lookupWordContext(word, controller.signal)),
        );
        if (controller.signal.aborted) {
          return;
        }

        results.forEach((result, offset) => {
          if (result.status === "fulfilled") {
            cache.current.set(batch[offset], result.value);
          }
        });
        setContexts(new Map(cache.current));
      }
    }

    void loadExamples();
    return () => controller.abort();
  }, [words, isEditing]);

  return contexts;
}

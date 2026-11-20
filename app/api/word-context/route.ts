import { isAllowedClassWord } from "@/lib/class-words";
import { lookupWordContext } from "@/lib/dictionary";
import { normalizeWord } from "@/lib/word-context";

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("word") ?? "";
  const word = normalizeWord(input);

  if (input.length > 64 || !isAllowedClassWord(input.trim())) {
    return Response.json(null);
  }

  try {
    return Response.json(await lookupWordContext(word, request.signal));
  } catch {
    return Response.json({ error: "Dictionary unavailable" }, { status: 503 });
  }
}

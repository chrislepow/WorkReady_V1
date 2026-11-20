import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/word-context/route";
import { STORAGE_KEYS } from "@/lib/wordready";

import WordReadyApp from "./WordReadyApp";

describe("WordReadyApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(STORAGE_KEYS.name, "Alex");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts in the no words state", () => {
    render(<WordReadyApp />);

    expect(screen.getByRole("heading", { name: "Spelling Practice" })).toBeInTheDocument();
    expect(screen.getByText("No words available.")).toBeInTheDocument();
    expect(screen.getByLabelText("0 words")).toBeInTheDocument();
  });

  it("locks every practice tab and the exercise until a name is entered", async () => {
    window.localStorage.removeItem(STORAGE_KEYS.name);
    window.localStorage.setItem(STORAGE_KEYS.words, "Window");
    const user = userEvent.setup();
    render(<WordReadyApp />);

    const name = screen.getByRole("textbox", { name: "Name" });
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    tabs.forEach((tab) => expect(tab).toBeDisabled());
    expect(screen.queryByRole("textbox", { name: "Answer for word 1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Hello,/)).not.toBeInTheDocument();

    await user.type(name, "  ");
    expect(tabs[0]).toBeDisabled();
    await user.type(name, "Alex");
    tabs.forEach((tab) => expect(tab).toBeEnabled());
    const sidebar = within(screen.getByRole("complementary", { name: "WordReady controls" }));
    expect(sidebar.getByText("Hello, Alex").nextElementSibling).toBe(sidebar.getByLabelText("Word Ready"));
    expect(screen.getByRole("textbox", { name: "Answer for word 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
    expect(window.localStorage.getItem(STORAGE_KEYS.name)).toBe("Alex");

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(name).toHaveValue("");
    tabs.forEach((tab) => expect(tab).toBeDisabled());
    expect(screen.queryByText(/^Hello,/)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.name)).toBeNull();
  });

  it("shows word rows when class words are entered", async () => {
    const user = userEvent.setup();

    render(<WordReadyApp />);

    await user.type(screen.getByLabelText("Class words"), "Bookshelf\nTomorrow\nWindow");

    expect(screen.getByLabelText("3 words")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.getByText("Window")).toBeInTheDocument();
    expect(screen.getByText("Bookshelf")).toBeInTheDocument();
    expect(screen.getByText("There is one window open in the house.")).toBeInTheDocument();
  });

  it("blurs only the focused row's word and keeps it hidden across tabs until reset", async () => {
    const user = userEvent.setup();
    render(<WordReadyApp />);

    const entry = screen.getByLabelText("Class words");
    await user.type(entry, "Window\nTomorrow");
    await user.click(screen.getByRole("tab", { name: "Sentences" }));
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.getByText("There is one window open in the house.")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Hidden word" })).not.toBeInTheDocument();

    const answer = screen.getByRole("textbox", { name: "Answer for word 1" });
    await user.click(answer);
    const row = answer.closest("article")!;
    const sentence = row.querySelector("p");
    const hiddenWords = within(row).getAllByRole("img", { name: "Hidden word" });
    expect(hiddenWords).toHaveLength(2);
    expect(sentence).toContainElement(hiddenWords[1]);
    expect(hiddenWords[1]).toHaveTextContent("window");
    expect(sentence).toHaveTextContent("There is one window open in the house.");
    expect(within(row).getByRole("button", { name: "Pronounce word 1" })).toBeInTheDocument();
    expect(screen.getByText("The weather tomorrow will be rainy.")).toBeInTheDocument();
    await user.type(answer, "Window");
    await user.click(screen.getByRole("button", { name: "Check answer for word 1" }));
    expect(hiddenWords[1]).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Fill Blanks" }));
    expect(screen.getByText("There is one _____ open in the house.")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Sentences" }));
    expect(screen.getAllByRole("img", { name: "Hidden word" })).toHaveLength(2);

    await user.click(screen.getByRole("tab", { name: "Fill Blanks" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Alex");
    await user.click(screen.getByRole("tab", { name: "Sentences" }));
    expect(screen.queryByRole("img", { name: "Hidden word" })).not.toBeInTheDocument();
    expect(screen.getByText("There is one window open in the house.")).toBeInTheDocument();
  });

  it("keeps saved class words out of the editor while more words are added and restores them on reset", async () => {
    const user = userEvent.setup();
    render(<WordReadyApp />);

    const entry = screen.getByRole("textbox", { name: "Class words" });
    await user.type(entry, "Window");
    await user.click(screen.getByRole("textbox", { name: "Answer for word 1" }));
    const hiddenList = screen.getByRole("group", { name: "Hidden class words: 1" });
    expect(hiddenList).not.toHaveTextContent("Window");
    expect(entry).toHaveValue("");

    await user.type(entry, "Tomorrow");
    expect(entry).toHaveValue("Tomorrow");
    expect(hiddenList).toBeInTheDocument();
    expect(screen.getByLabelText("2 words")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Fill Blanks" }));
    expect(screen.getByRole("group", { name: "Hidden class words: 2" })).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEYS.words)).toBe("Window\nTomorrow");

    const reset = screen.getByRole("button", { name: "Reset" });
    const tabs = screen.getByRole("tablist", { name: "Practice modes" });
    expect(reset.previousElementSibling).toBe(tabs);
    expect(tabs.lastElementChild).toBe(within(tabs).getByRole("tab", { name: "Mock Test" }));
    await user.click(reset);
    expect(entry).toHaveValue("Window\nTomorrow");
    expect(screen.queryByRole("group", { name: /^Hidden class words/ })).not.toBeInTheDocument();
  });

  it("keeps valid words from a mixed list and does not send rejected entries to the dictionary", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => Response.json(null));
    vi.stubGlobal("fetch", fetchMock);
    render(<WordReadyApp />);

    const entry = screen.getByLabelText("Class words");
    await user.click(entry);
    await user.paste("Window, CLASS\nＦＵＣＫ\nstar*\ncat🐱\nGrade2\nWindow");
    expect(screen.getByText(/Profanity, numbers, and symbols are blocked/)).toBeInTheDocument();
    expect(screen.getByLabelText("2 words")).toBeInTheDocument();
    expect(window.localStorage.getItem("wordready.words")).toBe("Window\nCLASS\nWindow");

    await user.click(screen.getByRole("tab", { name: "Sentences" }));
    expect(entry).toHaveValue("");
    expect(screen.getByRole("group", { name: "Hidden class words: 2" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/word-context?word=class", expect.anything());
  });

  it("blocks profane stems and symbols as typed while allowing ordinary words with similar starts", async () => {
    const user = userEvent.setup();
    render(<WordReadyApp />);

    const entry = screen.getByLabelText("Class words");
    await user.type(entry, "assistant\nfuchsia\nfuc");
    await user.type(entry, "k");
    expect(entry).toHaveValue("assistant\nfuchsia\nfuc");
    expect(screen.getByText(/Profanity, numbers, and symbols are blocked/)).toBeInTheDocument();

    await user.type(entry, "{Backspace}{Backspace}{Backspace}Window*");
    expect(entry).toHaveValue("assistant\nfuchsia\nWindow");
    expect(screen.getByLabelText("3 words")).toBeInTheDocument();
  });

  it("rejects blocked terms at the backend before looking up a word", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await GET(new Request("http://localhost/api/word-context?word=SHIT"));
    expect(await result.json()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("looks up completed words on blur and uses their context in practice", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (url: string) => {
      if (url.startsWith("/api/word-context?")) {
        return GET(new Request(`http://localhost${url}`));
      }
      if (url.endsWith("/curious")) {
        return Response.json([{
          meanings: [{
            partOfSpeech: "adjective",
            definitions: [
              { definition: "Eager to learn." },
              { example: "The curious cat peeked into the box." },
            ],
          }],
        }]);
      }
      if (url.endsWith("/rainbow")) {
        return Response.json([{
          meanings: [{
            partOfSpeech: "noun",
            definitions: [
              { definition: "An arc of colors that appears after rain.", example: "We saw two rainbows." },
            ],
          }],
        }]);
      }
      return new Response(null, { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<WordReadyApp />);

    const wordEntry = screen.getByLabelText("Class words");
    const sentencesTab = screen.getByRole("tab", { name: "Sentences" });
    await user.type(wordEntry, "Curious\nRainbow\nZigzor");
    expect(wordEntry).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(sentencesTab);
    expect(wordEntry).not.toHaveFocus();
    expect(await screen.findByText("The curious cat peeked into the box.")).toBeInTheDocument();
    expect(screen.getByText("A rainbow is an arc of colors that appears after rain.")).toBeInTheDocument();
    expect(screen.getByText('The teacher asked us to spell "Zigzor".')).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Fill Blanks" }));
    expect(screen.getByText("The _____ cat peeked into the box.")).toBeInTheDocument();
    expect(screen.getByText("A _____ is an arc of colors that appears after rain.")).toBeInTheDocument();

    await user.click(wordEntry);
    expect(wordEntry).toHaveFocus();
    expect(wordEntry).toHaveValue("");
    expect(screen.getByRole("group", { name: "Hidden class words: 3" })).toBeInTheDocument();
    await user.click(sentencesTab);
    expect(fetchMock.mock.calls.filter(([url]) => url.startsWith("/api/"))).toHaveLength(3);
  });

  it("checks an answer from the Sentences row and lets the learner retry", async () => {
    const user = userEvent.setup();
    render(<WordReadyApp />);

    await user.type(screen.getByLabelText("Class words"), "Tomorrow");
    const answer = screen.getByRole("textbox", { name: "Answer for word 1" });
    const check = screen.getByRole("button", { name: "Check answer for word 1" });

    expect(check).toBeDisabled();
    await user.type(answer, "  ");
    expect(check).toBeDisabled();
    await user.type(answer, "Tomorow");
    expect(check).toBeEnabled();
    await user.click(check);
    expect(answer).toHaveAttribute("aria-invalid", "true");
    const result = within(screen.getByRole("region", { name: "Sentence practice" })).getByRole("status");
    expect(result).toHaveTextContent("Try again");
    expect(result).toHaveAttribute("data-status", "missed");
    expect(answer.nextElementSibling).toBe(result);
    expect(answer).toHaveAccessibleDescription("Try again");

    await user.clear(answer);
    expect(check).toBeDisabled();
    expect(result).not.toHaveAttribute("data-status");
    await user.type(answer, "tomorrow{Enter}");
    expect(answer).toHaveAttribute("aria-invalid", "false");
    expect(result).toHaveTextContent("Correct");
    expect(result).toHaveAttribute("data-status", "correct");
    expect(screen.getByRole("button", { name: "Mark word 1 mastered" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Reset" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Alex");
    expect(screen.getByRole("textbox", { name: "Answer for word 1" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Check answer for word 1" })).toBeDisabled();
    expect(within(screen.getByRole("region", { name: "Sentence practice" })).getByRole("status"))
      .not.toHaveAttribute("data-status");
    expect(screen.getByText("The weather tomorrow will be rainy.")).toBeInTheDocument();
  });

  it("passes the spelling word to the browser when the speaker is clicked", async () => {
    const user = userEvent.setup();
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      constructor(readonly text: string) {}
    });
    render(<WordReadyApp />);

    await user.type(screen.getByLabelText("Class words"), "Window");
    await user.click(screen.getByRole("button", { name: "Pronounce Window" }));

    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "Window", lang: "en-US" }));
  });

  it("shows active states for mastered and tricky word actions", async () => {
    const user = userEvent.setup();

    render(<WordReadyApp />);

    await user.type(screen.getByLabelText("Class words"), "Tomorrow");

    const masteredButton = screen.getByRole("button", {
      name: "Mark Tomorrow mastered",
    });
    const trickyButton = screen.getByRole("button", { name: "Tricky" });

    await user.click(masteredButton);

    expect(masteredButton).toHaveAttribute("aria-pressed", "true");
    expect(trickyButton).toHaveAttribute("aria-pressed", "false");

    await user.click(trickyButton);

    expect(trickyButton).toHaveAttribute("aria-pressed", "true");
    expect(masteredButton).toHaveAttribute("aria-pressed", "false");
  });

  it("binds the day arrows to the countdown plan and caps at ten days", async () => {
    const user = userEvent.setup();

    render(<WordReadyApp />);

    const increaseButton = screen.getByRole("button", {
      name: "Increase days until test",
    });

    for (let count = 0; count < 6; count += 1) {
      await user.click(increaseButton);
    }

    const countdownPlan = screen.getByLabelText("Daily practice countdown");

    expect(screen.getByLabelText("Days until test")).toHaveValue(10);
    expect(screen.getByText("10 Days")).toBeInTheDocument();
    expect(within(countdownPlan).getAllByRole("listitem")).toHaveLength(10);
    expect(within(countdownPlan).getByText("Test Day")).toBeInTheDocument();
    expect(within(countdownPlan).getByText("Mock Test")).toBeInTheDocument();
  });

  it("checks answers in fill blank practice", async () => {
    const user = userEvent.setup();

    render(<WordReadyApp />);

    await user.type(screen.getByLabelText("Class words"), "Tomorrow");
    await user.click(screen.getByRole("tab", { name: "Fill Blanks" }));
    await user.type(screen.getByLabelText("Answer for word 1"), "Tomorrow");
    await user.click(screen.getByRole("button", { name: "Check Answers" }));

    expect(screen.getByText("Correct")).toBeInTheDocument();
  });

  it("locks the other tabs during Mock Test and clears the attempt on reset", async () => {
    window.localStorage.setItem(STORAGE_KEYS.words, "Window");
    const user = userEvent.setup();
    render(<WordReadyApp />);

    const mockTest = screen.getByRole("tab", { name: "Mock Test" });
    const sentences = screen.getByRole("tab", { name: "Sentences" });
    const otherTabs = screen.getAllByRole("tab").filter((tab) => tab !== mockTest);
    await user.click(mockTest);
    expect(mockTest).toBeEnabled();
    expect(mockTest).toHaveAttribute("aria-selected", "true");
    otherTabs.forEach((tab) => expect(tab).toBeDisabled());

    await user.type(screen.getByRole("textbox", { name: "Answer for word 1" }), "Window");
    await user.click(screen.getByRole("button", { name: "Grade Test" }));
    expect(screen.getByText("Correct")).toBeInTheDocument();
    await user.click(sentences);
    expect(mockTest).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(mockTest).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Alex");
    otherTabs.forEach((tab) => expect(tab).toBeEnabled());
    expect(sentences).toHaveAttribute("aria-selected", "true");
    await user.click(mockTest);
    expect(screen.getByRole("textbox", { name: "Answer for word 1" })).toHaveValue("");
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();
  });

  it("keeps Reset available in Mock Test after the word list is cleared", async () => {
    window.localStorage.setItem(STORAGE_KEYS.words, "Window");
    const user = userEvent.setup();
    render(<WordReadyApp />);

    await user.click(screen.getByRole("tab", { name: "Mock Test" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));
    const sentences = screen.getByRole("tab", { name: "Sentences" });
    expect(sentences).toBeDisabled();
    expect(screen.getByLabelText("0 words")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Alex");
    expect(sentences).toBeEnabled();
    expect(sentences).toHaveAttribute("aria-selected", "true");
  });
});

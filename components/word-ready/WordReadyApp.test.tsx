import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import WordReadyApp from "./WordReadyApp";

describe("WordReadyApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts in the no words state", () => {
    render(<WordReadyApp />);

    expect(screen.getByRole("heading", { name: "Spelling Practice" })).toBeInTheDocument();
    expect(screen.getByText("No words available.")).toBeInTheDocument();
    expect(screen.getByLabelText("0 words")).toBeInTheDocument();
  });

  it("shows word rows when class words are entered", async () => {
    const user = userEvent.setup();

    render(<WordReadyApp />);

    await user.type(screen.getByLabelText("Class words"), "Tomorrow\nWindow\nBookshelf");

    expect(screen.getByLabelText("3 words")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    expect(screen.getByText("Window")).toBeInTheDocument();
    expect(screen.getByText("Bookshelf")).toBeInTheDocument();
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
});

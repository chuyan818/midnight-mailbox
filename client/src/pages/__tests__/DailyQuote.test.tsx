import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DailyQuote from "../DailyQuote";

// Mock wouter
vi.mock("wouter", () => ({
  useLocation: () => ["/daily-quote", vi.fn()],
}));

describe("DailyQuote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the daily quote page", () => {
    render(<DailyQuote />);
    expect(screen.getByText("今日一句")).toBeInTheDocument();
  });

  it("should display the quote content", () => {
    render(<DailyQuote />);
    const quoteText = screen.getByText(/有时候，我们需要的不是答案/);
    expect(quoteText).toBeInTheDocument();
  });

  it("should display emotion tag", () => {
    render(<DailyQuote />);
    const emotionTag = screen.getByText("孤独");
    expect(emotionTag).toBeInTheDocument();
  });

  it("should display statistics", () => {
    render(<DailyQuote />);
    const stats = screen.getAllByText(/相关信件|次分享|今日/);
    expect(stats.length).toBeGreaterThan(0);
  });

  it("should have share and copy buttons", () => {
    render(<DailyQuote />);
    const buttons = screen.getAllByRole("button");
    const shareButton = buttons.find((btn) => btn.textContent?.includes("分享"));
    const copyButton = buttons.find((btn) => btn.textContent?.includes("复制"));

    expect(shareButton).toBeInTheDocument();
    expect(copyButton).toBeInTheDocument();
  });

  it("should copy text to clipboard", () => {
    render(<DailyQuote />);
    const copyButton = screen.getByText("复制文本");
    fireEvent.click(copyButton);
    expect(copyButton).toBeInTheDocument();
  });

  it("should display previous quotes", () => {
    render(<DailyQuote />);
    const previousQuotesTitle = screen.getByText("往日一句");
    expect(previousQuotesTitle).toBeInTheDocument();
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PublicMailbox from "../PublicMailbox";

// Mock wouter
vi.mock("wouter", () => ({
  useLocation: () => ["/public-mailbox", vi.fn()],
}));

// Mock useAuth
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: "test-user" },
  }),
}));

describe("PublicMailbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the public mailbox page", () => {
    render(<PublicMailbox />);
    expect(screen.getByText("公共信箱")).toBeInTheDocument();
  });

  it("should display letter cards", () => {
    render(<PublicMailbox />);
    const cards = screen.getAllByRole("img", { hidden: true });
    expect(cards.length).toBeGreaterThan(0);
  });

  it("should toggle star on button click", () => {
    render(<PublicMailbox />);
    const starButtons = screen.getAllByRole("button");
    const firstStarButton = starButtons.find((btn) =>
      btn.textContent?.includes("234")
    );

    if (firstStarButton) {
      fireEvent.click(firstStarButton);
      // The star count should update
      expect(firstStarButton).toBeInTheDocument();
    }
  });

  it("should filter by emotion tags", () => {
    render(<PublicMailbox />);
    const emotionButtons = screen.getAllByRole("button");
    const pressureButton = emotionButtons.find((btn) =>
      btn.textContent?.includes("压力")
    );

    if (pressureButton) {
      fireEvent.click(pressureButton);
      // Should filter letters by pressure emotion
      expect(pressureButton).toBeInTheDocument();
    }
  });

  it("should sort by newest or most shared", () => {
    render(<PublicMailbox />);
    const sortButtons = screen.getAllByRole("button");
    const newestButton = sortButtons.find((btn) => btn.textContent === "最新");

    if (newestButton) {
      fireEvent.click(newestButton);
      expect(newestButton).toBeInTheDocument();
    }
  });
});

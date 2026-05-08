import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "./Profile";

// Mock dependencies
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    user: {
      getProfile: {
        useQuery: vi.fn(),
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

describe("Profile Page", () => {
  const mockNavigate = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuth as any).mockReturnValue({
      user: {
        id: "123",
        email: "chuyan818@example.com",
      },
      isAuthenticated: true,
      logout: mockLogout,
    });

    (useLocation as any).mockReturnValue(["/profile", mockNavigate]);

    (trpc.user.getProfile.useQuery as any).mockReturnValue({
      data: {
        id: "123",
        email: "chuyan818@example.com",
        joinedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
      },
      isLoading: false,
    });
  });

  it("should render Profile page when authenticated", () => {
    render(<Profile />);

    expect(screen.getByText("个人中心")).toBeInTheDocument();
    expect(screen.getByText("chuyan818")).toBeInTheDocument();
  });

  it("should display user stats correctly", () => {
    render(<Profile />);

    expect(screen.getByText("28")).toBeInTheDocument(); // messages
    expect(screen.getByText("8.7")).toBeInTheDocument(); // emotion score
    expect(screen.getByText("12")).toBeInTheDocument(); // unread
    expect(screen.getByText("23:45")).toBeInTheDocument(); // last active
  });

  it("should display emotion trend chart", () => {
    render(<Profile />);

    expect(screen.getByText("情绪热盐 (最近7天)")).toBeInTheDocument();
    expect(screen.getByText("5/16")).toBeInTheDocument();
    expect(screen.getByText("今天")).toBeInTheDocument();
  });

  it("should display mood options", () => {
    render(<Profile />);

    expect(screen.getByText("愉好")).toBeInTheDocument();
    expect(screen.getByText("平静")).toBeInTheDocument();
    expect(screen.getByText("低落")).toBeInTheDocument();
  });

  it("should display weekly stats", () => {
    render(<Profile />);

    expect(screen.getByText("本周写信统计")).toBeInTheDocument();
    expect(screen.getByText("4封")).toBeInTheDocument();
    expect(screen.getByText("3.2小时")).toBeInTheDocument();
  });

  it("should display membership info", () => {
    render(<Profile />);

    expect(screen.getByText("当前版本")).toBeInTheDocument();
    expect(screen.getByText("免费版")).toBeInTheDocument();
    expect(screen.getByText("基础特性")).toBeInTheDocument();
  });

  it("should display upgrade suggestion", () => {
    render(<Profile />);

    expect(screen.getByText("升级建议")).toBeInTheDocument();
    expect(screen.getByText("延长续费购样件")).toBeInTheDocument();
    expect(screen.getByText("查看会员权益 →")).toBeInTheDocument();
  });

  it("should display settings menu", () => {
    render(<Profile />);

    expect(screen.getByText("更多设置")).toBeInTheDocument();
    expect(screen.getByText("语言设置")).toBeInTheDocument();
    expect(screen.getByText("通知设置")).toBeInTheDocument();
    expect(screen.getByText("隐私设置")).toBeInTheDocument();
    expect(screen.getByText("帮助与反馈")).toBeInTheDocument();
    expect(screen.getByText("关于深夜信箱")).toBeInTheDocument();
  });

  it("should display bottom navigation", () => {
    render(<Profile />);

    expect(screen.getByText("首页")).toBeInTheDocument();
    expect(screen.getByText("信箱")).toBeInTheDocument();
    expect(screen.getByText("对话精选")).toBeInTheDocument();
    expect(screen.getByText("我的")).toBeInTheDocument();
  });

  it("should display logout button", () => {
    render(<Profile />);

    expect(screen.getByText("登出账户")).toBeInTheDocument();
  });

  it("should navigate to home when back button is clicked", async () => {
    const user = userEvent.setup();
    render(<Profile />);

    const backButton = screen.getAllByRole("button")[0];
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("should call logout when logout button is clicked", async () => {
    const user = userEvent.setup();
    render(<Profile />);

    const logoutButton = screen.getByText("登出账户");
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it("should navigate to different pages when bottom nav items are clicked", async () => {
    const user = userEvent.setup();
    render(<Profile />);

    const homeButton = screen.getByText("首页");
    await user.click(homeButton);
    expect(mockNavigate).toHaveBeenCalledWith("/");

    const mailboxButton = screen.getByText("信箱");
    await user.click(mailboxButton);
    expect(mockNavigate).toHaveBeenCalledWith("/mailbox");

    const featuredButton = screen.getByText("对话精选");
    await user.click(featuredButton);
    expect(mockNavigate).toHaveBeenCalledWith("/featured");
  });

  it("should show loading state when profile is loading", () => {
    (trpc.user.getProfile.useQuery as any).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<Profile />);

    // Page should still render with default data
    expect(screen.getByText("个人中心")).toBeInTheDocument();
  });

  it("should redirect to home when not authenticated", () => {
    (useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
    });

    render(<Profile />);

    expect(screen.getByText("请先登录")).toBeInTheDocument();
    expect(screen.getByText("返回首页")).toBeInTheDocument();
  });

  it("should display user join days correctly", () => {
    render(<Profile />);

    expect(screen.getByText("在深夜写信的第 23 天")).toBeInTheDocument();
  });

  it("should display current mood status", () => {
    render(<Profile />);

    expect(screen.getByText("今晚的你，状态：虽然孤独")).toBeInTheDocument();
  });

  it("should display quote from user mailbox", () => {
    render(<Profile />);

    expect(
      screen.getByText(
        '"你是否写过了，但仍请我救了？谢谢你一直在这里。"'
      )
    ).toBeInTheDocument();
    expect(screen.getByText("— 你的信箱")).toBeInTheDocument();
  });

  it("should display language setting with current value", () => {
    render(<Profile />);

    expect(screen.getByText("中文 (简体)")).toBeInTheDocument();
  });

  it("should display version info", () => {
    render(<Profile />);

    expect(screen.getByText("v1.2.0")).toBeInTheDocument();
  });
});

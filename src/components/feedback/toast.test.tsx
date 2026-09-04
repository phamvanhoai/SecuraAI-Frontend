import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toast";

function Trigger() {
  const toast = useToast();
  return (
    <button
      onClick={() => toast.success("Đã lưu", "Thay đổi đã được cập nhật.")}
    >
      Hiện toast
    </button>
  );
}

describe("ToastProvider", () => {
  it("shows and dismisses a reusable toast", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Hiện toast" }));
    expect(screen.getByRole("status")).toHaveTextContent("Đã lưu");
    await user.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("automatically closes after its duration", () => {
    vi.useFakeTimers();
    function TimedTrigger() {
      const toast = useToast();
      return (
        <button
          onClick={() => toast.show({ title: "Đồng bộ xong", duration: 1000 })}
        >
          Mở
        </button>
      );
    }
    render(
      <ToastProvider>
        <TimedTrigger />
      </ToastProvider>,
    );
    act(() => screen.getByRole("button", { name: "Mở" }).click());
    expect(screen.getByRole("status")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

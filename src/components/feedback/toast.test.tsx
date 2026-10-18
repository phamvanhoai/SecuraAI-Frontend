import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

afterEach(cleanup);

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

it("keeps errors inside the open dialog and moves feedback back after closing", async () => {
  const user = userEvent.setup();
  function ModalTrigger() {
    const toast = useToast();
    return (
      <dialog open aria-label="Example form">
        <button
          onClick={() => toast.error("Request failed", "Please try again.")}
        >
          Fail request
        </button>
      </dialog>
    );
  }
  render(
    <ToastProvider>
      <ModalTrigger />
    </ToastProvider>,
  );
  const dialog = screen.getByRole("dialog", { name: "Example form" });
  await user.click(screen.getByText("Fail request"));
  await waitFor(() =>
    expect(screen.getByRole("alert").closest("dialog")).toBe(dialog),
  );
  act(() => {
    dialog.removeAttribute("open");
    dialog.dispatchEvent(new Event("close"));
  });
  await waitFor(() =>
    expect(screen.getByRole("alert").closest("dialog")).toBeNull(),
  );
  await user.click(screen.getByRole("button", { name: "Đóng thông báo" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

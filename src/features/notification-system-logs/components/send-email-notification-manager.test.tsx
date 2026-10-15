import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "11111111-1111-4111-8111-111111111111";
const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: mocks.success,
    warning: mocks.warning,
    error: mocks.error,
  }),
}));
vi.mock("@/features/user-management-authorization", () => ({
  useUsers: () => ({
    data: {
      items: [
        {
          id: userId,
          fullName: "Security User",
          email: "security@example.test",
          department: null,
        },
      ],
    },
    isPending: false,
    isError: false,
  }),
}));
vi.mock("../hooks/use-send-email-notification", () => ({
  useSendEmailNotification: () => ({ mutate: mocks.mutate, isPending: false }),
}));
import { SendEmailNotificationManager } from "./send-email-notification-manager";

describe("SendEmailNotificationManager", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends to selected users and reports successful delivery", async () => {
    mocks.mutate.mockImplementation(
      (
        _input: unknown,
        options: {
          onSuccess: (result: {
            sentCount: number;
            failedCount: number;
          }) => void;
        },
      ) => options.onSuccess({ sentCount: 1, failedCount: 0 }),
    );
    const user = userEvent.setup();
    render(<SendEmailNotificationManager />);

    await user.click(screen.getByText("Security User"));
    await user.type(screen.getByLabelText("Subject"), "Review required");
    await user.type(screen.getByLabelText("Email message"), "Review the latest finding.");
    await user.click(screen.getByRole("button", { name: "Send email" }));

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        subject: "Review required",
        message: "Review the latest finding.",
        userIds: [userId],
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(mocks.success).toHaveBeenCalledWith(
      "Email notification sent",
      "Sent to 1 recipient.",
    );
  });
});

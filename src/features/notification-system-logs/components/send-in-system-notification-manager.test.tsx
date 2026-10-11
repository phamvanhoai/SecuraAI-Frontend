import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));
vi.mock("@/features/user-management-authorization", () => ({
  useUsers: () => ({ data: { items: [] }, isPending: false, isError: false }),
}));
vi.mock("../hooks/use-send-in-system-notification", () => ({
  useSendInSystemNotification: () => ({
    mutate: mocks.mutate,
    isPending: false,
  }),
}));

import { SendInSystemNotificationManager } from "./send-in-system-notification-manager";

describe("SendInSystemNotificationManager", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits a role-group notification and reports the delivered count", async () => {
    mocks.mutate.mockImplementation(
      (
        _input: unknown,
        options: {
          onSuccess: (result: {
            id: string;
            recipientCount: number;
            sentAt: string;
          }) => void;
        },
      ) =>
      options.onSuccess({
        id: "11111111-1111-4111-8111-111111111111",
        recipientCount: 3,
        sentAt: "2026-10-08T06:00:00.000Z",
      }),
    );
    const user = userEvent.setup();
    render(<SendInSystemNotificationManager />);

    await user.type(screen.getByLabelText("Notification title"), "Review required");
    await user.type(
      screen.getByLabelText("Message"),
      "Review the latest security finding.",
    );
    await user.click(screen.getByRole("button", { name: "Send notification" }));

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        title: "Review required",
        message: "Review the latest security finding.",
        priority: "IMPORTANT",
        audience: { type: "roles", roles: ["SECURITY_OFFICER"] },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
    expect(mocks.success).toHaveBeenCalledWith(
      "Notification sent",
      "Delivered in SecuraAI to 3 active recipients.",
    );
  });
});

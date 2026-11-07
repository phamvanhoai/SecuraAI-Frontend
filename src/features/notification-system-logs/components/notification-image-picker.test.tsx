import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useState } from "react";
import { NotificationImagePicker } from "./notification-image-picker";
import { prepareNotificationImage } from "../api/prepare-notification-image";
import type { NotificationImage } from "../types/notification-image";
vi.mock("../api/prepare-notification-image", () => ({
  prepareNotificationImage: vi.fn(),
}));
const image = {
  name: "test.png",
  dataUrl: "data:image/png;base64,iVBORw0KGgo=",
};
function Harness() {
  const [images, setImages] = useState<NotificationImage[]>([]);
  return (
    <NotificationImagePicker
      images={images}
      onChange={setImages}
      onBusyChange={() => undefined}
      disabled={false}
    />
  );
}
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
it("prepares selected images, shows a preview and removes it before sending", async () => {
  vi.mocked(prepareNotificationImage).mockResolvedValue(image);
  const user = userEvent.setup();
  render(<Harness />);
  await user.upload(
    screen.getByLabelText("Attach message images"),
    new File(["fixture"], "test.png", { type: "image/png" }),
  );
  expect(await screen.findByAltText("test.png")).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: "Remove image test.png" }),
  );
  expect(screen.queryByAltText("test.png")).not.toBeInTheDocument();
});
it("rejects more than three images before preparation", async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.upload(
    screen.getByLabelText("Attach message images"),
    Array.from(
      { length: 4 },
      (_, i) =>
        new File(["fixture"], "image" + i + ".png", { type: "image/png" }),
    ),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("up to 3 images");
  expect(prepareNotificationImage).not.toHaveBeenCalled();
});
it("keeps an unreadable image out of the attachments and shows its error", async () => {
  vi.mocked(prepareNotificationImage).mockRejectedValue(
    new Error("This image could not be opened."),
  );
  const user = userEvent.setup();
  render(<Harness />);
  await user.upload(
    screen.getByLabelText("Attach message images"),
    new File(["bad"], "bad.png", { type: "image/png" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("could not be opened"),
  );
  expect(
    screen.queryByRole("list", { name: "Attached images" }),
  ).not.toBeInTheDocument();
});

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
const hook = vi.hoisted(() => vi.fn());
vi.mock("../hooks/use-asset-owner-options", () => ({ useAssetOwnerOptions: hook }));
import { AssetOwnerPicker } from "./asset-owner-picker";
afterEach(() => { cleanup(); vi.resetAllMocks(); });
it("debounces server search and selects duplicate names by email using keyboard", async () => {
  const change = vi.fn();
  hook.mockReturnValue({ isPending: false, isFetching: false, isError: false, data: { items: [
    { id: "a", fullName: "Same Name", email: "first@example.test" },
    { id: "b", fullName: "Same Name", email: "second@example.test" },
  ] } });
  const user = userEvent.setup();
  render(<AssetOwnerPicker id="owner" value="" enabled invalid={false} inputRef={null} onBlur={vi.fn()} onChange={change} />);
  await user.type(screen.getByRole("combobox"), "second@");
  await waitFor(() => expect(hook).toHaveBeenLastCalledWith(true, "second@"));
  expect(screen.getByRole("option", { name: /second@example.test/ })).toBeVisible();
  await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
  expect(change).toHaveBeenCalledWith("b");
});
it("offers retry for search failure", async () => {
  const refetch = vi.fn();
  hook.mockReturnValue({ isPending: false, isFetching: false, isError: true, refetch });
  render(<AssetOwnerPicker id="owner" value="" enabled invalid={false} inputRef={null} onBlur={vi.fn()} onChange={vi.fn()} />);
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(refetch).toHaveBeenCalled();
});

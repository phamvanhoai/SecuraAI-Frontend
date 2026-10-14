"use client";

import { useMutation } from "@tanstack/react-query";
import { sendInSystemNotification } from "../api/send-in-system-notification";

export function useSendInSystemNotification() {
  return useMutation({ mutationFn: sendInSystemNotification, retry: false });
}

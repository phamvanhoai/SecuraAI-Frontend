"use client";

import { useMutation } from "@tanstack/react-query";
import { sendEmailNotification } from "../api/send-email-notification";

export function useSendEmailNotification() {
  return useMutation({ mutationFn: sendEmailNotification, retry: false });
}

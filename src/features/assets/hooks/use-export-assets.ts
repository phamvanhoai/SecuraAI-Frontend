"use client";

import { useMutation } from "@tanstack/react-query";
import { exportAssets } from "../api/export-assets";

export function useExportAssets() {
  return useMutation({ mutationFn: exportAssets });
}

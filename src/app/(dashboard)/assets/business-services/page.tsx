import { Suspense } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { BusinessServicesShell } from "@/features/it-asset-management";

export default function BusinessServicesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} columns={5} />}>
      <BusinessServicesShell />
    </Suspense>
  );
}

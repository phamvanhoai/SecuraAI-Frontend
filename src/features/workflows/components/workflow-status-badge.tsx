import { StatusBadge } from "@/components/data-display/static-product";

export function WorkflowStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <StatusBadge tone={isActive ? "success" : "neutral"}>
      {isActive ? "Đang hoạt động" : "Tạm dừng"}
    </StatusBadge>
  );
}

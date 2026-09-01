import { EmptyState } from "@/components/feedback/empty-state";

export function UsersShell() {
  return <EmptyState title="Quản lý người dùng chưa triển khai" description="Backend hiện chỉ cung cấp GET /users/me; chưa có contract danh sách hoặc CRUD người dùng." />;
}

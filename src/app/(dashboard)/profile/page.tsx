"use client";

import { Mail, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { DashboardLoadingSkeleton } from "@/components/feedback/loading-skeletons";
import { useSessionUser } from "@/features/auth";

export default function ProfilePage() {
  const session = useSessionUser();
  if (session.isPending) return <DashboardLoadingSkeleton variant="form" />;
  const user = session.data;
  if (!user)
    return (
      <ProductPanel title="Không thể tải hồ sơ">
        <p className="text-muted p-5 text-sm">
          Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.
        </p>
      </ProductPanel>
    );

  return (
    <>
      <ProductPageHeader
        title="Hồ sơ cá nhân"
        description="Xem thông tin của tài khoản đang đăng nhập."
        showSampleNotice={false}
      />
      <div className="grid gap-5 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <ProductPanel title="Thông tin tài khoản">
          <div className="p-6 text-center">
            <span className="bg-brand-soft text-brand mx-auto grid size-24 place-items-center rounded-full">
              <UserRound className="size-11" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">{user.fullName}</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {user.roles.map((role) => (
                <StatusBadge key={role.code} tone="info">
                  {role.name}
                </StatusBadge>
              ))}
            </div>
          </div>
        </ProductPanel>
        <ProductPanel
          title="Chi tiết hồ sơ"
          description="Thông tin được cung cấp bởi tài khoản đang đăng nhập."
        >
          <dl className="divide-border divide-y px-5">
            <ProfileDetail label="Họ và tên" value={user.fullName} />
            <ProfileDetail label="Email" value={user.email} icon={<Mail />} />
            <ProfileDetail
              label="Vai trò"
              value={
                user.roles.map((role) => role.name).join(", ") ||
                "Chưa có vai trò"
              }
            />
            <ProfileDetail label="Trạng thái" value={user.status} />
          </dl>
        </ProductPanel>
      </div>
    </>
  );
}

function ProfileDetail({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
      <dt className="text-muted text-sm font-medium">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-sm font-medium break-words">
        {icon ? (
          <span className="text-muted [&>svg]:size-4">{icon}</span>
        ) : null}
        {value}
      </dd>
    </div>
  );
}

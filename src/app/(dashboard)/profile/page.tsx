import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
const inputClass =
  "min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-3 focus:ring-brand/15";
export default function ProfilePage() {
  return (
    <>
      <ProductPageHeader
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin tài khoản và tùy chọn cá nhân."
      />
      <div className="grid gap-5 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <ProductPanel title="Thông tin tài khoản">
          <div className="p-6 text-center">
            <span className="bg-brand-soft text-brand mx-auto grid size-24 place-items-center rounded-full">
              <UserRound className="size-11" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">Nguyễn Văn An</h2>
            <div className="mt-2">
              <StatusBadge tone="info">Quản trị viên</StatusBadge>
            </div>
            <div className="border-border mt-6 space-y-4 border-t pt-5 text-left text-sm">
              <p className="flex gap-3">
                <Mail className="text-muted size-4" />
                an.nguyen@securai.com
              </p>
              <p className="flex gap-3">
                <Phone className="text-muted size-4" />
                +84 912 345 678
              </p>
              <p className="flex gap-3">
                <MapPin className="text-muted size-4" />
                Công nghệ thông tin
              </p>
            </div>
          </div>
        </ProductPanel>
        <ProductPanel
          title="Thông tin cá nhân"
          description="Dữ liệu mẫu, chưa lưu vào hệ thống."
        >
          <form className="grid gap-5 p-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Họ và tên
              <input className={inputClass} defaultValue="Nguyễn Văn An" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Email
              <input
                className={inputClass}
                defaultValue="an.nguyen@securai.com"
                readOnly
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Số điện thoại
              <input className={inputClass} defaultValue="+84 912 345 678" />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Phòng ban
              <input
                className={inputClass}
                defaultValue="Công nghệ thông tin"
              />
            </label>
            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Giới thiệu
              <textarea
                className="border-border bg-background focus:border-brand focus:ring-brand/15 min-h-28 w-full rounded-lg border p-3 text-sm outline-none focus:ring-3"
                defaultValue="Quản trị hệ thống và bảo mật thông tin."
              />
            </label>
            <div className="flex justify-end md:col-span-2">
              <button
                type="button"
                className="bg-brand hover:bg-brand-strong min-h-10 rounded-lg px-4 text-sm font-semibold text-white"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </ProductPanel>
      </div>
    </>
  );
}

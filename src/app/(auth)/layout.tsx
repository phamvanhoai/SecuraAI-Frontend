import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-[100dvh] bg-[#f8faff] lg:grid-cols-[minmax(24rem,0.9fr)_minmax(32rem,1.1fr)]">
      <section className="relative hidden overflow-hidden border-r border-[#d9e5fa] bg-[radial-gradient(circle_at_75%_45%,rgba(64,132,255,0.22),transparent_34%),linear-gradient(145deg,#eef5ff_0%,#dceaff_100%)] p-10 text-[#101b3f] lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span className="bg-brand grid size-11 place-items-center rounded-[10px] text-white shadow-[0_10px_24px_rgba(23,105,246,0.25)]">
            <ShieldCheck className="size-7" strokeWidth={1.8} />
          </span>
          SecuraAI
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl leading-[1.08] font-semibold tracking-[-0.035em] xl:text-5xl">
            Kiểm soát rủi ro. Bảo vệ vận hành.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#52688e]">
            Không gian quản trị tập trung cho tài sản, rủi ro, sự cố và tuân thủ
            an toàn thông tin.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-[#c7d8f5] pt-6 text-sm text-[#52688e]">
          <LockKeyhole className="size-4" strokeWidth={1.8} />
          Token phiên được bảo vệ trong cookie HttpOnly.
        </div>
      </section>

      <section className="bg-surface flex min-w-0 flex-col">
        <div className="flex h-18 items-center px-5 lg:hidden">
          <ShieldCheck className="text-brand mr-2 size-6" strokeWidth={1.8} />
          <span className="font-semibold">SecuraAI</span>
        </div>
        <div className="grid flex-1 place-items-center px-5 py-10 sm:px-10">
          {children}
        </div>
      </section>
    </main>
  );
}

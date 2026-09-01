import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-[100dvh] bg-background lg:grid-cols-[minmax(22rem,0.8fr)_minmax(32rem,1.2fr)]">
      <section className="relative hidden overflow-hidden border-r border-[#1f3934] bg-[#10231f] p-10 text-[#edf7f4] lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          <span className="grid size-10 place-items-center rounded-lg border border-[#37665c] bg-[#17322c]">
            <ShieldCheck className="size-6 text-[#76c9b6]" strokeWidth={1.8} />
          </span>
          SecuraAI
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] xl:text-5xl">
            Kiểm soát rủi ro. Bảo vệ vận hành.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#abc3bd]">
            Không gian quản trị tập trung cho tài sản, rủi ro, sự cố và tuân thủ an toàn thông tin.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-[#29443e] pt-6 text-sm text-[#8eaaa3]">
          <LockKeyhole className="size-4" strokeWidth={1.8} />
          Token phiên được bảo vệ trong cookie HttpOnly.
        </div>
      </section>

      <section className="flex min-w-0 flex-col">
        <div className="flex h-18 items-center px-5 lg:hidden">
          <ShieldCheck className="mr-2 size-6 text-brand" strokeWidth={1.8} />
          <span className="font-semibold">SecuraAI</span>
        </div>
        <div className="grid flex-1 place-items-center px-5 py-10 sm:px-10">{children}</div>
      </section>
    </main>
  );
}

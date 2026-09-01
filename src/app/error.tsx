"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="grid min-h-[100dvh] place-items-center p-6 text-center"><div><h1 className="text-2xl font-semibold">Đã xảy ra lỗi</h1><p className="my-4 text-muted">Không thể hoàn tất yêu cầu. Vui lòng thử lại.</p><Button onClick={reset}>Thử lại</Button></div></main>; }

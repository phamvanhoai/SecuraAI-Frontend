import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center p-6 text-center">
      <div>
        <p className="text-brand text-sm font-bold">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Không tìm thấy trang
        </h1>
        <Link
          className="text-brand mt-6 inline-block font-medium underline-offset-4 hover:underline"
          href="/admin"
        >
          Về trang tổng quan
        </Link>
      </div>
    </main>
  );
}

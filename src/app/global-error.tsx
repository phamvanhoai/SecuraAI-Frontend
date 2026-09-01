"use client";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <html lang="vi"><body><main><h1>Ứng dụng gặp lỗi nghiêm trọng</h1><button onClick={reset}>Tải lại</button></main></body></html>; }

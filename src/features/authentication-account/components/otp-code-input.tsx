"use client";

import { useRef } from "react";

export function OtpCodeInput({
  value,
  onChange,
  id = "otp",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");
  function update(index: number, input: string) {
    const digit = input.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit || " ";
    onChange(next.join("").trimEnd());
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }
  function paste(event: React.ClipboardEvent<HTMLInputElement>) {
    const code = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (code.length !== 6) return;
    event.preventDefault();
    onChange(code);
    refs.current[5]?.focus();
  }
  return (
    <div
      className="flex justify-center gap-2 sm:gap-3"
      aria-label="Enter your code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          id={index === 0 ? id : undefined}
          aria-label={`Code digit ${index + 1}`}
          autoFocus={index === 0}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className="border-border bg-background focus:border-brand focus:ring-brand/15 size-12 rounded-lg border text-center text-xl font-semibold outline-none focus:ring-3 sm:size-14"
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          onPaste={paste}
          onChange={(event) => update(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit.trim() && index > 0)
              refs.current[index - 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}

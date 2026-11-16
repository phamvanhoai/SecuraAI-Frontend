"use client";

import { useId, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function lengthError(value: unknown, maximum?: number): string | undefined {
  return maximum !== undefined &&
    typeof value === "string" &&
    value.trim().length > maximum
    ? `Use at most ${maximum.toLocaleString("en-US")} characters.`
    : undefined;
}

// maxLength is a validation limit here; never pass it to the native control,
// which would discard pasted characters before validation can explain the error.
export function ValidatedInput({
  maxLength,
  onChange,
  ...props
}: Omit<ComponentProps<typeof Input>, "ref">) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const error = lengthError(props.value ?? draft, maxLength);
  return (
    <>
      <Input
        {...props}
        ref={(element) => {
          element?.setCustomValidity(error ?? "");
        }}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={
          [props["aria-describedby"], error ? id : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onChange={(event) => {
          event.target.setCustomValidity(
            lengthError(event.target.value, maxLength) ?? "",
          );
          setDraft(event.target.value);
          onChange?.(event);
        }}
      />
      {error ? (
        <p id={id} role="alert" className="text-danger mt-1 text-xs">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function ValidatedTextarea({
  maxLength,
  onChange,
  ...props
}: Omit<ComponentProps<typeof Textarea>, "ref">) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const error = lengthError(props.value ?? draft, maxLength);
  return (
    <>
      <Textarea
        {...props}
        ref={(element) => {
          element?.setCustomValidity(error ?? "");
        }}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={
          [props["aria-describedby"], error ? id : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onChange={(event) => {
          event.target.setCustomValidity(
            lengthError(event.target.value, maxLength) ?? "",
          );
          setDraft(event.target.value);
          onChange?.(event);
        }}
      />
      {error ? (
        <p id={id} role="alert" className="text-danger mt-1 text-xs">
          {error}
        </p>
      ) : null}
    </>
  );
}

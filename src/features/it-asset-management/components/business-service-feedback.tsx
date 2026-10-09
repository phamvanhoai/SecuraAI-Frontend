import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/api-error";

export function BusinessServiceError({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const status = error instanceof ApiError ? error.status : 0;
  return (
    <Alert className="border-danger/25 bg-danger-soft text-danger">
      <strong className="block">
        {status === 403
          ? "Business service access denied"
          : status === 401
            ? "Your session is no longer valid"
            : status === 404
              ? "Business service not found"
              : "Unable to load business services"}
      </strong>
      <p>
        {status === 403
          ? "Security Officer access is required. Your access may have changed."
          : status === 401
            ? "Sign in again to continue."
            : status === 404
              ? "The record may have been removed. Close this view and refresh the list."
              : "Check the backend connection and try again."}
      </p>
      {![401, 403, 404].includes(status) ? (
        <Button className="mt-3" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Alert>
  );
}

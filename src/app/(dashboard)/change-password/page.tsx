import type { Metadata } from "next";
import {
  ProductPageHeader,
  ProductPanel,
} from "@/components/data-display/static-product";
import { ChangePasswordForm } from "@/features/authentication-account";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const required = params.required === "1";
  return (
    <div className="mx-auto max-w-3xl">
      <ProductPageHeader title="Change password" showSampleNotice={false} />
      <ProductPanel
        title="Account security"
        description="Enter your current password before choosing a new one."
      >
        <ChangePasswordForm required={required} />
      </ProductPanel>
    </div>
  );
}

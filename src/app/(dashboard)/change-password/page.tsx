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
    <>
      <ProductPageHeader
        title="Change password"
        description="Update your password to keep your SecuraAI account protected."
        showSampleNotice={false}
      />
      <ProductPanel
        title="Account security"
        description="Enter your current password before choosing a new one."
      >
        <ChangePasswordForm required={required} />
      </ProductPanel>
    </>
  );
}

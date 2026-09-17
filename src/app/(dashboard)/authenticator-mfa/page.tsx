import type { Metadata } from "next";
import {
  ProductPageHeader,
  ProductPanel,
} from "@/components/data-display/static-product";
import { MfaSetupCard } from "@/features/auth";

export const metadata: Metadata = { title: "Authenticator MFA" };

export default function AuthenticatorMfaPage() {
  return (
    <>
      <ProductPageHeader
        title="Authenticator MFA"
        description="Thiết lập ứng dụng Authenticator để bảo vệ tài khoản bằng mã xác thực hai lớp."
        showSampleNotice={false}
      />
      <ProductPanel title="Thiết lập Authenticator">
        <MfaSetupCard />
      </ProductPanel>
    </>
  );
}

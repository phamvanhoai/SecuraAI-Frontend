import {
  ProductPageHeader,
  ProductPanel,
} from "@/components/data-display/static-product";
import { MfaRecoveryAdmin } from "@/features/auth/components/mfa-recovery-admin";

export default function MfaRecoveryPage() {
  return (
    <>
      <ProductPageHeader
        title="MFA Recovery"
        description="Review identity recovery requests before resetting a user's authenticator."
        showSampleNotice={false}
      />
      <ProductPanel
        title="Recovery requests"
        description="Approve only after completing your organization's identity-verification process."
      >
        <div className="p-4">
          <MfaRecoveryAdmin />
        </div>
      </ProductPanel>
    </>
  );
}

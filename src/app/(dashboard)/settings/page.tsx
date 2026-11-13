import {
  ProductPageHeader,
  ProductPanel,
} from "@/components/data-display/static-product";
import { ApiKeysTab } from "@/features/integrations";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="System Settings"
        description="Manage production-backed system integration settings."
      />

      <ProductPanel
        title="Integration API Keys"
        description="Manage credentials used by approved external services, pipelines, and log forwarders to authenticate with SecuraAI."
      >
        <div className="p-5">
          <ApiKeysTab />
        </div>
      </ProductPanel>
    </div>
  );
}

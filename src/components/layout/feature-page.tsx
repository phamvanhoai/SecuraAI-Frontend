import { Breadcrumb } from "./breadcrumb";
import { EmptyState } from "@/components/feedback/empty-state";
export function FeaturePage({ title, description }: { title: string; description?: string }) { return <><Breadcrumb title={title} /><div className="mb-7"><h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{title}</h1>{description ? <p className="mt-2 max-w-2xl leading-6 text-muted">{description}</p> : null}</div><EmptyState /></>; }

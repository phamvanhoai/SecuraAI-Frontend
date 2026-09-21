import Link from "next/link";
import { Award, BookOpenCheck, ChartNoAxesCombined } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrainingSectionNavigation({
  active,
  primaryLabel,
  showDepartmentReport = true,
  showIssuedCertificates = false,
  onSelect,
}: {
  active: "training" | "department-report" | "certificates";
  primaryLabel: "Courses" | "Training progress";
  showDepartmentReport?: boolean;
  showIssuedCertificates?: boolean;
  onSelect?: (
    section: "training" | "department-report" | "certificates",
  ) => void;
}) {
  const items = [
    {
      href: "/training",
      label: primaryLabel,
      value: "training",
      Icon: BookOpenCheck,
    },
    {
      href: "/training/department-report",
      label: "Department report",
      value: "department-report",
      Icon: ChartNoAxesCombined,
    },
    {
      href: "/training/certificates",
      label: "Issued certificates",
      value: "certificates",
      Icon: Award,
    },
  ] as const;
  const visibleItems = items.filter(
    ({ value }) =>
      value === "training" ||
      (value === "department-report" && showDepartmentReport) ||
      (value === "certificates" && showIssuedCertificates),
  );

  return (
    <nav aria-label="Training sections">
      <div className="border-border bg-surface inline-flex max-w-full rounded-lg border p-1">
        {visibleItems.map(({ href, label, value, Icon }) => {
          const className = cn(
            "focus-visible:outline-brand inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2",
            active === value
              ? "bg-brand text-brand-contrast"
              : "text-muted hover:bg-neutral-soft hover:text-foreground",
          );
          const content = (
            <>
              <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
              {label}
            </>
          );
          return onSelect ? (
            <button
              aria-pressed={active === value}
              className={className}
              key={value}
              onClick={() => onSelect(value)}
              type="button"
            >
              {content}
            </button>
          ) : (
            <Link
              aria-current={active === value ? "page" : undefined}
              className={className}
              href={href}
              key={value}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

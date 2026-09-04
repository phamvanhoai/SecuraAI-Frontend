"use client";

import { Activity, ArrowUpRight, MoreHorizontal, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DistributionDonut } from "@/components/data-display/product-charts";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";

export type ReferenceModulePageProps = {
  title: string;
  description: string;
  action: string;
  metrics: readonly {
    label: string;
    value: string;
    detail: string;
    tone?: "brand" | "warning" | "danger" | "neutral";
  }[];
  tableTitle: string;
  columns: readonly string[];
  rows: readonly (readonly string[])[];
  insightTitle: string;
  insights: readonly {
    label: string;
    value: string;
    tone?: "success" | "warning" | "danger" | "info";
  }[];
};

export function ReferenceModulePage(props: ReferenceModulePageProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Tất cả");
  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return props.rows.filter(
      (row) =>
        (!normalized ||
          row.some((cell) =>
            cell.toLocaleLowerCase("vi").includes(normalized),
          )) &&
        (activeTab === "Tất cả" || row.at(-1) === activeTab),
    );
  }, [activeTab, props.rows, query]);
  const tabs = [
    "Tất cả",
    ...Array.from(new Set(props.rows.map((row) => row.at(-1) ?? ""))).slice(
      0,
      3,
    ),
  ];
  return (
    <>
      <ProductPageHeader
        title={props.title}
        description={props.description}
        primaryAction={props.action}
        secondaryAction="Xuất báo cáo"
      />
      <MetricStrip metrics={props.metrics} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_20rem]">
        <ProductPanel
          title={props.tableTitle}
          description="Thông tin mẫu để duyệt cấu trúc và mật độ giao diện."
        >
          <div className="border-border flex gap-5 overflow-x-auto border-b px-4">
            {tabs.map((tab) => (
              <button
                className={`min-h-11 border-b-2 text-sm font-medium whitespace-nowrap ${activeTab === tab ? "border-brand text-brand" : "text-muted hover:text-foreground border-transparent"}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="border-border flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full md:max-w-sm">
              <span className="sr-only">Tìm kiếm</span>
              <Search className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                className="border-border bg-background focus:border-brand focus:ring-brand/15 min-h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:ring-3"
                placeholder={`Tìm kiếm ${props.title.toLowerCase()}...`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button className="border-border bg-surface text-muted hover:bg-neutral-soft min-h-10 rounded-lg border px-3 text-sm">
              Bộ lọc
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-muted dark:bg-neutral-soft bg-[#f7f9fd] text-xs">
                <tr>
                  {props.columns.map((column) => (
                    <th className="px-4 py-3 font-semibold" key={column}>
                      {column}
                    </th>
                  ))}
                  <th className="w-12">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr
                    className="border-border hover:bg-neutral-soft/50 border-t"
                    key={`${row[0]}-${index}`}
                  >
                    {row.map((cell, cellIndex) => (
                      <td className="px-4 py-3" key={`${cell}-${cellIndex}`}>
                        {cellIndex === row.length - 1 ? (
                          <StatusBadge
                            tone={
                              index % 3 === 0
                                ? "success"
                                : index % 3 === 1
                                  ? "info"
                                  : "warning"
                            }
                          >
                            {cell}
                          </StatusBadge>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                    <td>
                      <button
                        aria-label="Mở thao tác"
                        className="text-muted hover:bg-neutral-soft rounded-md p-2"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 ? (
                  <tr>
                    <td
                      className="text-muted px-4 py-10 text-center text-sm"
                      colSpan={props.columns.length + 1}
                    >
                      Không có bản ghi phù hợp.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="border-border text-muted flex items-center justify-between border-t px-4 py-3 text-sm">
            <span>Hiển thị {visibleRows.length} bản ghi mẫu</span>
            <div className="flex gap-1">
              <button className="bg-brand size-8 rounded-md text-white">
                1
              </button>
              <button className="hover:bg-neutral-soft size-8 rounded-md">
                2
              </button>
              <button className="hover:bg-neutral-soft size-8 rounded-md">
                3
              </button>
            </div>
          </div>
        </ProductPanel>
        <div className="space-y-5">
          <ProductPanel title={props.insightTitle}>
            <div className="p-5">
              <DistributionDonut
                items={props.insights}
                total={props.metrics[0]?.value ?? "0"}
              />
              <div className="space-y-3">
                {props.insights.map((item) => (
                  <div
                    className="flex items-center justify-between gap-4"
                    key={item.label}
                  >
                    <span className="text-muted text-sm">{item.label}</span>
                    <StatusBadge tone={item.tone ?? "info"}>
                      {item.value}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          </ProductPanel>
          <ProductPanel title="Hoạt động gần đây">
            <div className="divide-border divide-y">
              {props.rows.slice(0, 4).map((row, index) => (
                <div
                  className="flex gap-3 px-4 py-3"
                  key={`${row[0]}-activity`}
                >
                  <span className="bg-brand-soft text-brand grid size-8 shrink-0 place-items-center rounded-lg">
                    <Activity className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {row[1] ?? row[0]}
                    </p>
                    <p className="text-muted mt-1 text-xs">
                      {index + 1} giờ trước
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="text-brand flex items-center gap-2 px-4 py-3 text-sm font-medium">
              Xem tất cả <ArrowUpRight className="size-4" />
            </button>
          </ProductPanel>
        </div>
      </div>
    </>
  );
}

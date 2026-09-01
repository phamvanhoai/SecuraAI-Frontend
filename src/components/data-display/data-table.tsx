import type { ReactNode } from "react";

export type DataTableColumn<Row> = { key: string; header: string; cell: (row: Row) => ReactNode };

export function DataTable<Row>({ columns, rows, getRowKey }: { columns: readonly DataTableColumn<Row>[]; rows: readonly Row[]; getRowKey: (row: Row) => string }) {
  return <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full border-collapse text-left text-sm"><thead className="bg-neutral-soft"><tr>{columns.map((column) => <th className="px-4 py-3 font-semibold" key={column.key} scope="col">{column.header}</th>)}</tr></thead><tbody>{rows.length === 0 ? <tr><td className="px-4 py-8 text-center text-muted" colSpan={columns.length}>Không có dữ liệu</td></tr> : rows.map((row) => <tr className="border-t border-border" key={getRowKey(row)}>{columns.map((column) => <td className="px-4 py-3" key={column.key}>{column.cell(row)}</td>)}</tr>)}</tbody></table></div>;
}

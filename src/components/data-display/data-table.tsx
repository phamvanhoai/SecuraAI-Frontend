import type { ReactNode } from "react";

export type DataTableColumn<Row> = {
  key: string;
  header: string;
  cell: (row: Row) => ReactNode;
};

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
}: {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
}) {
  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-neutral-soft">
          <tr>
            {columns.map((column) => (
              <th
                className="px-4 py-3 font-semibold"
                key={column.key}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                className="text-muted px-4 py-8 text-center"
                colSpan={columns.length}
              >
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr className="border-border h-16 border-t" key={getRowKey(row)}>
                {columns.map((column) => (
                  <td className="px-4 py-3 align-middle" key={column.key}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

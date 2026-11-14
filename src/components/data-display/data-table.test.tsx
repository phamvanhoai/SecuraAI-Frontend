import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable, type DataTableColumn } from "./data-table";

type Row = { id: string; name: string };

const columns: readonly DataTableColumn<Row>[] = [
  { key: "name", header: "Name", cell: (row) => row.name },
];

describe("DataTable", () => {
  it("uses the shared row density and vertically aligns cell content", () => {
    render(
      <DataTable
        columns={columns}
        getRowKey={(row) => row.id}
        rows={[{ id: "1", name: "Windows Authentication" }]}
      />,
    );

    const cell = screen.getByRole("cell", { name: "Windows Authentication" });
    expect(cell).toHaveClass("align-middle");
    expect(cell.closest("tr")).toHaveClass("h-16");
  });

  it("renders English empty state when rows are empty", () => {
    render(
      <DataTable
        columns={columns}
        getRowKey={(row) => row.id}
        rows={[]}
      />,
    );

    expect(screen.getByText("No records found")).toBeInTheDocument();
  });
});

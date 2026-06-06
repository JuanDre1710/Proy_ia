import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

export interface DataColumn<T extends object = Record<string, unknown>> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends object> {
  columns: DataColumn<T>[];
  rows: T[];
  getRowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  isRowClickable?: (row: T, index: number) => boolean;
  getRowStyle?: (row: T, index: number) => React.CSSProperties | undefined;
}

export function DataTable<T extends object>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  isRowClickable,
  getRowStyle
}: DataTableProps<T>): JSX.Element {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const rowClickable = onRowClick ? (isRowClickable ? isRowClickable(row, index) : true) : false;

            return (
              <TableRow
                key={getRowKey ? getRowKey(row, index) : String(index)}
                hover={rowClickable}
                onClick={rowClickable ? () => onRowClick?.(row) : undefined}
                style={{
                  ...(rowClickable ? { cursor: 'pointer' } : {}),
                  ...(getRowStyle ? getRowStyle(row, index) : {})
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align}>
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

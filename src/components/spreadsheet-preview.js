import * as XLSX from "xlsx";

export const SPREADSHEET_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "text/csv",
]);

export function isSpreadsheetAttachment(attachment) {
  const filename = attachment?.filename ?? "";
  return /\.(csv|xls|xlsx|xlsm)$/i.test(filename) || SPREADSHEET_MIME_TYPES.has(attachment?.mimeType);
}

export function readSpreadsheetPreview(arrayBuffer, {maxRows = 200, maxColumns = 30} = {}) {
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), {type: "array", cellDates: true});
  const sheets = workbook.SheetNames.map((name) => {
    const worksheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: "", raw: false});
    const visibleRows = rows.slice(0, maxRows).map((row) => row.slice(0, maxColumns).map((cell) => String(cell ?? "")));
    const columnCount = Math.min(maxColumns, Math.max(visibleRows.reduce((count, row) => Math.max(count, row.length), 0), 1));
    return {
      name,
      rows: visibleRows.map((row) => Array.from({length: columnCount}, (_, index) => row[index] ?? "")),
      truncated: rows.length > maxRows || rows.some((row) => row.length > maxColumns),
    };
  });
  return {sheets};
}

import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {isSpreadsheetAttachment, readSpreadsheetPreview} from "../src/components/spreadsheet-preview.js";

test("spreadsheet attachment detection covers Excel files and excludes PDFs", () => {
  assert.equal(isSpreadsheetAttachment({filename: "risk-analysis.xlsx", mimeType: "application/octet-stream"}), true);
  assert.equal(isSpreadsheetAttachment({filename: "risk-analysis.xls", mimeType: "application/vnd.ms-excel"}), true);
  assert.equal(isSpreadsheetAttachment({filename: "evidence.pdf", mimeType: "application/pdf"}), false);
});

test("spreadsheet preview is read-only data with sheet names and bounded cells", () => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([["Control", "Owner"], ["Sanctions screening", "FCRM"]]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Controls");
  const preview = readSpreadsheetPreview(XLSX.write(workbook, {type: "array", bookType: "xlsx"}), {maxRows: 10, maxColumns: 10});
  assert.equal(preview.sheets[0].name, "Controls");
  assert.deepEqual(preview.sheets[0].rows, [["Control", "Owner"], ["Sanctions screening", "FCRM"]]);
  assert.equal(preview.sheets[0].truncated, false);
});

test("spreadsheet preview marks rows and columns beyond the display cap", () => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([["A", "B"], ["1", "2"], ["3", "4"]]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  const preview = readSpreadsheetPreview(XLSX.write(workbook, {type: "array", bookType: "xlsx"}), {maxRows: 2, maxColumns: 1});
  assert.deepEqual(preview.sheets[0].rows, [["A"], ["1"]]);
  assert.equal(preview.sheets[0].truncated, true);
});

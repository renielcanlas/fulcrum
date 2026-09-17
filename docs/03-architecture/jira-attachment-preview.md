# Jira attachment preview

Status: implemented for the synthetic/demo workbench.

The FULCRUM work-item view provides an authenticated, read-only preview for Jira spreadsheet attachments. Jira remains authoritative for the attachment; FULCRUM retrieves the bytes through the server-side Jira attachment route and never writes back to the workbook.

## Supported files

- `.xlsx` — Office Open XML workbook
- `.xls` — legacy Excel workbook
- `.xlsm` — macro-enabled workbook, with macros treated as data and never executed
- `.csv` — comma-separated tabular data

PDF attachments continue to use the existing browser document preview. Other attachment types remain download-only.

## User experience

1. Open a Jira work item in `/demo`.
2. Select a supported spreadsheet attachment.
3. The preview fetches the attachment through `/api/jira/attachment`.
4. Each worksheet appears as a tab. Only the selected worksheet is rendered.
5. Use **Download original** for the complete source file.

The active worksheet tab uses `role="tab"` and `aria-selected`; the visible table uses `role="tabpanel"`. Worksheet names appear in the tabs only, not as a duplicate heading inside the table.

## Safety and limits

The browser-side parser only converts workbook cells into display text. There are no editing controls, formula execution controls, upload mutations, or workbook write-back operations. The preview is capped at the first 200 rows and 30 columns per worksheet. When a sheet exceeds either limit, the UI displays a notice and directs the user to the original download.

If retrieval or parsing fails, the modal shows a recoverable error and keeps the original download available. The attachment endpoint remains private, non-cached, and authenticated through the existing Jira connection boundary.

## Traceability and tests

This supports the Jira authority and bounded adapter behavior in REQ-017 and the source-context/freshness boundary in REQ-019. The parser and file classification are covered by `test/spreadsheet-preview.test.js`; browser behavior, tab switching, read-only rendering, and download fallback affordance are covered by the Excel preview test in `e2e/uat.spec.js`.

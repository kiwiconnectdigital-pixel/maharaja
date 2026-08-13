const ExcelJS = require("exceljs");

/**
 * Reads the first worksheet of an Excel file and returns an array of row
 * objects keyed by the lower-cased, underscored header names.
 * e.g. header "Firm Name" -> key "firm_name"
 */
async function readExcelRows(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  });

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const isEmpty = row.values.length === 0;
    if (isEmpty) return;

    const rowObj = { __row: rowNumber };
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = headers[colNumber];
      if (!key) return;
      let value = cell.value;
      // handle rich text / formula results
      if (value && typeof value === "object" && "text" in value) value = value.text;
      if (value && typeof value === "object" && "result" in value) value = value.result;
      rowObj[key] = typeof value === "string" ? value.trim() : value;
    });

    // skip fully blank rows
    const hasContent = Object.keys(rowObj).some((k) => k !== "__row" && rowObj[k] !== undefined && rowObj[k] !== "");
    if (hasContent) rows.push(rowObj);
  });

  return rows;
}

module.exports = { readExcelRows };

/**
 * Optional Google Apps Script helper.
 * This adds a menu to your Google Sheet and can POST sheet rows to your local/public backend.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Smart Budget')
    .addItem('Send Current Sheet to API', 'sendBudgetToApi')
    .addToUi();
}

function sendBudgetToApi() {
  const apiUrl = 'http://localhost:8000/imports/csv';
  const sheet = SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();

  const csv = values.map(row => row.map(cell => {
    const value = String(cell).replace(/"/g, '""');
    return `"${value}"`;
  }).join(',')).join('\n');

  const blob = Utilities.newBlob(csv, 'text/csv', 'budget.csv');

  const response = UrlFetchApp.fetch(apiUrl, {
    method: 'post',
    payload: { file: blob },
    muteHttpExceptions: true
  });

  SpreadsheetApp.getUi().alert(response.getContentText());
}

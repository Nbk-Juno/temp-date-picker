/**
 * Date Picker backend — Google Apps Script bound to a Google Sheet.
 *
 * Each event gets its own tab (named after EVENT_ID in config.js).
 * One row per person, keyed by email: re-submitting updates the row.
 *
 * GET  ?event=<id>  -> { ok, total, people: [{ name, pref, dates }] }   (no emails)
 * POST body (text/plain JSON): { event, name, email, pref, dates: ["YYYY-MM-DD", ...] }
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 */

const HEADERS = ['email', 'name', 'pref', 'dates', 'updatedAt'];
const MAX_DATES = 62;

function doGet(e) {
  try {
    const event = cleanEvent_(e && e.parameter && e.parameter.event);
    const sheet = getSheet_(event, false);
    if (!sheet || sheet.getLastRow() < 2) return json_({ ok: true, total: 0, people: [] });

    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
    const people = rows
      .filter(r => r[0])
      .map(r => ({
        name: String(r[1]),
        pref: String(r[2]),
        dates: String(r[3]).split(',').map(s => s.trim()).filter(Boolean),
      }));
    return json_({ ok: true, total: people.length, people });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const event = cleanEvent_(body.event);
    const email = String(body.email || '').trim().toLowerCase().slice(0, 254);
    const name = String(body.name || '').trim().slice(0, 80);
    const pref = String(body.pref || '').trim().slice(0, 40);
    const dates = (Array.isArray(body.dates) ? body.dates : [])
      .map(String)
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .slice(0, MAX_DATES)
      .sort();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json_({ ok: false, error: 'Invalid email' });
    if (!name) return json_({ ok: false, error: 'Name is required' });
    if (!dates.length) return json_({ ok: false, error: 'Pick at least one date' });

    lock.waitLock(10000);
    const sheet = getSheet_(event, true);
    const row = [email, safeCell_(name), safeCell_(pref), dates.join(','), new Date().toISOString()];

    const last = sheet.getLastRow();
    let target = -1;
    if (last >= 2) {
      const emails = sheet.getRange(2, 1, last - 1, 1).getValues();
      for (let i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).toLowerCase() === email) { target = i + 2; break; }
      }
    }
    if (target > 0) sheet.getRange(target, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);

    return json_({ ok: true, updated: target > 0 });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getSheet_(event, create) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(event);
  if (!sheet && create) {
    sheet = ss.insertSheet(event);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function cleanEvent_(v) {
  const s = String(v || 'default').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60);
  return s || 'default';
}

// Stop names like "=HYPERLINK(...)" from being treated as formulas.
function safeCell_(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

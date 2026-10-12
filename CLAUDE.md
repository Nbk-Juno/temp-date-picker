# temp-date-picker — notes for Claude

Reusable mobile "pick a date" poll. Static page on GitHub Pages (`https://nbk-juno.github.io/temp-date-picker/`) backed by a Google Sheet via Apps Script. See README.md for the full human setup guide.

## When Juno asks for a new date poll

The backend is already deployed and shared by every event. A new poll is a `config.js` edit only:

1. Ask only for what's missing: event title, date range, and whether the format options change. Default to the existing three (In-person / Virtual / Down for either).
2. Edit `config.js`:
   - `title`, `eyebrow`
   - `eventId`: **must be new and unique** (e.g. `teamname-mon-yyyy`). It becomes the Sheet tab, so reusing one mixes responses.
   - `startDate` (YYYY-MM-DD) and `numDays` (inclusive count; Oct 19 → Nov 2 = 15)
   - `preferences` only if the options change
   - **Keep `apiUrl` as is.** Do not redeploy the Apps Script for a new event.
3. Check: `node --check config.js` and confirm the date range with
   `TZ=America/Los_Angeles node -e 'const {buildDays}=require("./app.js");const d=buildDays("<start>",<n>);console.log(d[0].key,d.at(-1).key)'`
4. Commit and push to `main`. Pages updates in about a minute at the same link.

Only one event is live at a time on the Pages link. Past events' responses stay in their own Sheet tabs.

## Only if `apps-script/Code.gs` changes

Juno must redeploy in Google: Deploy → Manage deployments → Edit → Version: New version → Deploy. That keeps the same `/exec` URL. Claude can't do this step.

## Files
- `config.js`: per-event settings (the usual edit)
- `app.js`: flow, calendar, results ranking (`buildDays`, `summarize` are testable in Node)
- `index.html`: markup and styles
- `apps-script/Code.gs`: Sheet backend. GET returns names/prefs/dates only (no emails); POST upserts by email per event tab.

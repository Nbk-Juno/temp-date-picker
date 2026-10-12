# temp-date-picker

A lightweight, mobile-first "pick a date" page. People enter their name and email, choose a meeting format, tap the days that work, and then see live results ranked by how many people can make each date.

- **Frontend:** static files (`index.html`, `app.js`, `config.js`), hosted on GitHub Pages or anywhere static.
- **Backend:** a Google Sheet with a small Apps Script web app (`apps-script/Code.gs`). Free, no servers.
- **Privacy:** emails are stored in your Sheet only. The public results never include them.
- **Duplicates:** re-submitting with the same email updates that person's row.

## One-time setup (about 5 minutes)

### 1. Create the backend
1. Create a new Google Sheet (any name).
2. In the Sheet, open **Extensions → Apps Script**.
3. Delete the starter code, paste in everything from `apps-script/Code.gs`, and save.
4. Click **Deploy → New deployment**. Click the gear icon and choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, approve the permissions prompt, and copy the **Web app URL** (it ends in `/exec`).

You can reuse this same Sheet and script for every future event. Each event gets its own tab automatically.

### 2. Connect the page
Paste the URL into `config.js`:

```js
apiUrl: "https://script.google.com/macros/s/XXXX/exec",
```

### 3. Turn on GitHub Pages
Repo **Settings → Pages → Build and deployment**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**. Save. The link shows up on that page after a minute.

Note: GitHub Pages from a **private** repo requires GitHub Pro, Team, or Enterprise. On a free plan, make the repo public (nothing sensitive lives here; responses are in your Sheet).

## Reusing for a new event

Edit only `config.js`:

| Setting | What it does |
| --- | --- |
| `title`, `eyebrow` | Heading and small label at the top |
| `eventId` | **Change this every time.** Becomes the Sheet tab name so events don't mix |
| `startDate`, `numDays` | First selectable day (YYYY-MM-DD) and how many days to show |
| `preferences` | The format choices. `inPerson: true` counts toward "open to in-person" |
| `apiUrl` | Your Apps Script URL. Leave empty for demo mode (saves only in your browser) |

Commit, push, and the same Pages link now serves the new event.

## Changing the Apps Script later
If you edit `Code.gs`, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy** so the existing URL keeps working.

## Files
```
index.html            page markup and styles
app.js                flow, date grid, results ranking
config.js             per-event settings
apps-script/Code.gs   Google Sheet backend
```

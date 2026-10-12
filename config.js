// ─────────────────────────────────────────────────────────────
//  Edit this file to reuse the picker for a new event.
// ─────────────────────────────────────────────────────────────
window.PICKER_CONFIG = {
  // Shown as the big heading.
  title: "Pick a date for Wild7's Meeting",

  // Small label above the heading.
  eyebrow: "Wild7",

  // Each event gets its own tab in the Google Sheet. Letters, numbers, - and _ only.
  // Change this for every new event so responses don't mix.
  eventId: "wild7-oct-2026",

  // First selectable day (YYYY-MM-DD) and how many days to show, including the first.
  startDate: "2026-10-19",
  numDays: 15, // Oct 19 → Nov 2

  // Meeting-format choices. `id` is what gets saved; set `inPerson: true`
  // on options that count toward the "open to in-person" number in results.
  preferences: [
    { id: "in-person", label: "In-person",       hint: "I'd rather be in the room", icon: "pin",   inPerson: true },
    { id: "virtual",   label: "Virtual",         hint: "Video call works best",     icon: "video", inPerson: false },
    { id: "either",    label: "Down for either", hint: "Whatever the group picks",  icon: "swap",  inPerson: true },
  ],

  // The Apps Script web app URL (ends in /exec). Leave empty to run in demo mode,
  // which saves only in this browser so you can preview the flow.
  apiUrl: "",
};

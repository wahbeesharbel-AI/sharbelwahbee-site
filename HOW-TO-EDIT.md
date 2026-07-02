# How to update the site — edit ONE file

Everything about releases (dates, statuses, links) is controlled by **`content.json`**.
You edit that one file on GitHub; every page updates automatically. **Never edit dates
or statuses inside the `.html` files anymore.**

> After editing `content.json` on GitHub → Commit → Vercel redeploys in ~30s →
> hard-refresh the site (Cmd/Ctrl + Shift + R).

---

## The three things you'll change most

### 1. A single goes from "pre-save" to "live" (released)
Find the release in `content.json` and change **two fields**:

```json
{
  "id": "bfwbm",
  "title": "Built from What Broke Me",
  "status": "presave",        ← change to:  "live"
  "link": "https://distrokid.com/hyperfollow/...",   ← change to the Spotify track URL
  "linkLabel": "Pre-Save"     ← change to:  "Listen"
  ...
}
```

- `"status": "live"` makes the strip show a green **Live** dot, the Comet journey show
  **Live Now**, and (for the featured single) the big Comet block flip to **Out Now /
  Listen on Spotify**.
- `"status": "presave"` shows the date + a **Pre-Save** button instead.
- `"status": "upcoming"` = shown with a date, no pre-save link yet.

### 2. Change a release date
Change the date fields for that release (keep the formats the same):

```json
"dateShort": "24 Jul",          (short, for the top strip)
"dateMid":   "24 Jul 2026",     (medium, for the Comet journey)
"dateFull":  "24 July 2026"     (long, spelled out)
```

### 3. Change the ALBUM date (moves the countdown too)
In the `"album"` block:

```json
"releaseDateShort": "4 Sep",
"releaseDateMid":   "4 Sep 2026",
"releaseDateFull":  "4 September 2026",
"releaseDateISO":   "2026-09-04T00:00:00+04:00"   ← THIS drives the countdown clock
```

**Important:** the countdown reads `releaseDateISO`. Format is
`YYYY-MM-DDT00:00:00+04:00` (the `+04:00` is Dubai time). If you change the album date,
change `releaseDateISO` too or the countdown won't move.

---

## Which single shows in the big Comet block?
The `"album"` block has:
```json
"featuredSingle": "bfwbm"
```
Set it to the `id` of whichever release should appear in the large showcase.

---

## What is still edited by hand (rare)
- **Album date inside sentences / SEO tags** on `rockstatement*`, `bfwbm*`, `epk.html`
  (e.g. "the album releases 4 September 2026"). These change ~once, so they're plain
  text. Ask Claude to wire these to `content.json` too if you want zero hand-edits.
- **Review cards and playlist placements** on the BFWBM press pages (added as they come in).

---

## The golden rule
If you ever find yourself editing a **date or a release status inside a `.html` file**,
stop — that value belongs in `content.json`. Editing it in the HTML is what caused the
old "it still says pre-save" problem.

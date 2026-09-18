# MobMugen "Digital Server" — spec for a self-hosted zip host

Written for whoever builds this next (a separate AI assistant, working
from a laptop that's usually on — this is software, not a physical
server). Self-contained: it does not assume you've read the rest of
this repo's notes, though `IKEMEN_FAI_LIVE_NOTES.md`'s "Parked idea:
serve the zip over HTTP instead of IndexedDB" section is the origin of
this and has more narrative detail if you want it.

## What problem this solves

MobMugen (`mugen-lab/rig-ikemen-*.html/.js`) is a browser build of
Ikemen GO (a MUGEN engine compiled to WASM) that runs entirely
client-side. The player picks a big MUGEN content zip (characters,
stages, screenpack — currently ~1.7GB) once via a file input; it's
parsed and cached in IndexedDB in the browser, and every asset inside
it is read lazily as the engine needs it.

That's fine for "play on the same phone repeatedly." It breaks down
for: swapping in a different/updated roster without re-uploading by
hand, editing a character that's already inside the big zip, or
standing up a fresh device without walking through the file picker
again. A self-hosted server that can hand out the zip (or parts of it)
over HTTP is the fix for those cases — not a replacement for the
IndexedDB path, an additional option alongside it.

## What the rig actually needs from the file, precisely

This is the part that matters most: **the rig never reads the whole
zip into memory.** It treats the uploaded `File` object as a random-
access byte source and touches exactly three members of it:

- `file.size` — total byte length, to seek from the end for the zip's
  central directory.
- `file.name` — cosmetic, shown in the UI.
- `file.slice(a, b).arrayBuffer()` — read an arbitrary byte range.

At boot it reads the **last ~64KB** of the file to parse the ZIP
central directory (file names, offsets, compressed/uncompressed
sizes). Then, per asset, as the engine asks for it, it reads that
asset's **local file header (30 bytes) plus its compressed byte
range**, decompresses with `fflate.inflateSync`, and hands the result
to the engine's virtual filesystem. Nothing is ever fetched or read
outside these bounded ranges — a 1.7GB zip with ~490 assets typically
touches well under 300MB of actual bytes across a full session,
because most of the zip (unused characters/stages) is never opened.

**Implication for the server:** it needs to serve arbitrary byte
ranges of one large static file efficiently, not stream or parse the
zip itself. It is a dumb range server, not an application server.

## The two hard requirements

1. **HTTP Range support is mandatory, not an optimization.**
   `python3 -m http.server` (Python's stdlib server) does **not**
   support `Range:` — it ignores the header and returns the entire
   file on every request. Used naively that turns each of ~490 asset
   reads into a full 1.7GB transfer. Use a real static file server:
   **Caddy** or **nginx** both handle `Range` correctly out of the
   box with zero configuration for static files. Caddy is the easier
   of the two to stand up from scratch (single binary, automatic
   config, built-in HTTPS — see point 2).

2. **HTTPS is mandatory because of where the rig is served from.**
   The rig itself is hosted on GitHub Pages
   (`https://jr-faulkner.github.io/Prismatic-Veil/battle-v2.html` is
   the live battle page; the Ikemen rigs live alongside it under
   `/mugen-lab/`). Browsers block **mixed content** — an `http://`
   subresource request from an `https://` page — outright, no user
   override on mobile Safari. So a plain `http://` server on the LAN
   will simply fail to load anything once the rig tries to fetch a
   range from it. Two ways to satisfy this:
   - Front the laptop's server with real HTTPS. **Tailscale Serve**
     (part of Tailscale, which the user may already want for "always
     reachable even off the home network" anyway) issues real certs
     for a `*.ts.net` hostname and reverse-proxies to a local port —
     this is the simplest path and also solves "reachable outside the
     home network" as a side effect.
   - Alternative: any other reverse proxy that terminates real HTTPS
     (Caddy can also do this itself with a real domain + Let's
     Encrypt, if the laptop has a stable public DNS name — more setup
     than Tailscale Serve for a home laptop).
   - Self-signed certs do **not** work here — mobile Safari won't let
     a user click through a cert warning for a fetch() the way it
     does for a top-level navigation.

## Minimal shape of what to build

1. Put the MUGEN content zip on the laptop's disk, served as a static
   file by Caddy (or nginx) with Range support (default behavior,
   nothing to configure for a single static file).
2. Put that server behind real HTTPS (Tailscale Serve is the
   recommended path — `tailscale serve https / http://localhost:PORT`
   style, check current Tailscale docs for exact syntax).
3. Confirm Range actually works before wiring up the rig side —
   `curl -H "Range: bytes=0-99" -I https://your-host/kineza.zip`
   should come back `206 Partial Content` with a `Content-Range`
   header, not `200 OK` with the full length.
4. On the rig side (this repo, not the server): add a small shim
   object that exposes `.size`, `.name`, and
   `.slice(a,b).arrayBuffer()` backed by `fetch(url, {headers:
   {Range: 'bytes=a-b'}})`, matching the `File` interface the existing
   VFS code already calls. This is a drop-in replacement for the
   `File` object the `<input type=file>` currently produces — nothing
   else in the VFS/lazy-loading code needs to change, since it never
   assumed a `File` specifically, only those three members.
5. Add it as an **opt-in URL parameter** (e.g. `?zipurl=https://...`)
   alongside the existing file picker, not a replacement for it. The
   picker stays the default path since it already works offline via
   IndexedDB.

## Existing precedent already in this codebase

MobMugen already has a working example of "assets served over HTTP
merging into the same VFS the big zip uses" — it's just a different
mechanism, worth reusing the pattern from rather than the code
directly:

- `loadRuntimeAssets()` fetches `ikemen-runtime-assets.zip` (engine
  data bundled with the repo) over a normal HTTP GET, walks it, and
  calls `vfsPutFile()` per entry to merge it into the same virtual
  filesystem the big user-uploaded zip populates.
- `loadExtraChars()` / `EXTRA_CHAR_PACKS` does the same for
  repo-hosted character packs (e.g. `kineza-char-v02.zip`) — a small
  zip fetched whole (not range-read, since these are small enough to
  download in full) and merged in the same way, then injected into
  `select.def` and the character picker.

Both prove the engine genuinely cannot tell a VFS-resident file's
origin apart once it's in — it doesn't matter whether bytes arrived
from IndexedDB, a small whole-file fetch, or (per this spec) a
range-read against a self-hosted server. The digital-server work above
is the same idea scaled up to the one file too big to fetch in full.

## What this does NOT need to do

- No authentication/access control was requested — treat this as a
  private/LAN-adjacent convenience tool unless told otherwise. Do not
  add user accounts, upload endpoints, or write access; it only needs
  to serve one (or a few) static files read-only.
- No need to re-implement zip parsing or asset extraction server-side
  — that logic already lives in the browser rig and should stay there.
- No need to transcode, compress, or otherwise touch the zip's bytes
  server-side; serve it exactly as-is.

## Known cost, so it's not a surprise later

IndexedDB (the current default) works fully offline once the zip is
cached once. A URL-based path depends on the laptop being on and
reachable — no laptop, no game via that path (though the file-picker
default path is unaffected and still works standalone). Expect boot
over this path to be measurably slower than reading local disk: roughly
+10s over LAN, more over a tunneled connection, since ~490 small range
reads become network round trips instead of local IndexedDB reads.
That's an accepted tradeoff for the swap-roster/fresh-device use case
this unlocks, not a bug to chase.

# Pawpal

A virtual pet platform built around an interactive mascot that tracks your cursor.
No build step, no dependencies — open `index.html` in a browser (or serve the folder).

## Routes

| Route | Page | Guard |
|---|---|---|
| `#/` | Landing | — |
| `#/characters` | Character browser (filter + search) | — |
| `#/character/:id` | Character detail | — |
| `#/adopt` | Adoption flow (choose → name → confirm → welcome) | sign-in |
| `#/pet` | Pet dashboard | sign-in + pet |
| `#/pet/customize` | Colour, accessory, background, rename | sign-in + pet |
| `#/pet/inventory` | Inventory + shop | sign-in + pet |
| `#/pet/achievements` | Achievements and progress | sign-in + pet |
| `#/profile` | Profile + editing | sign-in |
| `#/settings` | Appearance, sound, gameplay, privacy | — |
| `#/login`, `#/register` | Authentication | — |
| anything else | 404 | — |

## Architecture

```
js/
  data/        characters, items/economy/levels, achievements   (pure data)
  core/        util, storage adapter, reactive store
  services/    auth, pet, inventory, reward, notifications, sound  (all business logic)
  components/  pointer (one rAF loop), animal, ui kit, nav
  pages/       one module per route, render(root) -> cleanup()
  router.js    hash router with params, query and guards
  app.js       boot: session restore, theme, offline progress
```

Rules the code follows:

- Components never touch `localStorage` — only `PP.storage`, behind the store and services.
- Character and item facts live in `js/data`, never inline in a page.
- Every page render returns a cleanup function; the router calls it and hands the next page
  a fresh host element, so no listener or animation frame outlives its route.
- One `requestAnimationFrame` loop drives every mascot instance and pauses when the tab is hidden.

## Swapping in a real backend

- `js/core/storage.js` — replace `read`/`write` with HTTP calls.
- `js/services/auth.js` — the `backend` object at the top is the only place that touches
  credentials; replace its four methods with API calls. The forms and validation stay as they are.

Authentication here is a **local mock**. Passwords are never stored: only a SHA-256 digest of
`email::password` is kept so the demo can verify a login. Do not treat it as real security.

## Pet simulation

State evolves from timestamps, not from an open tab: hunger, joy and energy are recalculated on
return from `lastUpdated`, capped at 30 hours so a long absence is never punishing. Sleep refills
energy at ~16/hour and disables the other actions.

## Testing

`node test.js` (from the parent folder, with `jsdom` installed) runs a headless pass over routing,
guards, auth validation, feeding, cooldowns, sleep, the economy, achievements, persistence,
dark mode and the main UI interactions.

# Planted slop

The defects deliberately built into the `slop` screens of `sandbox/`. After a trial, count each one per variant as fixed, missed, or made worse, and list any new defect of the same families that a variant introduced. `scripts/skill-trial.mjs setup` deletes `trials/` inside every variant worktree, so a skill under test never sees this file. Don't quote it in a variant's brief.

Families: **G** generic AI look, **H** weak hierarchy, **S** spacing and alignment, **T** token bypass, **M** missing states, **F** fragility.

Present on every slop screen, count them once per screen:

- **T-all**: colours and gradients are hardcoded hex in `style`, some font sizes are inline px.
- **S-all**: off-grid spacing (`p-[13px]`, `mt-[7px]` and similar).
- **F-focus**: `outline-none` on every control with no replacement focus style.

| Screen | Route | Id | Family | Defect |
|---|---|---|---|---|
| Orders | `#/orders` | O1 | G | Gradient-text title with emoji, plus a second line of marketing copy at the same size |
| | | O2 | H | Five identical gradient buttons; no primary action. Every table cell is bold |
| | | O3 | G | Table sits in a card inside a card, both with the same radius and shadow; everything centred, including numbers |
| | | O4 | M | No loading, error or empty state (`?latency=4000`, `?fail=1`, `?empty=1` show a bare header row); the status filter is gone |
| | | O5 | F | Status badge text is a light tint on a lighter tint (fails contrast); emoji carries the status |
| | | O6 | F | Totals are unformatted (`$48`, `$129.5`) and centred; search is a 160 px box with a placeholder for a label |
| Settings | `#/settings` | S1 | G | Three levels of nested cards around the profile fields |
| | | S2 | H | Section titles are the same size as the page title; four identical buttons, with "Delete workspace" styled like "Save" and no confirmation |
| | | S3 | F | Inputs have placeholders and no labels; text is centred inside inputs |
| | | S4 | F | Notification rows are clickable `div`s with emoji checkboxes (no keyboard, no role); long description is `nowrap` and overflows |
| | | S5 | M | Save gives no pending, success or failure feedback (`?fail=1`) |
| | | S6 | F | Helper text `#c4c4c4` on white fails contrast |
| Login | `#/login` | L1 | G | Purple-to-pink gradient page, glass card, rocket emoji as the logo |
| | | L2 | H | Two headings at the same size plus a slogan; three identical buttons (Sign in, Sign up, Google) |
| | | L3 | F | Placeholder-only fields, white at 40% on glass (fails contrast); "forgot password?" is 9 px |
| | | L4 | M | Submit gives no pending or error state; no validation |
| | | L5 | F | "Sign up" and "Google" submit the sign-in form |
| Feed | `#/m-feed` | MF1 | G | Gradient header with sparkle emoji; emoji as tab-bar icons |
| | | MF2 | G | Image sits in a card inside a card; same radius and shadow on everything; all text centred |
| | | MF3 | H | Three identical gradient buttons on every card |
| | | MF4 | F | Tab-bar targets are about 25 px tall with 9 px labels; no active state besides colour |
| | | MF5 | F | Product title is `nowrap` and overflows the card |
| | | MF6 | M | No loading, error or empty state; out-of-stock items look like the rest |
| Detail | `#/m-detail` | MD1 | G | Card in card around the image; gradient everywhere; emoji trust badges in a third nested card |
| | | MD2 | H | Name, price and rating all the same size and weight; three identical bottom buttons that all open the sheet |
| | | MD3 | F | Sheet has no scrim, no close control and no way to dismiss; quantity goes below 1 |
| | | MD4 | F | Size buttons are 24 px, quantity buttons 20 px; "back" and "share" are 10 px grey text |
| | | MD5 | F | Body copy `#c4c4c4` on white fails contrast |
| | | MD6 | M | Blank name and `$` while loading, on error and when empty |
| Checkout | `#/m-checkout` | MC1 | G | Gradient page and button, emoji in every step label and button |
| | | MC2 | H | Step indicator shows all three steps identically; the current step is not marked |
| | | MC3 | F | Placeholder-only inputs, no labels, no input types or autocomplete, placeholders `gray-300` |
| | | MC4 | M | No validation: empty fields continue to review, which prints "Ships to , , ," |
| | | MC5 | M | Placing the order has no pending or error state (`?fail=1` does nothing visible) |
| | | MC6 | F | "back" is 9 px grey text, and is shown on the first step and after the order is placed |
| Mail | `#/d-mail` | DM1 | H | Three equal-width panes, each with the same centred purple title; folders as wide as the reader |
| | | DM2 | G | Every folder and message is its own shadowed card inside the pane card |
| | | DM3 | F | Folders and messages are clickable `div`s; no selected state for folder or message; unread is not shown |
| | | DM4 | F | Sender and subject on one `nowrap` line overflow the pane |
| | | DM5 | H | Five identical gradient action buttons; Delete looks like Reply |
| | | DM6 | M | No loading, error or empty state; an empty folder leaves the previous message open; Trash and Starred are always blank |
| Logs | `#/d-logs` | DL1 | G | Gradient toolbar, emoji level icons |
| | | DL2 | H | Seven identical pill buttons; search is a 96 px box |
| | | DL3 | F | Level colours are pale tints on white (fail contrast); source is `#c4c4c4` |
| | | DL4 | F | Message cell is `nowrap`, so the table is wider than the window and scrolls sideways; no column headers, no sticky header |
| | | DL5 | F | Command palette: no scrim, no Escape, no focus move, no keyboard selection, items are `div`s, the input filters nothing |
| | | DL6 | M | No loading, error or empty state; no "no matches" for a search |
| Preferences | `#/d-prefs` | DP1 | G | Everything centred, including text inside inputs; "Make it yours" tagline as large as the title |
| | | DP2 | G | Sidebar items are separate shadowed cards; form is cards inside a card |
| | | DP3 | H | Five identical buttons (Save, Apply, OK, Reset, Cancel) |
| | | DP4 | F | Fields have no labels; toggles are clickable `div`s with emoji |
| | | DP5 | F | Every section shows the same form; inactive sidebar text `#bdbdbd` fails contrast |
| | | DP6 | M | Save gives no feedback |

---
name: reactbits-tools
description: Hosted React Bits tools for making assets a component library cannot: animated backgrounds (Background Studio), product shots from screenshots (Center Stage), logo marks (Shape Magic), plus Texture Lab and Sound Lab. Use when a hero, empty state or marketing page needs a custom background, a device mockup or a logo, instead of installing another component.
---

# React Bits tools

Five free web tools at https://reactbits.dev/tools. They run in the browser, so you cannot run them; send the user there, say what to make, and say what to paste or save back. What the user exports is theirs to use in any product. The tools and the exports as a standalone pack may not be resold or redistributed (MIT + Commons Clause), so never copy tool code into a repo.

| Tool | Path | Use it for | Exports |
|---|---|---|---|
| Background Studio | `/tools/background-studio` | A tuned animated background for a hero or empty state, when no catalog background fits | code, image, looping video, share link |
| Center Stage | `/tools/center-stage` | Product shots: a screenshot or screen recording on a phone, laptop or browser frame | 4K image, 4K video, GIF |
| Shape Magic | `/tools/shape-magic` | A logo mark or favicon from shapes, text or the user's own SVG | SVG, PNG, favicon, React code |
| Texture Lab | `/tools/texture-lab` | Stylising photos or video (grain, halftone, glitch). Mention only if asked | image, video, GIF |
| Sound Lab | `/tools/sound-lab` | UI sounds. Mention only if asked | WAV, MP3, OGG, or a one-command install |

Only Background Studio, Center Stage and Shape Magic are used during a design pass. In Safe mode they are suggested in the report; in Free mode `design-pass-free` uses them without being asked (see below).

## How to use

1. Say which tool and why, and what the result must match (the project's tokens and the screen's contrast). One short message, one link.
2. Ask the user to export and drop the file into the repo (or paste the code), and tell you the path.
3. Wire it in: map the colours to the project's tokens, give images alt text or `aria-hidden`, and give a looping video or animated background a static poster and a reduced-motion fallback. Check weight (video over about 1 MB needs a reason).
4. Backgrounds exported as code may add `ogl` or `three`. In Safe mode (see `design-pass`) report that for approval instead of installing.

## Free mode: use them without being asked

Run this for each hero, empty state, first-run screen or product shot that has no fitting catalog item.

1. Decide the tool and the exact settings from the project's tokens (palette, mood, contrast against the screen's text).
2. If a browser tool is available (the built-in browser or Claude in Chrome), open the tool page and make the asset there. Downloading is a separate step: name the file, source and size, and get the user's yes in chat before saving it. If no browser tool is available, or the tool's UI can't be driven, fall back to steps 1 to 3 of How to use and keep going with the other screens meanwhile.
3. Put the export in the repo (the project's assets folder), wire it in as step 3 above says, and add the tool, settings and file to the report.
4. A browser pane may not be able to save downloads to disk. After the user's yes, read the exported file inside the page (the export blob) and save it from there instead of waiting for a download, then shrink it (re-encode large images or video) before committing it.
5. In Free mode a code export that adds `ogl` or `three` is allowed; report the package and size.

# SimpleSkat

A browser-based MVP for playing one complete standard game of Skat against two computer opponents.

## Goal
Provide a mobile-friendly web app that can be opened on Android and used to play a full rule-conformant game.

## Current status
- Discovery and requirements are seeded
- Planning direction is identified
- Full playable MVP is implemented
- Browser-tested headless on a mobile viewport
- Dealer rotates left after each game

## Run
Serve the folder with any static web server:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

## What works
- bidding phase
- contract selection
- skat pickup and discard
- trick play with legal-move enforcement
- deterministic computer opponents
- automatic winner determination

# Compatibility fixtures

These tests use the production Auto Trigger code with simulated Foundry documents and dialogs. They do not connect to a live Foundry world.

The integration fixtures were developed in the Aetherblade workspace. Running them requires these sibling directories beside `auto-trigger-mod`:

- `stamina-martial-arts`: `src/stamina.js`, `src/hooks.js`, and its browser test suite/dependencies.
- `dnd5e-release-5.2.5`: `module/documents/activity/mixin.mjs` for the native consumption fixture.
- `tidy5e-sheet`: installed Tidy5e 12.5.4 source map used by the browser suite.

With Node.js 24 and the browser suite's existing `playwright-core` dependency installed, run from the parent workspace in PowerShell:

```powershell
node --check auto-trigger-mod/main.js
node auto-trigger-mod/tests/compat.test.mjs
$env:SMA_CHROME = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
node stamina-martial-arts/tests/tidy.browser.mjs
```

On 2026-10-05, all 18 logic checks and 45 browser checks passed. The browser suite covers both Auto Trigger and Stamina/Tidy integration; `dialog.fixture.mjs` renders the production checkbox content and invokes its production save/trigger callbacks.

The module runs without these test/reference directories. Test files are excluded from the release ZIP. Verify persistence, full Foundry sheet rendering, Midi-QOL, and multiplayer reactions in the actual world after upgrading.

# Foundry VTT Auto-Trigger Mod

A streamlined D&D 5e v3.x/v4.x combat automation module for Foundry VTT (v12/v13+).

This module injects an elegant **"Link Settings"** button directly to your items, allowing GMs and players to select specific weapon or spell attacks to seamlessly trigger another Activity bound to the same item when they score a hit!

## Features

- **Extremely Lightweight:** Features zero third-party assets, CSS injections, or heavy logic to ensure absolute compatibility with legacy UI and Third-Party Sheets (e.g. Tidy 5e).
- **Intelligent Trigger Selectors:** Bind item Activities to trigger universally on all attacks, or restrict them solely to:
    - Melee Weapon Attacks
    - Ranged Weapon Attacks
    - Melee Spell Attacks
    - Ranged Spell Attacks
- **Midi-QOL True Hit Recognition:** When `Midi-QOL` is installed and active, this mod intercepts the `midi-qol.AttackRollComplete` workflow and verifies if the attack *actually* struck the target before initiating the linked execution prompt.
- **Vanilla Fallback Capabilities:** If playing on vanilla Foundry without advanced combat engines, the mod executes out-of-the-box upon `dnd5e.postRollAttack`.

## Installation

1. Open your Foundry Setup -> Add-on Modules -> Install Module.
2. Paste the `module.json` manifest link from the repository releases.
   *Or clone this repo directly into your `/Data/modules/auto-trigger-mod` directory.*

## Environment Compatibility
- **Foundryvtt**: v12+ (v13 Verified)
- **DnD5e**: v3.2.0+ (v4.1.2 Verified)

*Developed for players seeking simplified and targeted trigger resolutions on V2 D&D5E character architectures.*

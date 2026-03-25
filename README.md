# Auto Trigger Mod for Foundry VTT (D&D 5e)

A streamlined D&D 5e v3.x/v4.x combat automation module for Foundry VTT (v12/v13+).

This module empowers players to seamlessly bind secondary activities to specific attack conditions, fully automating the prompt to use an activity the moment an attack scores a hit!

## Features & Usage

- **Where to Find the Control:** 
  Once installed, you can configure your triggers on any item that has an Action/Activity. 
  Simply locate the item in your character's inventory sheet, **Right-Click the item** to open the context menu, and click the **"Link Settings" (with a ⚡ lightning bolt icon)** option! You can also find this lightning bolt button directly mapped into the header/title bar when you open the Item configuration window.

- **The Configuration Window:** 
  Clicking the control pops up a clean window where you can bind the rules. It contains two selectors:
  1. **Trigger Condition:** You can restrict the trigger to fire only upon specific attacks. Select between `Any Weapon/Spell Attack`, `Melee Weapon Attack Only`, `Ranged Weapon Attack Only`, `Melee Spell Attack Only`, or `Ranged Spell Attack Only`.
  2. **Linked Action:** Select the actual Activity component attached to this item that you wish to prompt when the hit is resolved.

- **Automated Execution:** 
  - **With Midi-QOL:** Intercepts the `midi-qol.AttackRollComplete` workflow to verify if the attack *actually* struck a target before initiating the linked execution prompt.
  - **Vanilla Foundry:** Smoothly acts out-of-the-box upon `dnd5e.postRollAttack`, prompting the user directly after the attack roll resolves.

- **Extremely Lightweight:** 
  Designed with absolute compatibility in mind. Uses native Foundry V12+ `ApplicationV2` architecture and features zero third-party CSS or image injections. Fully compatible with vanilla UI, Tidy 5e Sheets, and older interface layouts.

## Installation

1. Open your Foundry Setup -> Add-on Modules -> Install Module.
2. Paste the `module.json` manifest link from the repository releases.
   *Or extract the files directly into your `Data/modules/auto-trigger-mod` directory.*

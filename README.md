# Auto Trigger Mod (v1.5.2)

Version 1.5.2 lets each item link **multiple Activities** using checkboxes. They share the item's existing attack type, hit/miss and natural-roll conditions. When the trigger matches, each linked Activity appears separately in the consolidated checklist; only the selected entries execute. Existing single-Activity flags are read automatically, without a migration or reset.

This release also includes the 1.5.1 fix that adds **Trigger Settings** to both item and activity context menus, including feature activities and custom Martial Art items. It uses the owning Actor, edit permission and activities model to determine eligibility. Empty drafts expose the entry and explain that an Activity must be configured before linking. Existing trigger flags and the activity execution flow are preserved.

See the [changelog](CHANGELOG.md), [v1.5.2 release](https://github.com/mercerliu20-crypto/auto-trigger-mod/releases/tag/v1.5.2), and [Chinese compatibility and verification notes](README-武技兼容.md).

An automation utility for **Foundry VTT** and the **D&D 5e** system. The manifest retains Foundry minimum 12 / verified 13 and dnd5e minimum 3.2.0 / verified 5.0.0. Automated compatibility fixtures use dnd5e 5.2.5 and Tidy5e 12.5.4; these checks do not certify a live Foundry world or every supported version.

This module allows players to bind secondary activities (like all kinds of smite, or custom maneuvers) to specific attack triggers. When an attack meets your custom criteria, the mod prompts you with a clean, consolidated checklist to execute your follow-up actions instantly.

---

## 🚀 Key Features

### ⚡ Consolidated Trigger List
If an attack triggers multiple items, they are combined into a single, elegant checklist. You can selectively trigger only the actions you want for that specific moment, keeping the combat flow smooth and avoiding pop-up fatigue.

### 🧠 Advanced Logic Filtering
Fine-tune exactly when your items should trigger:
- **Attack Type**: Filter by Melee/Ranged, Weapon/Spell.
- **Hit Result**: Trigger only on **Hits**, only on **Misses**, or Always.
- **Natural Roll Range**: Trigger based on the raw d20 roll (e.g., set `19-20` for critical-only effects, or `2-6` for fumble-recovery maneuvers).

### 🎨 Seamless UI Integration
The mod blends perfectly with modern Foundry UI:
- **Header Buttons**: A lightning bolt icon ⚡ appears in the header of Item Sheets.
- **Context Menu**: Right-click an editable Actor item or its activity to access "Trigger Settings".
- **Visual Feedback**: The trigger list displays the attack outcome (Hit/Miss) and the natural roll result for immediate clarity.

---

## 🛠 Usage & Requirements

### Installation
1. Install using this [manifest](https://raw.githubusercontent.com/mercerliu20-crypto/auto-trigger-mod/main/module.json), or download [auto-trigger-mod.zip](https://github.com/mercerliu20-crypto/auto-trigger-mod/releases/download/v1.5.2/auto-trigger-mod.zip) and extract its contents to `Data/modules/auto-trigger-mod`.
2. **Requirement**: This release version is optimized for **Midi-QOL**. Midi-QOL is required to handle automated hit detection and roll extraction.

### How to use
1. **Configure**: Right-click an item or activity on the Actor sheet and select **Trigger Settings** (⚡).
2. **Setup**: Choose the attack type, hit condition, and roll range. Then check one or more **Activities**. Clear all Activity checkboxes and save to disable this item's trigger.
3. **Trigger**: Perform an attack. If the criteria are met, the **Auto-Trigger List** will appear. Review your choices and click **Trigger**.

### Updating from 1.5.0 / 1.5.1

Update through Foundry's module manager, then reload the world and every connected client. Existing single-Activity bindings continue to work. Each selected Activity executes through its native `activity.use()` flow and retains its own resource costs. If using the custom Stamina & Martial Arts Tidy tab, update that module to at least 1.0.13 for its native right-click menu integration.

### Verification

Release checks on 2026-10-05: 18 logic checks and 45 browser fixture checks passed; JavaScript syntax checked successfully. The fixtures simulate Foundry documents, persistence, DialogV2, and Midi-QOL workflows. Live server persistence, full sheet rendering, and multiplayer reactions still require in-world verification. See [test setup](tests/README.md).


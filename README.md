# Auto Trigger Mod (v1.5.0)

A high-performance automation utility for **Foundry VTT (v12/v13+)** and **D&D 5e (v3.2 - v4.x)**. 

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
- **Context Menu**: Right-click any item in your inventory to access "Link Settings".
- **Visual Feedback**: The trigger list displays the attack outcome (Hit/Miss) and the natural roll result for immediate clarity.

---

## 🛠 Usage & Requirements

### Installation
1. Install via manifest or extract to `Data/modules/auto-trigger-mod`.
2. **Requirement**: This release version is optimized for **Midi-QOL**. Midi-QOL is required to handle automated hit detection and roll extraction.

### How to use
1. **Configure**: Right-click an item in your inventory and select **Link Settings** (⚡).
2. **Setup**: Choose the attack type, hit condition, and roll range. Then select which **Activity** should be triggered.
3. **Trigger**: Perform an attack. If the criteria are met, the **Auto-Trigger List** will appear. Review your choices and click **Trigger Selected**.


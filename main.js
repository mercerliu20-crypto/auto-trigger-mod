const MODULE_ID = "auto-trigger-mod";

async function promptTriggerConfig(item) {
    if (!item.system || !item.system.activities) return;

    const activities = item.system.activities.contents;
    if (!activities || activities.length === 0) {
        ui.notifications.warn(`${item.name} has no Activity set up. Cannot bind trigger.`);
        return;
    }

    const activeActivityId = item.getFlag(MODULE_ID, "triggerActivityId");
    const activeAttackType = item.getFlag(MODULE_ID, "triggerAttackType") || "any";

    const attackTypes = [
        { value: "any", label: "Any Weapon/Spell Attack" },
        { value: "mwak", label: "Melee Weapon Attack Only" },
        { value: "rwak", label: "Ranged Weapon Attack Only" },
        { value: "msak", label: "Melee Spell Attack Only" },
        { value: "rsak", label: "Ranged Spell Attack Only" }
    ];
    let typeOptionsHtml = "";
    attackTypes.forEach(t => {
        const isSelected = t.value === activeAttackType ? "selected" : "";
        typeOptionsHtml += `<option value="${t.value}" ${isSelected}>${t.label}</option>`;
    });

    let optionsHtml = `<option value="">(Disable Trigger)</option>`;
    activities.forEach(act => {
        const isSelected = act.id === activeActivityId ? "selected" : "";
        optionsHtml += `<option value="${act.id}" ${isSelected}>${act.name || "Default Action"}</option>`;
    });

    const result = await foundry.applications.api.DialogV2.prompt({
        window: { title: `${item.name} - Auto Trigger Settings` },
        content: `
            <form>
                <div class="form-group">
                    <label>Trigger Condition: Which attack type triggers this?</label>
                    <div class="form-fields">
                        <select name="attackType">${typeOptionsHtml}</select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Linked Action: What activity to trigger on hit?</label>
                    <div class="form-fields">
                        <select name="activityId">${optionsHtml}</select>
                    </div>
                </div>
            </form>
        `,
        ok: {
            label: "Save Settings",
            callback: (event, button, dialog) => {
                return {
                    activityId: button.form.elements.activityId.value,
                    attackType: button.form.elements.attackType.value
                };
            }
        }
    });

    if (result !== undefined) {
        if (result.activityId === "") {
            await item.setFlag(MODULE_ID, "triggerActivityId", "");
            await item.setFlag(MODULE_ID, "triggerAttackType", "any");
            ui.notifications.info(`Auto-trigger for ${item.name} has been disabled.`);
        } else {
            await item.setFlag(MODULE_ID, "triggerActivityId", result.activityId);
            await item.setFlag(MODULE_ID, "triggerAttackType", result.attackType);
            const actName = item.system.activities.get(result.activityId)?.name || "Default Action";
            const typeLabel = attackTypes.find(t => t.value === result.attackType)?.label || "Any Attack";
            ui.notifications.info(`${item.name} will automatically prompt to use [${actName}] after a valid ${typeLabel} hit!`);
        }
    }
}

Hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
    const item = app.document || app.object || app.item;
    if (!item || item.documentName !== "Item") return;
    if (!item.system || !item.system.activities) return;
    
    if (controls.some(c => c.action === "auto-trigger-config" || (c.label && c.label.includes("Trigger")))) return;

    const activeActivityId = item.getFlag(MODULE_ID, "triggerActivityId");
    controls.unshift({
        action: "auto-trigger-config",
        label: activeActivityId ? "Linked Trigger" : "Link Settings",
        icon: "fas fa-bolt",
        onClick: () => promptTriggerConfig(item)
    });
});

Hooks.on("getApplicationHeaderButtons", (app, buttons) => {
    const item = app.document || app.object || app.item;
    if (!item || item.documentName !== "Item") return;
    if (!item.system || !item.system.activities) return;

    if (buttons.some(b => b.label === "Link Settings" || b.label === "Linked Trigger")) return;

    const activeActivityId = item.getFlag(MODULE_ID, "triggerActivityId");
    buttons.unshift({
        label: activeActivityId ? "Linked Trigger" : "Link Settings",
        class: activeActivityId ? "trigger-btn-active" : "trigger-btn-inactive",
        icon: "fas fa-bolt",
        onclick: () => promptTriggerConfig(item)
    });
});

Hooks.on("dnd5e.getItemContextOptions", (item, options) => {
    if (item.isOwned && item.system?.activities?.size > 0) {
        const activeActivityId = item.getFlag(MODULE_ID, "triggerActivityId");
        options.push({
            name: activeActivityId ? "Trigger (Active)" : "Trigger Settings",
            icon: '<i class="fas fa-bolt"></i>',
            callback: () => promptTriggerConfig(item)
        });
    }
});

async function checkAndTriggerItems(actor, sourceItem, actionType, isMidi = false) {
    if (!actor) return;
    
    const validAttacks = ["mwak", "rwak", "msak", "rsak"];
    if (!validAttacks.includes(actionType)) return;

    const triggeredItems = actor.items.filter(i => {
        const flagId = i.getFlag(MODULE_ID, "triggerActivityId");
        return flagId && i.system.activities?.has(flagId);
    });

    if (triggeredItems.length === 0) return;

    for (const tItem of triggeredItems) {
        const requiredType = tItem.getFlag(MODULE_ID, "triggerAttackType") || "any";
        if (requiredType !== "any" && requiredType !== actionType) continue;

        const targetActivityId = tItem.getFlag(MODULE_ID, "triggerActivityId");
        const targetActivity = tItem.system.activities.get(targetActivityId);

        const hitText = isMidi ? "successfully HIT" : "made an ATTACK";
        const actName = targetActivity?.name || "Default Action";

        const confirm = await foundry.applications.api.DialogV2.confirm({
            window: { title: "Auto-Trigger Prompt" },
            content: `
                <div style="text-align: center; margin-bottom: 10px;">
                    <img src="${tItem.img}" width="50" height="50" style="border: none;" />
                    <p>Your Weapon/Spell attack <b>${hitText}</b>!</p>
                    <p>Would you like to trigger <b>${tItem.name}</b>'s <b>[${actName}]</b> immediately?</p>
                </div>
            `,
            rejectClose: false,
            modal: false
        });

        if (confirm && targetActivity) {
            console.log(`[${MODULE_ID}] Automatically executing: ${tItem.name} -> ${actName}`);
            await targetActivity.use();
        }
    }
}

Hooks.on("midi-qol.AttackRollComplete", async (workflow) => {
    if (!workflow.hitTargets || workflow.hitTargets.size === 0) return;
    const actionType = workflow.activity?.actionType || workflow.item?.system?.actionType;
    await checkAndTriggerItems(workflow.actor, workflow.item, actionType, true);
});

Hooks.once("ready", () => {
    if (!game.modules.get("midi-qol")?.active) {
        Hooks.on("dnd5e.postRollAttack", async (activity, roll) => {
            const actionType = activity.actionType || activity.item?.system?.actionType;
            await checkAndTriggerItems(activity.actor, activity.item, actionType, false);
        });
    }
});

const MODULE_ID = "auto-trigger-mod";

// Document type names are extensible (including custom martial arts). The
// parent Actor and activities model define eligibility, not a legacy isOwned
// flag or the number of activities already authored on a new draft.
function canConfigureTrigger(item) {
    const actor = item?.actor ?? (item?.parent?.documentName === "Actor" ? item.parent : null);
    return !!actor && item.isOwner === true && item.system?.activities != null;
}

// Read old single-activity flags without migrating or writing world data.
function linkedActivityIds(config) {
    const ids = Array.isArray(config?.triggerActivityIds)
        ? config.triggerActivityIds : [config?.triggerActivityId];
    return [...new Set(ids.filter(id => typeof id === "string" && id.length > 0))];
}

const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g,
    char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

Hooks.once("init", () => {
    const style = document.createElement("style");
    style.innerHTML = `
        .at-list { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
        .at-row { 
            display: flex; align-items: center; gap: 12px; padding: 10px; 
            background: rgba(0, 0, 0, 0.05); border: 1px solid rgba(0,0,0,0.1); 
            border-radius: 8px; transition: all 0.2s; cursor: pointer;
            user-select: none;
        }
        .at-row:hover { background: rgba(0, 0, 0, 0.08); border-color: rgba(0,0,0,0.2); transform: translateY(-1px); }
        .at-row img { border: 1px solid #7a7971; flex-shrink: 0; }
        .at-info { flex: 1; min-width: 0; }
        .at-item-name { font-weight: bold; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--dnd5e-font-roboto); }
        .at-activity-name { font-size: 0.9em; opacity: 0.8; display: block; }
        .at-checkbox { width: 18px; height: 18px; cursor: pointer; margin: 0; flex-shrink: 0; }
    `;
    document.head.appendChild(style);
});

async function promptTriggerConfig(item) {
    if (!canConfigureTrigger(item)) return;
    const activities = item.system.activities.contents;
    if (!activities?.length) return ui.notifications.warn(`${item.name} has no Activity set up.`);

    const f = item.flags?.[MODULE_ID]?.all || {};
    const actTypes = [
        { v: "any", l: "Any Attack" },
        { v: "mwak", l: "Melee Weapon" },
        { v: "rwak", l: "Ranged Weapon" },
        { v: "msak", l: "Melee Spell" },
        { v: "rsak", l: "Ranged Spell" }
    ];
    const resTypes = [
        { v: "any", l: "Always" },
        { v: "hit", l: "On Hit" },
        { v: "miss", l: "On Miss" }
    ];

    const typeOpts = actTypes.map(t => `<option value="${t.v}" ${t.v === (f.triggerAttackType || "any") ? "selected" : ""}>${t.l}</option>`).join("");
    const resOpts = resTypes.map(r => `<option value="${r.v}" ${r.v === (f.triggerResult || "any") ? "selected" : ""}>${r.l}</option>`).join("");
    const linkedIds = new Set(linkedActivityIds(f));
    const activityOpts = activities.map(a => `
        <label class="at-row">
            <input type="checkbox" class="at-checkbox" data-at-linked-activity value="${escapeHTML(a.id)}" ${linkedIds.has(a.id) ? "checked" : ""} />
            <span class="at-info"><span class="at-activity-name">${escapeHTML(a.name || "Default Action")}</span></span>
        </label>`).join("");

    const result = await foundry.applications.api.DialogV2.prompt({
        window: { title: `${item.name} Configuration` },
        content: `
            <form>
                <div class="form-group"><label>Attack Type</label><div class="form-fields"><select name="attackType">${typeOpts}</select></div></div>
                <div class="form-group"><label>Result Filter</label><div class="form-fields"><select name="triggerResult">${resOpts}</select></div></div>
                <div class="form-group"><label>Roll Range (1-20)</label><div class="form-fields">
                    <input type="number" name="minRoll" value="${f.triggerMinRoll ?? 1}" min="1" max="20" style="text-align:center;" /> ~ 
                    <input type="number" name="maxRoll" value="${f.triggerMaxRoll ?? 20}" min="1" max="20" style="text-align:center;" />
                </div></div>
                <hr/><fieldset><legend>Linked Activities</legend>
                    <p>Select one or more activities. Clear all selections to disable this trigger.</p>
                    <div class="at-list">${activityOpts}</div>
                </fieldset>
            </form>
        `,
        ok: { label: "Save", callback: (e, b) => ({
            ...new FormDataExtended(b.form).object,
            activityIds: Array.from(b.form.querySelectorAll('input[data-at-linked-activity]:checked'), input => input.value)
        }) }
    });

    if (result) {
        const ids = linkedActivityIds({ triggerActivityIds: result.activityIds, triggerActivityId: result.activityId })
            .filter(id => item.system.activities.get(id));
        if (!ids.length) await item.unsetFlag(MODULE_ID, "all");
        else await item.setFlag(MODULE_ID, "all", {
            // Retain the first ID for existing macros that read the old field.
            triggerActivityId: ids[0],
            triggerActivityIds: ids,
            triggerAttackType: result.attackType,
            triggerResult: result.triggerResult,
            triggerMinRoll: parseInt(result.minRoll) || 1,
            triggerMaxRoll: parseInt(result.maxRoll) || 20
        });
        ui.notifications.info(`${item.name} updated.`);
    }
}

const _getRoll = roll => roll?.dice?.find(d => d.faces === 20)?.total ?? null;

async function checkAndTrigger(actor, item, type, midi = false, context = {}) {
    if (!actor || !["mwak","rwak","msak","rsak"].includes(type)) return;
    const { hit = "any", roll = null } = context;
    const candidates = [];

    for (const i of actor.items) {
        const f = i.getFlag(MODULE_ID, "all");
        const ids = linkedActivityIds(f);
        if (!ids.length) continue;
        if (f.triggerAttackType && f.triggerAttackType !== "any" && f.triggerAttackType !== type) continue;
        if (f.triggerResult && f.triggerResult !== "any" && midi && f.triggerResult !== hit) continue;
        if (roll !== null && (roll < (f.triggerMinRoll ?? 1) || roll > (f.triggerMaxRoll ?? 20))) continue;
        for (const id of ids) {
            const a = i.system.activities?.get(id);
            if (a) candidates.push({ item: i, activity: a });
        }
    }

    if (!candidates.length) return;

    const hitMsg = midi ? (hit === "hit" ? "successfully HIT" : "MISSED") : "made an ATTACK";
    const selected = await foundry.applications.api.DialogV2.prompt({
        window: { title: "Auto-Trigger List" },
        content: `
            <div style="text-align: left;"><p>Attack <b>${hitMsg}</b>${roll ? ` (Natural ${roll})` : ""}! Trigger:</p>
                <div class="at-list">${candidates.map((c, i) => `
                    <label class="at-row">
                        <input type="checkbox" class="at-checkbox" id="at-cb-${i}" />
                        <img src="${c.item.img}" width="36" height="36" />
                        <div class="at-info"><span class="at-item-name">${c.item.name}</span><span class="at-activity-name">⚡ ${c.activity.name || "Action"}</span></div>
                    </label>`).join("")}
                </div>
            </div>
        `,
        ok: {
            label: "Trigger",
            callback: (e, b, d) => candidates.map((_, i) => d.element.querySelector(`#at-cb-${i}`).checked ? i : null).filter(i => i !== null)
        },
        rejectClose: false
    });

    if (selected?.length) {
        for (const idx of selected) {
            try { await candidates[idx].activity.use(); } catch (e) { console.error(e); }
        }
    }
}

const _onRender = (item, btns) => {
    if (!canConfigureTrigger(item)) return;
    btns.unshift({
        label: "Link Trigger",
        class: "auto-trigger",
        icon: "fas fa-bolt",
        onclick: () => promptTriggerConfig(item)
    });
};

Hooks.on("getHeaderControlsApplicationV2", (a, c) => { if(a.document?.documentName === "Item") _onRender(a.document, c); });
Hooks.on("getApplicationHeaderButtons", (a, b) => { if (a.document?.documentName === "Item") _onRender(a.document, b); });
function addTriggerContextOption(item, options) {
    if (canConfigureTrigger(item) && !options.some(option => option.autoTriggerMod === MODULE_ID)) {
        options.push({
            name: "Trigger Settings",
            icon: '<i class="fas fa-bolt"></i>',
            autoTriggerMod: MODULE_ID,
            condition: () => canConfigureTrigger(item),
            callback: () => promptTriggerConfig(item)
        });
    }
}

Hooks.on("dnd5e.getItemContextOptions", addTriggerContextOption);
// Features and inline activities use a separate native/Tidy context hook.
// The trigger is still configured on its owning Item, with the same flags.
Hooks.on("dnd5e.getItemActivityContext", (activity, target, options) => {
    addTriggerContextOption(activity?.item, options);
});

Hooks.on("midi-qol.AttackRollComplete", async (workflow) => {
    const type = workflow.activity?.actionType || workflow.item?.system?.actionType;
    await checkAndTrigger(workflow.actor, workflow.item, type, true, {
        hit: workflow.hitTargets.size > 0 ? "hit" : "miss",
        roll: _getRoll(workflow.attackRoll)
    });
});

Hooks.once("ready", () => {
    if (!game.modules.get("midi-qol")?.active) {
        Hooks.on("dnd5e.postRollAttack", async (activity, roll) => {
            const type = activity.actionType || activity.item?.system?.actionType;
            await checkAndTrigger(activity.actor, activity.item, type, false, { roll: _getRoll(roll) });
        });
    }
});

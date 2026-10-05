import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';

const hooks = new Map();
globalThis.Hooks = {
  on(name, fn) {const list = hooks.get(name) ?? []; list.push(fn); hooks.set(name, list);},
  once(name, fn) {this.on(name, fn);},
  call(name, ...args) {for (const fn of hooks.get(name) ?? []) if (fn(...args) === false) return false; return true;},
  callAll(name, ...args) {for (const fn of hooks.get(name) ?? []) fn(...args);},
  async emit(name, ...args) {for (const fn of hooks.get(name) ?? []) await fn(...args);}
};
const getProperty = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
const setProperty = (object, path, value) => {
  const keys = path.split('.');
  for (const key of keys.slice(0, -1)) object = object[key] ??= {};
  object[keys.at(-1)] = value;
};
Number.isNumeric = value => value != null && value !== '' && Number.isFinite(Number(value));
let dialogs = [], responses = [], warnings = [];
globalThis.foundry = {utils: {getProperty, setProperty, isEmpty: object => !Object.keys(object).length}, applications: {api: {DialogV2: {
  prompt: async config => {dialogs.push(config); return responses.shift();}
}}}};
globalThis.game = {modules: new Map(), settings: {get: (_id,key) => key === 'tierCosts' ? '1,3,6,10,15,20,30,45,65,90' : undefined},
  i18n: {localize: key => key}};
globalThis.ui = {notifications: {warn: message => warnings.push(message), info() {}}};
await import('../main.js');
const stamina = await import('../../stamina-martial-arts/src/stamina.js');
const {consumeWithStaminaLock} = await import('../../stamina-martial-arts/src/hooks.js');
Hooks.on('dnd5e.activityConsumption', stamina.addStaminaConsumption);
const nativeSource = fs.readFileSync(new URL('../../dnd5e-release-5.2.5/module/documents/activity/mixin.mjs', import.meta.url), 'utf8');
const start = nativeSource.indexOf('    async consume(usageConfig, messageConfig) {');
const end = nativeSource.indexOf('    /* -------------------------------------------- */', start);
const nativeConsume = new Function(`return ({${nativeSource.slice(start, end).replaceAll('this.#applyUsageUpdates', 'this._applyUsageUpdates')}}).consume;`)();

function item(type='stamina-martial-arts.martialArt', count=1) {
  const actor = {documentName:'Actor', type:'character', uuid:'Actor.test', isOwner:true, items:[],
    flags:{'stamina-martial-arts':{stamina:{value:10},overrides:{maxStamina:100}}},
    async update(data) {
      const apply = (data,prefix='') => {for(const [key,value] of Object.entries(data)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if(value && typeof value === 'object') apply(value,path); else setProperty(this,path,value);
      }};
      apply(data); this.updates++;
    }, updates:0};
  const result = {id:'item', name:'Test', actor, isOwner:true, type, img:'icons/svg/sword.svg',
    flags:{unrelated:{keep:true}},
    system:{school:'apx',ability:'str',tier:1,staminaCost:{enabled:true}},
    getFlag(scope,key) {return this.flags[scope]?.[key];},
    async setFlag(scope,key,value) {this.flags[scope] ??= {}; this.flags[scope][key] = value;},
    async unsetFlag(scope,key) {delete this.flags[scope]?.[key];}
  };
  const activities = new Map();
  for (let i=0;i<count;i++) {
    const activity = {id:'activity'+i, name:'Action '+i, item:result, actor,
      _prepareUsageUpdates: async () => ({actor:{},item:[],create:[],delete:[]}),
      _applyUsageUpdates: async updates => {await actor.update(updates.actor); return {};},
      async use() {this.uses = (this.uses ?? 0)+1; return consumeWithStaminaLock.call(this,nativeConsume.bind(this),{},{});}
    };
    activities.set(activity.id,activity);
  }
  activities.contents = [...activities.values()]; result.system.activities = activities;
  actor.items.push(result); return result;
}
function menu(item, activity=false, options=[]) {
  if (activity) Hooks.callAll('dnd5e.getItemActivityContext',item.system.activities.contents[0],{},options);
  else Hooks.call('dnd5e.getItemContextOptions',item,options);
  return options;
}
function resetDialogs() {dialogs=[]; responses=[]; warnings=[];}

for (const type of ['feat','spell','weapon','stamina-martial-arts.martialArt']) {
  await test(`${type}: item and activity menus share one trigger entry and save on the owning item`, async () => {
    resetDialogs(); const document = item(type);
    const options = menu(document); menu(document,true,options); menu(document,false,options);
    assert.equal(options.length,1); assert.equal(options[0].name,'Trigger Settings');
    responses.push({activityId:'activity0',attackType:'mwak',triggerResult:'hit',minRoll:'19',maxRoll:'20'});
    await options[0].callback();
    assert.deepEqual(document.flags['auto-trigger-mod'].all, {triggerActivityId:'activity0',triggerActivityIds:['activity0'],triggerAttackType:'mwak',triggerResult:'hit',triggerMinRoll:19,triggerMaxRoll:20});
    assert.deepEqual(document.flags.unrelated,{keep:true});
    assert.equal(document.actor.updates,0);
  });
}
await test('empty drafts expose the entry, then explain that an Activity must be configured', async () => {
  resetDialogs(); const document=item(undefined,0); const options=menu(document);
  assert.equal(options.length,1); await options[0].callback();
  assert.equal(dialogs.length,0); assert.match(warnings[0],/no Activity/);
});
await test('unowned/world/compendium documents and non-activity items cannot configure triggers', () => {
  const document=item(); document.isOwner=false; assert.equal(menu(document).length,0);
  document.isOwner=true; document.actor=null; assert.equal(menu(document).length,0);
  document.parent={documentName:'Compendium'}; assert.equal(menu(document).length,0);
  document.parent={documentName:'Actor'}; assert.equal(menu(document).length,1);
  delete document.system.activities; assert.equal(menu(document).length,0);
});
await test('a stale menu callback rechecks ownership before opening or writing', async () => {
  resetDialogs(); const document=item(); const entry=menu(document)[0]; document.isOwner=false;
  assert.equal(entry.condition(),false); await entry.callback(); assert.equal(dialogs.length,0);
});
await test('cancel preserves trigger flags; selecting Disabled removes only this configuration', async () => {
  resetDialogs(); const document=item(); await document.setFlag('auto-trigger-mod','all',{triggerActivityId:'activity0'});
  const entry=menu(document)[0]; responses.push(undefined); await entry.callback();
  assert.equal(document.getFlag('auto-trigger-mod','all').triggerActivityId,'activity0');
  responses.push({activityId:''}); await entry.callback();
  assert.equal(document.getFlag('auto-trigger-mod','all'),undefined); assert.deepEqual(document.flags.unrelated,{keep:true});
});
await test('both item sheet header hooks retain the configuration entry and owner checks', () => {
  const document=item();
  for(const hook of ['getHeaderControlsApplicationV2','getApplicationHeaderButtons']) {
    const controls=[]; Hooks.callAll(hook,{document:{...document,documentName:'Item'}},controls);
    assert.equal(controls.length,1); assert.equal(controls[0].class,'auto-trigger');
    const readonly=[]; Hooks.callAll(hook,{document:{...document,documentName:'Item',isOwner:false}},readonly);
    assert.equal(readonly.length,0);
  }
});
await test('Auto Trigger selected martial activity uses native consumption once; cancelled/insufficient/invalid uses do not debit', async () => {
  resetDialogs(); const document=item(); const activity=document.system.activities.get('activity0');
  await document.setFlag('auto-trigger-mod','all',{triggerActivityId:activity.id,triggerAttackType:'mwak',triggerResult:'hit'});
  const workflow={actor:document.actor, activity:{actionType:'mwak'}, hitTargets:new Set([{}]), attackRoll:{dice:[{faces:20,total:20}]}};
  responses.push([0]); await Hooks.emit('midi-qol.AttackRollComplete',workflow);
  assert.equal(activity.uses,1); assert.equal(stamina.getStamina(document.actor).value,7); assert.equal(document.actor.updates,1);
  responses.push(undefined); await Hooks.emit('midi-qol.AttackRollComplete',workflow);
  assert.equal(activity.uses,1); assert.equal(document.actor.updates,1);
  document.actor.flags['stamina-martial-arts'].stamina.value=2;
  responses.push([0]); await Hooks.emit('midi-qol.AttackRollComplete',workflow);
  assert.equal(stamina.getStamina(document.actor).value,2); assert.equal(document.actor.updates,1);
  document.system.school=''; document.actor.flags['stamina-martial-arts'].stamina.value=10;
  responses.push([0]); await Hooks.emit('midi-qol.AttackRollComplete',workflow);
  assert.equal(stamina.getStamina(document.actor).value,10); assert.equal(document.actor.updates,1);
});

const attack = (document, {type='mwak',hit=true,roll=20}={}) => ({actor:document.actor,
  activity:{actionType:type}, hitTargets:new Set(hit ? [{}] : []),
  attackRoll:roll === null ? undefined : {dice:[{faces:20,total:roll}]}});

await test('multiple activity selections round-trip and reopen with the existing conditions', async () => {
  resetDialogs(); const document=item(undefined,3);
  responses.push({activityIds:['activity0','activity2','activity0','removed'],attackType:'rwak',triggerResult:'miss',minRoll:'2',maxRoll:'6'});
  await menu(document)[0].callback();
  assert.deepEqual(document.getFlag('auto-trigger-mod','all'), {triggerActivityId:'activity0',triggerActivityIds:['activity0','activity2'],triggerAttackType:'rwak',triggerResult:'miss',triggerMinRoll:2,triggerMaxRoll:6});
  responses.push(undefined); await menu(document)[0].callback();
  assert.match(dialogs.at(-1).content,/value="activity0" checked/);
  assert.match(dialogs.at(-1).content,/value="activity2" checked/);
  assert.match(dialogs.at(-1).content,/value="activity1"\s*\/>/);
  assert.match(dialogs.at(-1).content,/value="rwak" selected/);
  assert.match(dialogs.at(-1).content,/value="miss" selected/);
});
await test('old single-activity flags still show as checked and trigger without a migration write', async () => {
  resetDialogs(); const document=item(undefined,2);
  const old={triggerActivityId:'activity1',triggerAttackType:'mwak',triggerResult:'hit',triggerMinRoll:19,triggerMaxRoll:20};
  await document.setFlag('auto-trigger-mod','all',old);
  responses.push(undefined); await menu(document)[0].callback();
  assert.match(dialogs[0].content,/value="activity1" checked/);
  responses.push([0]); await Hooks.emit('midi-qol.AttackRollComplete',attack(document));
  assert.equal(document.system.activities.get('activity1').uses,1);
  assert.equal(document.system.activities.get('activity0').uses,undefined);
  assert.deepEqual(document.getFlag('auto-trigger-mod','all'),old);
});
await test('all linked activities appear separately, and only the selected subset executes', async () => {
  resetDialogs(); const document=item(undefined,3);
  await document.setFlag('auto-trigger-mod','all',{triggerActivityIds:['activity0','activity1','activity2']});
  responses.push([1]); await Hooks.emit('midi-qol.AttackRollComplete',attack(document));
  assert.equal((dialogs[0].content.match(/class="at-row"/g)??[]).length,3);
  assert.equal(document.system.activities.get('activity0').uses,undefined);
  assert.equal(document.system.activities.get('activity1').uses,1);
  assert.equal(document.system.activities.get('activity2').uses,undefined);
  assert.equal(stamina.getStamina(document.actor).value,7);
});
await test('selecting two martial activities executes sequentially and charges each once', async () => {
  resetDialogs(); const document=item(undefined,2);
  await document.setFlag('auto-trigger-mod','all',{triggerActivityIds:['activity0','activity1']});
  responses.push([0,1]); await Hooks.emit('midi-qol.AttackRollComplete',attack(document));
  assert.equal(document.system.activities.get('activity0').uses,1);
  assert.equal(document.system.activities.get('activity1').uses,1);
  assert.equal(stamina.getStamina(document.actor).value,4); assert.equal(document.actor.updates,2);
  document.actor.flags['stamina-martial-arts'].stamina.value=5;
  responses.push([0,1]); await Hooks.emit('midi-qol.AttackRollComplete',attack(document));
  assert.equal(stamina.getStamina(document.actor).value,2); assert.equal(document.actor.updates,3);
});
await test('empty multi-selection disables; old first-ID field cannot reactivate an empty array', async () => {
  resetDialogs(); const document=item();
  await document.setFlag('auto-trigger-mod','all',{triggerActivityId:'activity0',triggerActivityIds:[]});
  await Hooks.emit('midi-qol.AttackRollComplete',attack(document)); assert.equal(dialogs.length,0);
  responses.push({activityIds:[],activityId:'activity0'}); await menu(document)[0].callback();
  assert.equal(document.getFlag('auto-trigger-mod','all'),undefined);
});
await test('deleted and duplicate activity IDs are skipped without losing remaining linked actions', async () => {
  resetDialogs(); const document=item(undefined,2);
  await document.setFlag('auto-trigger-mod','all',{triggerActivityIds:['removed','activity1','activity1']});
  responses.push([0]); await Hooks.emit('midi-qol.AttackRollComplete',attack(document));
  assert.equal((dialogs[0].content.match(/class="at-row"/g)??[]).length,1);
  assert.equal(document.system.activities.get('activity1').uses,1);
});
await test('attack type, hit/miss and natural-roll range keep filtering the whole linked set', async () => {
  const document=item(undefined,2);
  await document.setFlag('auto-trigger-mod','all',{triggerActivityIds:['activity0','activity1'],triggerAttackType:'rwak',triggerResult:'miss',triggerMinRoll:2,triggerMaxRoll:6});
  for(const context of [{type:'mwak',hit:false,roll:4},{type:'rwak',hit:true,roll:4},
    {type:'rwak',hit:false,roll:1},{type:'rwak',hit:false,roll:7}]) {
    resetDialogs(); await Hooks.emit('midi-qol.AttackRollComplete',attack(document,context)); assert.equal(dialogs.length,0);
  }
  for(const roll of [2,6]) {
    resetDialogs(); responses.push([]);
    await Hooks.emit('midi-qol.AttackRollComplete',attack(document,{type:'rwak',hit:false,roll}));
    assert.equal((dialogs[0].content.match(/class="at-row"/g)??[]).length,2);
  }
  assert.equal(document.actor.updates,0);
});
await test('the no-Midi fallback and cross-item consolidated list keep their original behavior', async () => {
  resetDialogs(); const first=item('feat',2); const second=item('spell',1);
  first.actor.items.push(second);
  await first.setFlag('auto-trigger-mod','all',{triggerActivityIds:['activity0','activity1'],triggerResult:'hit'});
  await second.setFlag('auto-trigger-mod','all',{triggerActivityId:'activity0'});
  await Hooks.emit('ready'); responses.push([]);
  await Hooks.emit('dnd5e.postRollAttack',{actor:first.actor,actionType:'mwak'}, {dice:[{faces:20,total:12}]});
  assert.equal(dialogs.length,1); assert.equal((dialogs[0].content.match(/class="at-row"/g)??[]).length,3);
  assert.equal(first.actor.updates,0); assert.equal(second.actor.updates,0);
});

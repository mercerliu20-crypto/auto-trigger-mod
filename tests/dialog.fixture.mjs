// Render production DialogV2 content and execute its Save/Trigger callbacks.
// Foundry's window/form serializer is simulated; this is not a live world.
export function installDialogFixture() {
  const previous = foundry.applications.api.DialogV2.prompt;
  const previousSerializer = window.FormDataExtended;
  const style = document.createElement('style');
  style.textContent = `.at-dialog-fixture {position:fixed;inset:35px auto auto 360px;width:440px;max-height:750px;overflow:auto;z-index:99999;background:#ece7db;color:#332b27;padding:20px;border:2px solid #635443;border-radius:8px}
    .at-dialog-fixture .form-group {display:flex;justify-content:space-between;gap:12px;margin:12px 0}
    .at-dialog-fixture .at-list {display:flex;flex-direction:column;gap:8px;margin:12px 0}
    .at-dialog-fixture .at-row {display:flex;align-items:center;gap:12px;padding:10px;border:1px solid #a29482;border-radius:8px;cursor:pointer}
    .at-dialog-fixture .at-checkbox {width:18px;height:18px;margin:0}
    .at-dialog-fixture button {margin:8px;padding:8px}`;
  document.head.append(style);
  window.FormDataExtended = class {constructor(form) {this.object = Object.fromEntries(new FormData(form));}};
  foundry.applications.api.DialogV2.prompt = options => new Promise(resolve => {
    const host = document.createElement('section'); host.className='at-dialog-fixture';
    const title = document.createElement('h2'); title.textContent=options.window.title; host.append(title);
    const content = document.createElement('div'); content.innerHTML=options.content; host.append(content);
    let form=content.querySelector('form');
    if(!form) {form=document.createElement('form');form.append(...content.childNodes);content.append(form);}
    const save=document.createElement('button'); save.type='button'; save.dataset.dialogSave='';save.textContent=options.ok.label;
    const cancel=document.createElement('button');cancel.type='button';cancel.dataset.dialogCancel='';cancel.textContent='Cancel';
    save.onclick=async event => {const result=await options.ok.callback(event,{form},{element:host});host.remove();resolve(result);};
    cancel.onclick=()=>{host.remove();resolve(undefined);};
    form.append(save,cancel);document.body.append(host);
  });
  return () => {
    document.querySelectorAll('.at-dialog-fixture').forEach(element=>element.remove()); style.remove();
    foundry.applications.api.DialogV2.prompt=previous;
    if(previousSerializer)window.FormDataExtended=previousSerializer;else delete window.FormDataExtended;
  };
}

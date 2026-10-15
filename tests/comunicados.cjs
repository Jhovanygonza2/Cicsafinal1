const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let now = new Date(2026, 9, 7, 23, 59, 59).getTime();
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
function setup(file, initial) {
  let data = JSON.stringify(initial);
  const nodes = new Map(), events = {}, timers = [];
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {value:'',textContent:'',innerHTML:'',handlers:{},addEventListener(k,f){this.handlers[k]=f;},focus(){},showModal(){},close(){},reset(){for(const n of nodes.values()) n.value='';}});
    return nodes.get(id);
  };
  const document = {getElementById:node,querySelectorAll:()=>[],querySelector:()=>null};
  const window = {addEventListener:(k,f)=>events[k]=f};
  vm.runInNewContext(fs.readFileSync(file,'utf8'), {Date:Clock,Intl,document,window,localStorage:{getItem:()=>data,setItem:(k,v)=>data=v},sesion:{activa:()=>true,rol:()=>'trabajador',requerir:()=>true,vigilarInactividad(){},usuario:()=>({nombre:'Test'})},permisos:{etiqueta:()=>''},setInterval:f=>timers.push(f),confirm:()=>true});
  return {node,events,timers,read:()=>JSON.parse(data)};
}
const item = (id, fechaLimite) => ({id,titulo:id,fecha:'2026-10-01',texto:'Aviso',categoria:'Aviso',fechaLimite});
const data = [item('expired','2026-10-06'),item('today','2026-10-07'),item('future','2026-10-08'),item('legacy')];
const worker = setup('js/inicio-comunicados.js',data);
const content = () => worker.node('comunicados-trabajador').innerHTML;
assert.ok(!content().includes('<h2>expired</h2>'));
for(const id of ['today','future','legacy']) assert.ok(content().includes(`<h2>${id}</h2>`));
now = new Date(2026,9,8,0,0,0).getTime();
worker.timers[0]();
assert.ok(!content().includes('<h2>today</h2>'));
assert.ok(content().includes('<h2>legacy</h2>'));
// Use the same harness with an administrative session.
const adminSource = fs.readFileSync('js/admin/comunicados.js','utf8');
function admin(initial) {
  let data=JSON.stringify(initial);
  const nodes=new Map();
  const node=id=>{if(!nodes.has(id)) nodes.set(id,{value:'',handlers:{},addEventListener(k,f){this.handlers[k]=f;},focus(){},showModal(){},close(){},reset(){for(const n of nodes.values())n.value='';}});return nodes.get(id);};
  vm.runInNewContext(adminSource,{Date:Clock,Intl,document:{getElementById:node},window:{addEventListener(){}},localStorage:{getItem:()=>data,setItem:(k,v)=>data=v},sesion:{activa:()=>true,rol:()=>'admin'},setInterval(){},confirm:()=>true});
  function submit(id,limit,fecha='2026-10-01'){
    node('comunicado-id').value=id;
    node('comunicado-titulo').value=id||'new';
    node('comunicado-fecha').value=fecha;
    node('comunicado-fecha-limite').value=limit;
    node('comunicado-texto').value='Text';
    node('form-comunicado').handlers.submit({preventDefault(){}});
  }
  return {node,submit,read:()=>JSON.parse(data)};
}
const a=admin(data);
assert.equal(a.node('comunicados-contador').textContent,'2/3 activos');
assert.ok(a.node('comunicados-admin-lista').innerHTML.includes('Vencido el'));
a.submit('','2026-10-10');
assert.equal(a.read().length,5); // expired records survive publication
assert.equal(a.read()[0].fechaLimite,'2026-10-10');
a.submit('expired','2026-10-10');
assert.equal(a.read().find(c=>c.id==='expired').fechaLimite,'2026-10-06'); // cannot reactivate a fourth notice
const b=admin([]);
b.submit('','2026-09-30');
assert.equal(b.read().length,0); // invalid date range rejected
b.submit('','');
assert.equal(b.read().length,1); // optional deadline
b.node('comunicados-admin-lista').handlers.click({target:{closest:selector=>selector==='[data-editar]'?{dataset:{editar:b.read()[0].id}}:null}});
assert.equal(b.node('comunicado-fecha-limite').value,'');
console.log('Comunicados: expiration, midnight refresh, legacy records, active capacity, retention and validation OK');

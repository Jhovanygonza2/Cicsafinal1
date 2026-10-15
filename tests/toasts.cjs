const fs = require("fs"), vm = require("vm"), assert = require("assert/strict");
class Node {
  constructor(tag) { this.tag=tag; this.children=[]; this.handlers={}; this.attrs={}; }
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
  appendChild(n){this.append(n);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
  get firstElementChild(){return this.children[0];}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){this.handlers[k]=fn;}
  contains(n){return this.children.includes(n);}
}
function ui(storage=new Map()){
 const timers=new Map(),handlers={},form=new Node("form");let timerId=0;
 const document={body:new Node("body"),readyState:"complete",createElement:t=>new Node(t),querySelectorAll:()=>[form],getElementById:()=>form};
 const window={addEventListener:(k,fn)=>handlers[k]=fn};
 vm.runInNewContext(fs.readFileSync("js/toasts.js","utf8"),{window,document,Date,sessionStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)});
 return {api:window.CicsaToast,document,form,handlers,timers,storage};
}
const u=ui();
const notice=u.api.mostrar("<img src=x onerror=alert(1)>","exito");
assert.ok(notice.children[1].textContent.includes("<img"));
assert.equal(notice.attrs.role,"status");
u.api.mostrar("<img src=x onerror=alert(1)>","exito");
assert.equal(u.document.body.children[0].children.length,1);
notice.handlers.mouseenter();assert.equal(u.timers.size,0);
notice.handlers.mouseleave();assert.equal(u.timers.size,1);
notice.children[2].handlers.click();assert.equal(u.document.body.children[0].children.length,0);
const error=u.api.mostrar("Error persistente","error");assert.equal(error.attrs.role,"alert");assert.equal(u.timers.size,1);
const [timeoutId, fade] = [...u.timers.entries()][0];
u.timers.delete(timeoutId); fade();
assert.ok(error.className.includes("cicsa-toast-saliendo"));
assert.ok(u.document.body.children[0].children.includes(error));
const [fadeId, remove] = [...u.timers.entries()][0];
u.timers.delete(fadeId); remove();
assert.ok(!u.document.body.children[0].children.includes(error));
for(let i=0;i<6;i++)u.api.mostrar("Aviso "+i);
assert.equal(u.document.body.children[0].children.length,4);
u.api.alNavegar("Acceso correcto","exito");
const next=ui(u.storage);assert.ok(next.document.body.children[0].children[0].children[1].textContent.includes("Acceso correcto"));assert.equal(u.storage.size,0);
u.form.handlers.input();let blocked=false;u.handlers.beforeunload({preventDefault(){blocked=true;}});assert.ok(blocked);
u.form.handlers.reset();blocked=false;u.handlers.beforeunload({preventDefault(){blocked=true;}});assert.equal(blocked,false);
u.handlers.offline();u.handlers.online();
assert.ok(u.document.body.children[0].children.some(n=>n.children[1].textContent.includes("Conexión recuperada")));
for(const dir of [".","admin","instructor","trabajador"])for(const e of fs.readdirSync(dir,{withFileTypes:true})){
 if(!e.isFile()||!e.name.endsWith(".html"))continue;
 const html=fs.readFileSync(dir+"/"+e.name,"utf8");
 if(!html.includes("js/api.js"))continue;
 assert.ok(html.indexOf("js/toasts.js")<html.indexOf("js/api.js"));
 assert.ok(html.includes("css/toasts.css"));
}
(async()=>{
 const data=new Map(),messages=[];
 const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i],get length(){return data.size}};
 const c=vm.createContext({localStorage,console,URLSearchParams,setTimeout:fn=>{fn();return 0;},window:{location:{pathname:"/index.html",replace(){}},addEventListener(){},CicsaToast:{mostrar:(message,type)=>messages.push({message,type}),alNavegar(){}}}});
 vm.runInContext(fs.readFileSync("js/api.js","utf8")+"\nthis.a={auth,sesion,usuarios,soporte,dbListaPromise};",c);
 const a=c.a;await a.dbListaPromise;const login=await a.auth.login("ana","Admin2026");a.sesion.guardar(login.token,login.usuario);
 await a.auth.olvidePassword("missing@example.test");assert.ok(messages.some(m=>m.type==="exito"));
 messages.length=0;
 await assert.rejects(a.usuarios.crear({nombre:"Mal",rol:"trabajador",correo:"bad@example.test",password:"x",curp:"X"}));
 assert.ok(messages.some(m=>m.type==="error"));assert.ok(!messages.some(m=>m.type==="exito"));
 messages.length=0;
 await a.soporte.crear({tipo:"otro",descripcion:"Prueba de solicitud de soporte"});
 assert.ok(messages.some(m=>m.message==="Solicitud de soporte enviada."&&m.type==="exito"));
 console.log("PASS: seguridad de texto, cierre, deduplicación, duración, navegación, cambios pendientes, conexión, carga en páginas y éxito/error real de API.");
})().catch(e=>{console.error(e);process.exitCode=1;});

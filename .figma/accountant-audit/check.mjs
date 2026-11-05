import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const out=path.dirname(new URL(import.meta.url).pathname);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'alfa-accountant-qa-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'],{stdio:'ignore'});
let ws;
try {
 let port;for(let i=0;i<80;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{await sleep(100);}}
 if(!port)throw Error('Chrome did not start');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let id=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown'||(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error'))errors.push(m);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Runtime.enable');await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.__alfaEntryState={entered:true,role:'accountant'}"});
 await send('Page.navigate',{url:'http://localhost:3001/accountant?skel=off'});
 await sleep(2000);
 await ev(`document.fonts.ready.then(()=>{const s=document.createElement('style');s.textContent='*,*::before,*::after{animation:none!important;transition:none!important}';document.head.appendChild(s);return Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));})`);
 const expected={'.cur-qa':[300,84,1161,48],'.cur-row1':[300,156,1248,384],'.cur-tablo':[300,588,1248,48],'.ac-summary':[300,660,1248,384],'.cur-iw-row:first-child > span:first-child':[964,232,null,20],'.cur-iw-row:first-child .cur-ind':[1182,232,20,20],'.cur-bal-connect':[328,311,556,48],'.cur-bal-accounts':[328,400,556,48],'.chrome-header':[248,0,1352,56]};
 const result=await ev(`(()=>{const sels=${JSON.stringify(Object.keys(expected))};return {url:location.href,geometry:Object.fromEntries(sels.map(s=>{const e=document.querySelector(s);const r=e?.getBoundingClientRect();return[s,r?[r.x,r.y,r.width,r.height]:null]})),images:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),details:[...document.querySelectorAll('.cur-bal-body,.cur-bal-amount,.cur-bal-connect,.cur-bal-accounts,.cur-bal-foot,.cur-iw-head,.cur-iw-row,.cur-ban,.chrome-header,.chrome-person,.chrome-company,.chrome-nav,.ac-widget')].map(e=>{const r=e.getBoundingClientRect();return {class:e.className,rect:[r.x,r.y,r.width,r.height],text:e.textContent.trim().slice(0,80)}})};})()`);
 result.expected=expected;result.errors=errors;result.delta=Object.fromEntries(Object.entries(expected).map(([s,ex])=>[s,result.geometry[s]?.map((v,i)=>ex[i]===null?null:v-ex[i])]));
 fs.writeFileSync(path.join(out,'check.json'),JSON.stringify(result,null,2));
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,'current.png'),Buffer.from(shot.data,'base64'));
 console.log(JSON.stringify({geometry:result.geometry,delta:result.delta,broken:result.images,errors:errors.length},null,2));
}finally {ws?.close();chrome.kill();}

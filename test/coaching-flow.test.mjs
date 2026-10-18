import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('coaching choices prepare editable messages without sending or spending a request',()=>{
 const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('const coachPrompts='),source.indexOf("$('#new-conversation').addEventListener"));
 const buttons=['reply','start','date','practice','shorter','natural','explain'].map(kind=>({dataset:{coach:kind},addEventListener(_,handler){this.click=handler}}));
 const nodes=new Map();const $=s=>{if(!nodes.has(s))nodes.set(s,{focus(){this.focused=true}});return nodes.get(s)};
 let selections=0;
 const context={$,wingmanBusy:false,document:{querySelectorAll:()=>buttons,querySelector:()=>({click(){selections++}})}};
 vm.createContext(context);vm.runInContext(code,context);
 for(const button of buttons){button.click();assert.ok($('#context').value.length>20);assert.equal($('#context').focused,true)}
 assert.equal(selections,7);assert.match($('#coach-help').textContent,/no AI credit/);
 const before=$('#context').value;context.wingmanBusy=true;buttons[0].click();assert.equal($('#context').value,before);assert.equal(selections,7);
 context.wingmanBusy=false;$('#context').disabled=true;buttons[0].click();assert.equal($('#switch-to-ai').focused,true);
});

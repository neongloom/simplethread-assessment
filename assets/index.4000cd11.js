var x=Object.defineProperty,O=Object.defineProperties;var z=Object.getOwnPropertyDescriptors;var N=Object.getOwnPropertySymbols;var k=Object.prototype.hasOwnProperty,B=Object.prototype.propertyIsEnumerable;var M=(n,e,t)=>e in n?x(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t,_=(n,e)=>{for(var t in e||(e={}))k.call(e,t)&&M(n,t,e[t]);if(N)for(var t of N(e))B.call(e,t)&&M(n,t,e[t]);return n},P=(n,e)=>O(n,z(e));const F=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const u of document.querySelectorAll('link[rel="modulepreload"]'))i(u);new MutationObserver(u=>{for(const p of u)if(p.type==="childList")for(const v of p.addedNodes)v.tagName==="LINK"&&v.rel==="modulepreload"&&i(v)}).observe(document,{childList:!0,subtree:!0});function t(u){const p={};return u.integrity&&(p.integrity=u.integrity),u.referrerpolicy&&(p.referrerPolicy=u.referrerpolicy),u.crossorigin==="use-credentials"?p.credentials="include":u.crossorigin==="anonymous"?p.credentials="omit":p.credentials="same-origin",p}function i(u){if(u.ep)return;u.ep=!0;const p=t(u);fetch(u.href,p)}};F();const T=[],E=[];async function b(n){try{const t=await(await fetch(n)).json();return t.forEach(i=>{i.startDate=new Date(i.startDate),i.endDate=new Date(i.endDate)}),t}catch(e){console.log(`error: ${e}`)}}async function G(){T.push(await b("/data/set1.json")),T.push(await b("/data/set2.json")),T.push(await b("/data/set3.json")),T.push(await b("/data/set4.json"))}async function K(){await G();const n=I();T.forEach((e,t)=>{const i=n.mapDays(e);E.push(i),n.generateTable(e),n.visualizeDays(t)}),E.forEach(e=>{let t=n.calculateTotalReimbursement(e);console.log(t)}),console.log(E)}const I=function(){let n=[],e=[];console.log("render data");const t=function(r){if(!r)return;n.push(r);const o=n.length,m=document.querySelector("#main"),f=document.querySelector(".dataset-template"),c=document.querySelector(".datarow-template"),a=f.content.firstElementChild.cloneNode(!0);a.querySelector(".dataset__heading").textContent=`Project set #${o}`,a.setAttribute("data-set",`${o-1}`);const l=a.querySelector("tbody");m.appendChild(a),r.forEach(s=>{const y=c.content.firstElementChild.cloneNode(!0);y.querySelector(".datarow__city").textContent=s.cityCost,y.querySelector(".datarow__startdate").textContent=s.startDate.toLocaleDateString(),y.querySelector(".datarow__enddate").textContent=s.endDate.toLocaleDateString(),l.appendChild(y)})},i=function(r){const o=new Map,m=J(r),f=Q(r);let c=m;do{const a=new Date(c.getTime()+1e3*3600*24),l=new Date(c.getTime()-1e3*3600*24),s=a<=f?a.toLocaleDateString():null,y=c!=m?l.toLocaleDateString():null;o.set(c.toLocaleDateString(),{projects:[],next:s,prev:y}),c=a}while(c<=f);return r.forEach((a,l)=>{u(a,o,l)}),console.log(o),e.push(o),o},u=function({startDate:r,endDate:o,cityCost:m}=project,f,c){let a=r;do{const l=a.toLocaleDateString(),s=f.get(l);s&&f.set(l,P(_({},s),{projects:[...s==null?void 0:s.projects,{cityCost:m,number:c}]})),a=new Date(a.getTime()+1e3*3600*24)}while(a<=o)},p=function(r){const o=e[r],m=n[r],f=document.querySelector(`[data-set="${r}"]`),c=document.createElement("div");c.classList.add("timeline");const l=document.querySelector(".timeline-header-template").content.firstElementChild.cloneNode(!0);let s="<div></div>";o.forEach((D,h,w)=>s+=`<div>${h.replace(/([/][\d]+$)/,"")}</div>`),l.innerHTML=s,c.appendChild(l),m.forEach((D,h)=>{const d=document.querySelector(".timeline-project-template").content.firstElementChild.cloneNode(!0);d.setAttribute("data-cost",D.cityCost);let g=`<div>${h}</div>`;o.forEach((S,q)=>{const H=S.projects.some(R=>h===R.number)?'class="isActive"':"";g=`${g}<div ${H}></div>`}),d.innerHTML=g,c.appendChild(d)});const j=document.querySelector(".timeline-calculation-template").content.firstElementChild.cloneNode(!0);let C=L(o).reduce((D,h)=>{var q;const w=h.isTravelDay,d=h.rate,g=$(w,d);let S=w?"travel":"full";return S=g===0?"free":S,`${D}<div data-status="${S}" data-rate="${(q=d[0])!=null?q:""}" data-cost="${g}"></div>`},'<button onclick="toggleCellDisplay()" type="button">toggle display</button>');j.innerHTML=C,c.appendChild(j),f.appendChild(c)},v=function(r){let o=0,m=L(r);return console.log(m),o=m.reduce((f,c)=>f+$(c.isTravelDay,c.rate),0),o},L=function(r){const o=[];return r.forEach((m,f,c)=>{const a=c.get(m.prev),l=c.get(m.next),s=m.projects,y=s.map(d=>d.number),j=a?a.projects:[],A=l?l.projects:[],C=[...j.map(d=>d.number),...A.map(d=>d.number)],D=s.length?C.some(d=>!y.includes(d)):!1;let h=(!a||!l||!(a==null?void 0:a.projects.length)||!(l==null?void 0:l.projects.length))&&s.length===1&&!D;const w=s.reduce((d,g)=>d==="high"?d:g.cityCost,"");o.push({isTravelDay:h,rate:w})}),o},$=function(r,o){return o?r?o==="low"?45:55:o==="low"?75:85:0};return{generateTable:t,visualizeDays:p,mapDays:i,calculateTotalReimbursement:v}};function J(n){return n.reduce((t,i)=>t<i.startDate?t:i.startDate,new Date)}function Q(n){return n.reduce((t,i)=>t>i.endDate?t:i.endDate,0)}window.toggleCellDisplay=function(){[...event.target.parentNode.querySelectorAll("div")].forEach(t=>{t.classList.toggle("show-cost")})};window.calculateReimbursement=function(){};K();

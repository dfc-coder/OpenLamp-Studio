/* SVG silhouette editor for existing Taller OBJ. Coordinates are radial
 * displacement, never source vertex coordinates; base mounting is immutable.
 */
(()=>{
 'use strict';
 const ns='http://www.w3.org/2000/svg',W=280,H=320,MID=120,FACTOR=1.55;
 const $=id=>document.getElementById(id);
 const S=()=>window.OpenLampShade;
 let envelope=null,active=null,drag=null,history=[],forward=[];
 const svgEl=(tag,attrs={})=>{
   const node=document.createElementNS(ns,tag);
   for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));
   return node;
 };
 function node(tag,css,text=''){
   const x=document.createElement(tag);if(css)x.className=css;x.textContent=text;return x;
 }
 function projectShape(){
   const p=window.OpenLampBridge.getProject().params;
   return S().normalize(p.shadeDesign);
 }
 function copy(shape){return {family:shape.family,offsets:[...shape.offsets]};}
 function commit(shape,record=true){
   if(record){history.push(copy(projectShape()));if(history.length>40)history.shift();forward=[];}
   window.OpenLampBridge.setShadeDesign(shape);
   redraw();
 }
 function restore(){
   if(!history.length)return;
   forward.push(copy(projectShape()));
   window.OpenLampBridge.setShadeDesign(history.pop());redraw();
 }
 function redo(){
   if(!forward.length)return;
   history.push(copy(projectShape()));
   window.OpenLampBridge.setShadeDesign(forward.pop());redraw();
 }
 function plotPath(points){
   return points.map((p,i)=>(i===0?'M':'L')+p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ');
 }
 function draw(){
   const svg=$('ol-profile-svg');if(!svg)return;
   svg.replaceChildren();
   const shape=active||projectShape(),curve=S().makeCurve(shape);
   const e=envelope||Array.from({length:100},(_,i)=>({t:(i+.5)/100,radius:55-9*Math.sin(Math.PI*i/99)}));
   const main=e.map(({t,radius})=>[MID+(radius+curve(t))*FACTOR, H-18-t*(H-36)]);
   const mirror=e.map(({t,radius})=>[MID-(radius+curve(t))*FACTOR,H-18-t*(H-36)]);
   const source=e.map(({t,radius})=>[MID+radius*FACTOR,H-18-t*(H-36)]);
   svg.appendChild(svgEl('line',{x1:MID,y1:8,x2:MID,y2:H-6,stroke:'#d5d5c8','stroke-dasharray':'3 5'}));
   for(const t of [0,.25,.5,.75,1])svg.appendChild(svgEl('line',{x1:16,x2:W-16,y1:H-18-t*(H-36),y2:H-18-t*(H-36),stroke:'#e9e9df'}));
   svg.appendChild(svgEl('path',{d:plotPath(source),fill:'none',stroke:'#b4b3a6','stroke-width':1.2,'stroke-dasharray':'4 4'}));
   svg.appendChild(svgEl('path',{d:plotPath(mirror)+' '+plotPath([...main].reverse()).replace(/^M/,'L')+' Z',fill:'#d9c5a7','fill-opacity':'.4',stroke:'none'}));
   svg.appendChild(svgEl('path',{d:plotPath(main),fill:'none',stroke:'#775e46','stroke-width':2.4}));
   svg.appendChild(svgEl('path',{d:plotPath(mirror),fill:'none',stroke:'#775e46','stroke-width':2.4}));
   const lookup=(t)=>{let best=e[0];for(const p of e)if(Math.abs(p.t-t)<Math.abs(best.t-t))best=p;return best.radius;};
   S().KNOTS.forEach((t,i)=>{
     const radius=lookup(t)+curve(t),x=MID+radius*FACTOR,y=H-18-t*(H-36);
     const handle=svgEl('circle',{cx:x,cy:y,r:i===0?4:7,fill:i===0?'#72856c':'#faf5ed',
       stroke:i===0?'#72856c':shape.family==='original'?'#aaa89e':'#916d49','stroke-width':2,
       'data-handle':i,tabindex:i&&shape.family!=='original'?'0':'-1',
       role:'slider','aria-label':S().LABELS[i],
       'aria-valuenow':shape.offsets[i],'aria-valuemin':S().families[shape.family].limits[i][0],
       'aria-valuemax':S().families[shape.family].limits[i][1]});
     if(i!==0&&shape.family!=='original')handle.addEventListener('pointerdown',startDrag);
     if(i!==0&&shape.family!=='original')handle.addEventListener('keydown',e=>{
       if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;
       e.preventDefault();
       const next=copy(shape),lim=S().families[shape.family].limits[i];
       next.offsets[i]=Math.max(lim[0],Math.min(lim[1],next.offsets[i]+(e.key==='ArrowRight'?0.5:-0.5)));
       commit(next);
     });
     svg.append(handle);
   });
   const label=$('ol-shade-family-status');
   const dims=window.OpenLampBridge.getProject().params;
   const check=S().validateShape(shape,dims.height,dims.diameter);
   if(label)label.textContent=check.ok?'Perfil dentro de la familia · encastre inferior fijo':
     'Revisar familia: '+check.problems.join(', ');
   const selection=$('ol-family-select');if(selection)selection.value=shape.family;
   $('ol-profile-undo').disabled=!history.length;
   $('ol-profile-redo').disabled=!forward.length;
 }
 function redraw(){active=null;draw();}
 function startDrag(e){
   const idx=Number(e.currentTarget.getAttribute('data-handle'));
   if(idx===0)return;
   const rect=$('ol-profile-svg').getBoundingClientRect();
   drag={index:idx,startX:e.clientX,scale:W/rect.width,initial:copy(projectShape())};
   active=copy(drag.initial);
   // Capture on the stable SVG root: handles are redrawn during dragging.
   $('ol-profile-svg').setPointerCapture(e.pointerId);
 }
 function moveDrag(e){
   if(!drag)return;
   const idx=drag.index,range=S().families[active.family].limits[idx];
   const delta=(e.clientX-drag.startX)*drag.scale/FACTOR;
   const v=Math.round(Math.max(range[0],Math.min(range[1],drag.initial.offsets[idx]+delta))*2)/2;
   active.offsets[idx]=v;draw();
 }
 function endDrag(e){
   if(!drag)return;
   const shape=active;drag=null;
   // A pointer drag creates one undo operation and one expensive mesh update.
   if(shape&&shape.offsets.some((v,i)=>v!==projectShape().offsets[i]))commit(shape);
   else redraw();
 }
 function init(){
   const pane=document.querySelector('.ol-step-pane[data-step="shade"]');
   if(!pane||!S()||!window.OpenLampBridge)return;
   const editor=node('div','ol-profile-editor');
   const title=node('h2','ol-profile-title','Familia de silueta');
   const select=document.createElement('select');select.id='ol-family-select';select.className='ol-input';
   for(const [id,info] of Object.entries(S().families)){
     const option=document.createElement('option');option.value=id;option.textContent=info.name;select.append(option);
   }
   select.addEventListener('change',()=>commit(S().preset(select.value)));
   const subtitle=node('p','ol-profile-subtitle','Elegí una familia para habilitar los puntos. Arrastralos horizontalmente; la línea punteada es el perfil original y el encastre está protegido.');
   const svg=svgEl('svg',{id:'ol-profile-svg',viewBox:`0 0 ${W} ${H}`,role:'group',
     'aria-label':'Editor de perfil lateral con puntos restringidos'});
   svg.addEventListener('pointermove',moveDrag);
   svg.addEventListener('pointerup',endDrag);
   svg.addEventListener('pointercancel',endDrag);
   const footer=node('div','ol-profile-actions');
   const undo=node('button','secondary','Deshacer');undo.id='ol-profile-undo';undo.addEventListener('click',restore);
   const redoBtn=node('button','secondary','Rehacer');redoBtn.id='ol-profile-redo';redoBtn.addEventListener('click',redo);
   footer.append(undo,redoBtn);
   const status=node('p','ol-profile-status');status.id='ol-shade-family-status';status.setAttribute('role','status');
   editor.append(title,select,subtitle,svg,footer,status);
   pane.insertBefore(editor,pane.querySelector('#controls')||pane.firstChild);
   document.addEventListener('openlamp:shade-source',e=>{envelope=e.detail.envelope;redraw();});
   document.addEventListener('openlamp:project-loaded',()=>{history=[];forward=[];redraw();});
   document.addEventListener('openlamp:shade-updated',redraw);
   pane.querySelectorAll('input[type="range"]').forEach(x=>x.addEventListener('change',redraw));
   redraw();
 }
 window.addEventListener('load',init);
})();
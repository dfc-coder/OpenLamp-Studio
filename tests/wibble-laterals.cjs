const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),vm=require('node:vm');
const B=require('../basic-shade.js'),M=require('../mount-adapters.js');
const cx={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),cx);
const g=cx.window.OpenLampTest,raw=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz')));
const base=g.parseStandMesh(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.length));
const mount=M.mountFor('wibble',base),source=M.topLobes(base),original=B.presets.find(x=>x.id==='basic_cylinder');
const fitted=B.fitForMount(original,mount);assert(fitted.ok);
const p=fitted.params,shade=B.build(p,mount),N=192,L=B.LEVELS;
assert(g.validate(shade).ok);
const v=(k,j)=>[shade.positions[(k*N+j%N)*3],shade.positions[(k*N+j%N)*3+1],shade.positions[(k*N+j%N)*3+2]+mount.shadeBottom];
const uniquePoints=[];
for(let j=0;j<N;j++){
 const theta=Math.PI*2*j/N;
 const lip=v(0,j),physical=mount.integrated.lipHeight(theta)+mount.shadeBottom;
 assert(Math.abs(lip[2]-physical)<0.02);
 assert(Math.abs(Math.hypot(lip[0],lip[1])-p.diameter/2)<0.02);
 uniquePoints.push(lip[2]);
}
assert(Math.max(...uniquePoints)-Math.min(...uniquePoints)>8,'Visible lower edge must be nonplanar');
for(const tip of source.tips){
 const phi=((tip.theta%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
 const near=v(0,Math.round(phi/(2*Math.PI)*N)%N);
 assert(near[2]-tip.z>0.25,'Outer seam collides with the source crown');
}
const format=(n)=>Number(n).toFixed(1),project=(v,phi)=>[v[0]*Math.cos(phi)+v[1]*Math.sin(phi),v[2]];
const out=path.join(__dirname,'..','artifacts','shade');fs.mkdirSync(out,{recursive:true});
for(const degrees of [0,45,90,135]){
 const phi=degrees*Math.PI/180;
 const proj=v=>project(v,phi);
 const right=[],left=[];
 const jRight=((Math.round(phi/(2*Math.PI)*N)%N)+N)%N,jLeft=(jRight+N/2)%N;
 for(let k=0;k<L;k++)right.push(proj(v(k,jRight)));
 for(let k=L-1;k>=0;k--)left.push(proj(v(k,jLeft)));
 const minX=-110,maxX=110,minZ=-5,maxZ=mount.shadeBottom+p.height+7;
 const scale=1.52,X=x=>330+x*scale,Y=z=>584-z*scale;
 const pathPoints=ps=>ps.map((a,i)=>(i?'L':'M')+format(X(a[0]))+' '+format(Y(a[1]))).join(' ');
 const baseTop=new Array(74).fill(-Infinity),baseBottom=new Array(74).fill(Infinity);
 for(let i=0;i<base.positions.length;i+=3){
   const [x,z]=proj([base.positions[i],base.positions[i+1],base.positions[i+2]]);
   const bin=Math.max(0,Math.min(73,Math.floor((x+83)/166*74)));
   baseTop[bin]=Math.max(baseTop[bin],z);baseBottom[bin]=Math.min(baseBottom[bin],z);
 }
 const outline=[];
 for(let i=0;i<74;i++)if(Number.isFinite(baseTop[i]))
   outline.push([((i+.5)/74*166-83),baseTop[i]]);
 const basePath=pathPoints(outline);
 const dots=[];
 for(let i=0;i<base.positions.length;i+=60){
   const [x,z]=proj([base.positions[i],base.positions[i+1],base.positions[i+2]]);
   dots.push('<circle cx="'+format(X(x))+'" cy="'+format(Y(z))+'" r="0.75" fill="#ad725e" opacity=".35"/>');
 }
 const screen=`<svg xmlns="http://www.w3.org/2000/svg" width="660" height="620" viewBox="0 0 660 620">
 <rect width="660" height="620" fill="#f5f3ec"/>
 <text x="24" y="30" font-family="sans-serif" font-size="18" fill="#354637">Cylinder + Wibble · lateral ${degrees}°</text>
 ${dots.join("")}
 <path d="${basePath}" fill="none" stroke="#a76553" stroke-width="2"/>
 <path d="${pathPoints(right.concat(left))}Z" fill="#e5d3b3" fill-opacity=".66" stroke="#807256" stroke-width="2"/>
 <path d="${pathPoints([right[0],left[left.length-1]])}" stroke="none"/>
 <line x1="${X(-100)}" y1="${Y(source.zTop)}" x2="${X(100)}" y2="${Y(source.zTop)}" stroke="#aaaaa0" stroke-dasharray="4 5" opacity=".55"/>
 <text x="24" y="609" font-size="12" font-family="sans-serif" fill="#666">CAD lateral — Wibble original (terracota) · Shade (crema) · cotas en mm</text>
 </svg>`;
 fs.writeFileSync(path.join(out,`wibble-lateral-${degrees}.svg`),screen);
}
console.log('PASS Wibble laterals: 4 orthographic profile sheets from ACTUAL base and generated Shade, no flared cylinder, nonflat complementary seam');

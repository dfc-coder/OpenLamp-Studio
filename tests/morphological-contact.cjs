const assert=require('node:assert/strict');
const fs=require('node:fs'),zlib=require('node:zlib'),vm=require('node:vm'),path=require('node:path');
const B=require('../basic-shade.js'),M=require('../mount-adapters.js');
const ctx={window:{addEventListener(){},OpenLampBasics:B,OpenLampMounts:M},
 console,Math,Float32Array,Uint32Array,ArrayBuffer,DataView,Map,WeakMap,Number,Error};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),ctx);
const g=ctx.window.OpenLampTest,raw=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..','assets/stands/wibble-stand.olmesh.gz')));
const source=g.parseStandMesh(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.length));
const mount=M.mountFor('wibble',source),seat=mount.integrated,N=192,reports=[];
for(const orig of B.presets){
 const fit=B.fitForMount(orig,mount);
 if(!fit.ok)continue;
 const p=fit.params,shade=B.build(p,mount),P=shade.positions,sections=B.crossSection(p,mount);
 assert(g.validate(shade).ok,p.id);
 const first=sections.findIndex(x=>x.kind==='saddle');
 assert(first>0);
 const v=(k,j)=>3*(k*N+(j+N)%N);
 let sampled=0,near=0,minGap=Infinity,largestPenetration=0;
 for(let k=first;k<first+seat.radialSamples;k++)for(let j=0;j<N;j+=2){
   const a=v(k,j),b=v(k,j+1),c=v(k+1,j),d=v(k+1,j+1);
   for(const at of [a,b,c,d]){
     const x=P[at],y=P[at+1],z=P[at+2];
     const top=seat.sampleTop(Math.hypot(x,y),Math.atan2(y,x));
     if(top===null||top<seat.minContactZ-3)continue;
     const gap=z-top;
     minGap=Math.min(minGap,gap);sampled++;if(gap<1.6)near++;
     assert(gap>=-.003,p.id+' vertex penetration '+gap);
   }
   // The actual diagonal of exported triangles (not an interpolated spline).
   const x=(P[b]+P[c])*.5,y=(P[b+1]+P[c+1])*.5,z=(P[b+2]+P[c+2])*.5;
   const top=seat.sampleTop(Math.hypot(x,y),Math.atan2(y,x));
   if(top!==null&&top>seat.minContactZ-3){
     const gap=z-top;largestPenetration=Math.min(largestPenetration,gap);
     assert(gap>-.12,p.id+' STL facet intersects Wibble '+gap);
   }
 }
 assert(sampled>70,p.id+' source-contact coverage missing');
 assert(near>20,p.id+' conformal support no longer follows the original four crowns');
 reports.push({shape:p.id,minimumSampledClearanceMm:minGap.toFixed(3),near});
}
assert(reports.length>=4);
console.log('PASS morphological contact: source-matched 2.5D saddle, facet collision samples, lower conformal silhouette; rejected dimensions excluded');
console.log(JSON.stringify(reports));

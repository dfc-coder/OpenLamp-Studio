/* OpenLamp mount contracts and Wibble bridge.
 * Coordinates in mm. Geometry is CAD-prototype only, not physical fit certification.
 * Never alter source stand triangles. The Wibble bridge samples the upper
 * original mesh and seats over its four top lobes with a relief allowance.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.OpenLampMounts=api;
})(typeof window!=='undefined'?window:undefined,function(){
 'use strict';
 const TAU=2*Math.PI;
 const SHADOW_GAP=0.9; // nominal visual joint separation, physical calibration pending
 const FLAT=Object.freeze({id:'flat',kind:'direct',seatOuterRadius:34.880,
   socketInnerRadius:35.044,insertion:14.17,contactClearance:0.164,
   verifiedCAD:true,verifiedPhysical:false});
 const WIBBLE=Object.freeze({id:'wibble',kind:'conformal-bridge',
   seatOuterRadius:34.880,socketInnerRadius:35.044,insertion:14.17,
   contactClearance:0.6,verifiedCAD:false,verifiedPhysical:false});
 const profiles=Object.freeze({flat:FLAT,wibble:WIBBLE});
 const clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
 const angleDistance=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
 function profileFor(id){if(!profiles[id])throw new Error('Base sin perfil de acople');return profiles[id];}
 function topLobes(mesh){
   if(!mesh?.positions?.length)throw new Error('Malla de Wibble ausente');
   let zTop=-Infinity;
   for(let i=2;i<mesh.positions.length;i+=3)zTop=Math.max(zTop,mesh.positions[i]);
   const result=[];
   for(let sector=0;sector<4;sector++){
     let tip=null;
     for(let i=0;i<mesh.positions.length;i+=3){
       const x=mesh.positions[i],y=mesh.positions[i+1],z=mesh.positions[i+2];
       const theta=(Math.atan2(y,x)+TAU)%TAU;
       if(Math.floor(theta/(TAU/4))!==sector)continue;
       const rad=Math.hypot(x,y);
       if(rad<58||rad>83)continue;
       if(!tip||z>tip.z)tip={x,y,z,r:rad,theta,sector};
     }
     if(!tip||zTop-tip.z>1.5||tip.r<65||tip.r>80)
       throw new Error('No se encontraron cuatro lóbulos superiores compatibles con Wibble');
     result.push(tip);
   }
   return {zTop,tips:result};
 }
 // Preindex Wibble's near-top triangles into XY buckets, preserving original mesh.
 // Vertical barycentric queries return the highest actual mesh surface at XY.
 function upperSurfaceSampler(mesh,zFloor){
   const P=mesh.positions,I=mesh.indices,grid=new Map(),size=5;
   const key=(a,b)=>a+','+b;
   for(let f=0;f<I.length;f+=3){
     const ia=3*I[f],ib=3*I[f+1],ic=3*I[f+2];
     const za=P[ia+2],zb=P[ib+2],zc=P[ic+2];
     if(Math.max(za,zb,zc)<zFloor-5)continue;
     const ax=P[ia],ay=P[ia+1],bx=P[ib],by=P[ib+1],cx=P[ic],cy=P[ic+1];
     const den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
     if(Math.abs(den)<1e-8)continue;
     const xmin=Math.floor(Math.min(ax,bx,cx)/size),xmax=Math.floor(Math.max(ax,bx,cx)/size);
     const ymin=Math.floor(Math.min(ay,by,cy)/size),ymax=Math.floor(Math.max(ay,by,cy)/size);
     for(let ix=xmin;ix<=xmax;ix++)for(let iy=ymin;iy<=ymax;iy++){
       const k=key(ix,iy),list=grid.get(k)||[];list.push({ax,ay,bx,by,cx,cy,za,zb,zc,den});
       grid.set(k,list);
     }
   }
   return function topAt(x,y){
     const triangles=grid.get(key(Math.floor(x/size),Math.floor(y/size)))||[];
     let max=-Infinity;
     for(const v of triangles){
       const u=((v.by-v.cy)*(x-v.cx)+(v.cx-v.bx)*(y-v.cy))/v.den;
       const w=((v.cy-v.ay)*(x-v.cx)+(v.ax-v.cx)*(y-v.cy))/v.den;
       if(u< -1e-5||w< -1e-5||u+w>1.00001)continue;
       const z=u*v.za+w*v.zb+(1-u-w)*v.zc;
       if(z>max)max=z;
     }
     return max;
   };
 }
 function bridgeParameters(standMesh){
   const analysis=topLobes(standMesh);
   return {id:'wibble',kind:'conformal-bridge',top:analysis.zTop,
     plateTop:analysis.zTop+8,shadeBottom:analysis.zTop+8+SHADOW_GAP,
     seatTop:analysis.zTop+8+WIBBLE.insertion,seatRadius:WIBBLE.seatOuterRadius,
     contactClearance:WIBBLE.contactClearance,tips:analysis.tips};
 }
 function buildWibbleBridge(standMesh){
   const params=bridgeParameters(standMesh);
   const N=128,steps=20,RBORE=16,RSEAT=WIBBLE.seatOuterRadius;
   const zTop=params.top,plate=params.plateTop;
   const sample=upperSurfaceSampler(standMesh,zTop-26);
   // Four radial arms follow actual apex angles, not an invented central socket.
   // Narrow waist between arms avoids hiding Wibble's sculptural form.
   const outerRadius=theta=>{
     let influence=0;
     for(const tip of params.tips){
       const diff=angleDistance(theta,tip.theta);
       influence=Math.max(influence,Math.exp(-0.5*(diff/0.29)**2));
     }
     return 43+40*influence;
   };
   const points=[],faces=[],rings=[];
   const addRing=(fn)=>{
     const ring=[];
     for(let j=0;j<N;j++){
       const theta=j*TAU/N,p=fn(theta);
       ring.push(points.length/3);points.push(p[0],p[1],p[2]);
     }
     rings.push(ring);
   };
   const ringAt=(rad,z)=>addRing(t=>[rad*Math.cos(t),rad*Math.sin(t),z]);
   ringAt(RBORE,params.seatTop);
   ringAt(RSEAT,params.seatTop);
   ringAt(RSEAT,plate);
   // Upper plate: 20 radial segments, clover-shaped boundary.
   for(let k=1;k<=steps;k++)addRing(t=>{
     const rad=RSEAT+(outerRadius(t)-RSEAT)*k/steps;
     return [rad*Math.cos(t),rad*Math.sin(t),plate];
   });
   // Bottom at the outer edge, followed by measured conformal underside.
   // Clearance is toward the FREE space, so no deliberate CAD penetration.
   const fallback=zTop-12;
   for(let k=steps;k>=0;k--)addRing(t=>{
     const rad=RBORE+(outerRadius(t)-RBORE)*k/steps;
     const x=rad*Math.cos(t),y=rad*Math.sin(t);
     const sampled=sample(x,y);
     const underside=Number.isFinite(sampled)?
       Math.max(fallback,sampled+WIBBLE.contactClearance):fallback;
     if(underside>=plate-1.5)throw new Error('Puente sin espesor suficiente sobre Wibble');
     return [x,y,underside];
   });
   // Closing ring: r=RBORE near base, then up the bore to first ring.
   // Last underside ring already sits on RBORE; connect to original ring at top.
   // For a radial contour ordered as [inner top -> outer top -> outer underside -> inner underside],
   // theta faces use the same orientation on every segment.
   for(let k=0;k<rings.length;k++){
     const a=rings[k],b=rings[(k+1)%rings.length];
     for(let j=0;j<N;j++){
       const n=(j+1)%N;
       faces.push(a[j],b[j],a[n],a[n],b[j],b[n]);
     }
   }
   const mesh={positions:new Float32Array(points),indices:new Uint32Array(faces),
     vertexCount:points.length/3,triangleCount:faces.length/3};
   return {mesh,profile:params,status:'prototype',contactSites:params.tips.length};
 }
 const bridgeCache=new WeakMap();
 function mountFor(baseId,standMesh){
   const spec=profileFor(baseId);
   if(baseId==='flat')return {baseId,status:'cad-only',adapter:null,
     shadeBottom:35.59607-spec.insertion+SHADOW_GAP,
     interface:{...spec}};
   let bridge=bridgeCache.get(standMesh);
   if(!bridge){bridge=buildWibbleBridge(standMesh);bridgeCache.set(standMesh,bridge);}
   return {baseId,status:'prototype',adapter:bridge.mesh,
     shadeBottom:bridge.profile.shadeBottom,interface:{...spec},
     bridgeProfile:bridge.profile,contactSites:bridge.contactSites};
 }
 return Object.freeze({profiles,profileFor,topLobes,bridgeParameters,
   buildWibbleBridge,mountFor,upperSurfaceSampler,SHADOW_GAP});
});
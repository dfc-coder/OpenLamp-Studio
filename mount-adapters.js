/* OpenLamp mount contracts and integrated Wibble seat.
 * Coordinates in mm. Geometry is CAD-prototype only, not physical fit certification.
 * Never alter source stand triangles. The Wibble shade itself contains a
 * shallow four-tip-supported annular shelf, with no third adapter solid.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.OpenLampMounts=api;
})(typeof window!=='undefined'?window:undefined,function(){
 'use strict';
 const TAU=2*Math.PI;
 const WIBBLE_SKIRT_DROP=22.0; // actual bottom coordinate below tallest Wibble crown
 const WIBBLE_CONTACT_GAP=0.4;
 const SHADOW_GAP=0.9; // nominal visual joint separation, physical calibration pending
 const FLAT=Object.freeze({id:'flat',kind:'direct',seatOuterRadius:34.880,
   socketInnerRadius:35.044,insertion:14.17,contactClearance:0.164,
   verifiedCAD:true,verifiedPhysical:false});
 const WIBBLE=Object.freeze({id:'wibble',kind:'integrated-saddle',
   seatOuterRadius:null,socketInnerRadius:null,insertion:0,
   contactClearance:WIBBLE_CONTACT_GAP,verifiedCAD:false,verifiedPhysical:false});
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
 const mountsCache=new WeakMap();
 function mountFor(baseId,standMesh){
   const spec=profileFor(baseId);
   if(baseId==='flat')return {
     baseId,status:'cad-only',adapter:null,
     shadeBottom:35.59607-spec.insertion+SHADOW_GAP,
     interface:{...spec},
   };
   if(mountsCache.has(standMesh))return mountsCache.get(standMesh);
   // The Wibble lobe tips are the sole source of contact positioning.
   // The integrated annular support inside Shade stays 0.4mm above their
   // actual highest Z. The visible skirt drops 3mm to hide the upper tips.
   const {zTop,tips}=topLobes(standMesh);
   const maxTipRadius=Math.max(...tips.map(p=>p.r));
   const minTipRadius=Math.min(...tips.map(p=>p.r));
   const shadeBottom=zTop-WIBBLE_SKIRT_DROP;
   // Actual upper Wibble triangles are the surface-of-truth. Sample their
   // height over XY; unsupported angular sectors are OPEN SPACE, not flat seats.
   // Cache the spatial index once per source mesh, not once per slider edit.
   const sampleTop=upperSurfaceSampler(standMesh,zTop-15);
   const skirtBins=192,rawEnvelope=new Float64Array(skirtBins);
   for(let i=0;i<standMesh.positions.length;i+=3){
     const x=standMesh.positions[i],y=standMesh.positions[i+1],z=standMesh.positions[i+2];
     if(z<zTop-5)continue;
     const r=Math.hypot(x,y);
     if(r<55)continue;
     const theta=(Math.atan2(y,x)+TAU)%TAU;
     const bin=Math.floor(theta/TAU*skirtBins)%skirtBins;
     rawEnvelope[bin]=Math.max(rawEnvelope[bin],r);
   }
   // Expand over the actual CAD angular footprint, soften angular transitions
   // and never shrink any bin below the measured source envelope.
   const envelope=new Float64Array(skirtBins);
   for(let i=0;i<skirtBins;i++){
     let maximum=0;
     for(let k=-5;k<=5;k++)maximum=Math.max(maximum,
       rawEnvelope[(i+k+skirtBins)%skirtBins]);
     envelope[i]=maximum;
   }
   const circularEnvelope=angle=>{
     const a=((angle%TAU)+TAU)%TAU,idx=a/TAU*skirtBins;
     const i=Math.floor(idx),f=idx-i;
     return envelope[i%skirtBins]*(1-f)+envelope[(i+1)%skirtBins]*f;
   };
   const localSurfaceZ=(r,theta)=>{
     const z=sampleTop(r*Math.cos(theta),r*Math.sin(theta));
     return Number.isFinite(z)?z-shadeBottom:null;
   };
   // Independent angular boundary condition for the VISIBLE seam, derived
   // from actual crown heights instead of using the old horizontal z=0 lip.
   // Survey the radial band containing the original four Wibble crowns.
   const rawCrown=new Float64Array(skirtBins);
   for(let k=0;k<skirtBins;k++){
     const theta=TAU*k/skirtBins;
     let high=-Infinity;
     for(let j=0;j<=26;j++){
       const radius=58+j*(23/26);
       const z=sampleTop(radius*Math.cos(theta),radius*Math.sin(theta));
       if(Number.isFinite(z)&&z>zTop-30)high=Math.max(high,z);
     }
     rawCrown[k]=Number.isFinite(high)?high:zTop-19;
   }
   const crowns=new Float64Array(skirtBins);
   for(let k=0;k<skirtBins;k++){
     let high=-Infinity;
     for(let shift=-3;shift<=3;shift++)
       high=Math.max(high,rawCrown[(k+shift+skirtBins)%skirtBins]);
     crowns[k]=high;
   }
   const angularCrown=theta=>{
     const t=((theta%TAU)+TAU)%TAU/TAU*skirtBins;
     const i=Math.floor(t),u=t-i;
     return crowns[i%skirtBins]*(1-u)+crowns[(i+1)%skirtBins]*u;
   };
   const lipHeight=theta=>Math.max(0,angularCrown(theta)-shadeBottom+0.8);
   const mount={
     baseId,status:'prototype',adapter:null,shadeBottom,
     interface:{...spec},contactSites:tips.length,
     integrated:{
       kind:'wibble-saddle',
       tipHeight:zTop,
       tipRadii:tips.map(x=>x.r),
       tipAngles:tips.map(x=>x.theta),
       innerShelfRadius:minTipRadius-11,
       requiredExteriorRadius:maxTipRadius+8.5,
       // Measured annular contact follows the actual topography in 2D (r,theta).
       // An angularly independent plane cannot locate Wibble's four lobes.
       sampleTop:localSurfaceZ,
       lipHeight,
       crownHeight:angularCrown,
       maxTipRadius,
       contactBandOuterRadius:maxTipRadius+2.5,
       minExteriorRadius:maxTipRadius+3.8,
       envelopeRadius:circularEnvelope,
       minContactZ:0.65,
       seatRoofZ:WIBBLE_SKIRT_DROP+9,
       contactClearance:WIBBLE_CONTACT_GAP,
       contactUndersideZ:WIBBLE_SKIRT_DROP+WIBBLE_CONTACT_GAP,
       contactTopZ:WIBBLE_SKIRT_DROP+9,
       blendStartZ:22,
       blendEndZ:63,
       skirtDrop:WIBBLE_SKIRT_DROP,
       radialSamples:18,
     },
   };
   mountsCache.set(standMesh,mount);
   return mount;
 }
 return Object.freeze({profiles,profileFor,topLobes,mountFor,upperSurfaceSampler,
   SHADOW_GAP,WIBBLE_SKIRT_DROP,WIBBLE_CONTACT_GAP});
});
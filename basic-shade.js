/* OpenLamp Basics — parametric lathed shade solids, millimeters.
   Preserves a fixed inner mounting ring compatible with the nominal Taller seat.
   A STEP/physical adapter and electrical clearances are NOT inferred here.
*/
(function(root,factory){
  const value=factory();
  if(typeof module==='object'&&module.exports)module.exports=value;
  if(root)root.OpenLampBasics=value;
})(typeof window!=='undefined'?window:undefined,function(){
 'use strict';
 const TAU=2*Math.PI,INNER_MOUNT=35.044,INSERTION=14.17;
 const SOCKET_WALL=2.4, MIN_LIGAMENT=1.5, SOCKET_ROOF=20, SOCKET_UNDERSIDE=17;
 const SEGMENTS=128,LEVELS=96;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
 const defs=[
  ['cylinder','Cylinder','▥',170,132,{}],
  ['cone','Cone','△',165,148,{topDiameter:100}],
  ['dome','Dome','◠',143,154,{}],
  ['bell','Bell','⌒',148,162,{topDiameter:91}],
  ['sphere','Sphere','○',155,158,{}],
  ['pear','Pear','♧',160,153,{belly:0.34}],
  ['disc','Disc','═',100,177,{discDepth:0.30}],
 ];
 const presets=Object.freeze(defs.map(([shape,name,glyph,height,diameter,extra])=>Object.freeze({
  id:'basic_'+shape,name,family:'basic',glyph,height,diameter,thickness:1.8,waist:0,curvature:0,
  ribCount:0,ribDepth:0,twist:0,clearance:0.2,topMode:'original',basicOptions:extra
 })));
 const shapeFor=p=>p.id?.startsWith('basic_')?p.id.slice(6):null;
 const validId=id=>defs.some(x=>x[0]===id);
 function optionsFor(p){
   const shape=shapeFor(p);
   const defaults=presets.find(x=>shapeFor(x)===shape);
   if(!defaults)throw new Error('Forma básica desconocida');
   const o={...defaults.basicOptions,...p.basicOptions};
   if(shape==='cone'||shape==='bell'){
     const v=Number(o.topDiameter);
     o.topDiameter=Number.isFinite(v)?clamp(v,80,Math.min(240,p.diameter)):defaults.basicOptions.topDiameter;
   }
   if(shape==='pear')o.belly=clamp(Number.isFinite(Number(o.belly))?Number(o.belly):0.34,0.28,0.44);
   if(shape==='disc')o.discDepth=clamp(Number.isFinite(Number(o.discDepth))?Number(o.discDepth):0.30,0.2,0.5);
   return o;
 }
 // Pure visual silhouette. All mating geometry is generated INSIDE the shell.
 function radiusAt(t,p){
   const shape=shapeFor(p),o=optionsFor(p),R=p.diameter/2;
   const u=clamp(t,0,1);
   let r;
   switch(shape){
    case 'cylinder':r=R;break;
    case 'cone':r=R+(o.topDiameter/2-R)*clamp((u-0.18)/0.82,0,1);break;
    case 'dome':{
      // A straight-sided drum ending in a continuous hemispherical shoulder.
      // Unlike Sphere it has no lower taper, and unlike Bell no narrow waist.
      const v=smooth((u-0.43)/0.57);
      r=R*Math.sqrt(1-0.71*v*v);break;
    }
    case 'bell':{
      // A true bell has a slender neck with a pronounced flare near its lip.
      // This nonlinear silhouette is NOT a cone with a different top width.
      const q=clamp((u-0.18)/0.82,0,1);
      const flare=Math.sqrt(smooth(q));
      r=R+(o.topDiameter/2-R)*flare;break;
    }
    case 'sphere':{
      // Centered and vertically symmetric spherical section. Open cut ends.
      const q=2*u-1;
      r=R*Math.sqrt(1-0.60*q*q);break;
    }
    case 'pear':{
      // Teardrop grammar: broad lower belly and a genuinely narrow upper neck.
      // Its maximum radius lies BELOW center; Sphere stays symmetric.
      const c=o.belly;
      r=u<=c
        ? R*(0.76+0.24*smooth(u/c))
        : R*(1-0.56*smooth((u-c)/(1-c)));
      break;
    }
    case 'disc':{
      // Narrow lower stem, wide shallow upper plate, then a short crown.
      // The broad shelf is confined to the upper half, not a flattened Sphere.
      const start=clamp(0.69-(o.discDepth-0.30)*0.50,0.58,0.77);
      const shoulder=smooth((u-0.20)/(start-0.20));
      const crown=smooth((u-(start+0.12))/(1-start-0.12));
      r=R*(0.48+0.52*shoulder)*(1-0.31*crown);
      break;
    }
    default:throw new Error('Forma básica desconocida');
   }
   return r;
 }
 function minimumDiameter(p){
   // A radial web must fit between the visual exterior and the concealed
   // socket wall; neither the original stand nor the exterior gets squeezed.
   const ratio={cylinder:1,cone:1,dome:1,bell:1,
     sphere:Math.sqrt(0.4),pear:0.76,disc:0.48}[shapeFor(p)];
   if(!ratio)return Infinity;
   return 2*(INNER_MOUNT+SOCKET_WALL+p.thickness+MIN_LIGAMENT)/ratio;
 }
 function validateParams(p){
   const shape=shapeFor(p),errors=[];
   if(!validId(shape))errors.push('Forma desconocida');
   if(!Number.isFinite(p.height)||p.height<90||p.height>270)errors.push('Altura 90–270 mm');
   if(!Number.isFinite(p.diameter)||p.diameter<110||p.diameter>220)errors.push('Diámetro 110–220 mm');
   if(Number.isFinite(p.diameter)&&Number.isFinite(p.thickness)&&
     p.diameter<minimumDiameter(p)-0.0001)
     errors.push('Diámetro insuficiente para alojar el encastre interior sin deformar la silueta (mínimo '+Math.ceil(minimumDiameter(p))+' mm)');
   if(!Number.isFinite(p.thickness)||p.thickness<1.2||p.thickness>3.5)errors.push('Pared 1,2–3,5 mm');
   if(shape==='cone'||shape==='bell'){
     const input=p.basicOptions?.topDiameter;
     if(!Number.isFinite(input)||input<80||input>p.diameter)errors.push('Diámetro superior fuera del rango permitido');
   }
   return {ok:errors.length===0,errors};
 }
 // Cross-section of ONE closed structural solid. In (radius,z) order:
 // outer skirt ↑ outer shell ↑ upper rim ↓ inner upper shell,
 // inward upper web → inner socket wall ↓ socket lower lip →
 // outer socket wall ↑ underside web → lower inner shell ↓ lower rim.
 // A single revolved connected shell means no unjoined overlapping cylinders.
 function visualRadiusAt(t,p,mount=null,theta=0){
   const original=radiusAt(t,p),seat=mount?.integrated;
   if(!seat)return original;
   // A measured four-lobe FOOTPRINT instead of the previous circular bulge.
   // At each angle the exterior clears Wibble's original high crowns;
   // its upper portion smoothly returns to the chosen family silhouette.
   const z=t*p.height;
   const fade=1-smooth((z-seat.blendStartZ)/(seat.blendEndZ-seat.blendStartZ));
   const required=Math.max(original,seat.innerShelfRadius+p.thickness+9,
     seat.envelopeRadius(theta)+7);
   return original+(required-original)*fade;
 }
 function saddleUndersideAt(r,theta,seat){
   const actual=seat.sampleTop(r,theta);
   if(actual===null)return seat.minContactZ;
   // A negative of the ORIGINAL Wibble upper surface with a nominal vertical
   // print clearance. The base and the shade have matching (x,y) coordinates.
   return Math.max(seat.minContactZ,actual+seat.contactClearance);
 }
 function crossSection(p,mount=null){
   const report=validateParams(p);if(!report.ok)throw new Error(report.errors.join('; '));
   const h=p.height,wall=p.thickness,steps=LEVELS,contour=[];
   const seat=mount?.integrated||null;
   const push=(kind,z,r=null)=>contour.push({kind,z,r});
   for(let k=0;k<steps;k++)push('outer',h*k/(steps-1));
   push('inner',h);
   if(seat){
     // A continuously meshed four-pocket INNER LANDING. Its underside is a
     // heightfield sampled from Wibble's original triangles in (x,y), not a
     // flat annular platform. This remains ONE connected printable shade.
     const roof=seat.seatRoofZ;
     for(let k=steps-2;k>=0;k--){
       const z=h*k/(steps-1);if(z<=roof)break;
       push('inner',z);
     }
     push('inner',roof);
     push('plain',roof,seat.innerShelfRadius);
     for(let k=0;k<=seat.radialSamples;k++){
       const fraction=k/seat.radialSamples;
       contour.push({kind:'saddle',fraction,z:seat.minContactZ});
     }
     push('inner',0);
   }else{
     for(let k=steps-2;k>=0;k--){
       const z=h*k/(steps-1);if(z<=SOCKET_ROOF)break;
       push('inner',z);
     }
     push('inner',SOCKET_ROOF);
     push('plain',SOCKET_ROOF,INNER_MOUNT);
     push('plain',0,INNER_MOUNT);
     push('plain',0,INNER_MOUNT+SOCKET_WALL);
     push('plain',SOCKET_UNDERSIDE,INNER_MOUNT+SOCKET_WALL);
     push('inner',SOCKET_UNDERSIDE);
     for(let k=steps-2;k>=0;k--){
       const z=h*k/(steps-1);if(z>=SOCKET_UNDERSIDE)continue;
       push('inner',z);
     }
   }
   // The last ring is the shell's inner lip at z=0. Connecting it to the
   // first exterior ring gives a closed, real bottom skirt.
   return contour;
 }
 // A sampled vertex can be clear of Wibble while the straight STL facet
 // BETWEEN two samples cuts through its true curved top. Compensate at
 // diagonal, radial/angular edge midpoints and triangle centroids. Lift
 // ONLY the inner saddle, never the exterior silhouette or original base.
 function refineSaddleClearance(P,sections,seat,N){
   const first=sections.findIndex(s=>s.kind==='saddle');
   if(first<0)return;
   const last=first+seat.radialSamples;
   const corrections=new Float32Array(P.length/3),MIN_FACE_GAP=0.15;
   const v=(k,j)=>k*N+(j+N)%N;
   const verify=ids=>{
     let x=0,y=0,z=0;
     for(const id of ids){
       const n=id*3;x+=P[n];y+=P[n+1];z+=P[n+2];
     }
     x/=ids.length;y/=ids.length;z/=ids.length;
     const top=seat.sampleTop(Math.hypot(x,y),Math.atan2(y,x));
     if(top===null||top<seat.minContactZ-3)return;
     const missing=top+MIN_FACE_GAP-z;
     if(missing>0)for(const id of ids)corrections[id]=Math.max(corrections[id],missing);
   };
   for(let k=first;k<last;k++)for(let j=0;j<N;j++){
     const a=v(k,j),b=v(k,j+1),c=v(k+1,j),d=v(k+1,j+1);
     verify([a,b]);verify([a,c]);verify([b,c]);verify([b,d]);verify([c,d]);
     verify([a,c,b]);verify([b,c,d]);
   }
   for(let i=0;i<corrections.length;i++)if(corrections[i]){
     P[i*3+2]+=corrections[i];
     if(P[i*3+2]>=seat.seatRoofZ-2)throw Error('Wibble sin espesor mínimo en apoyo interior');
   }
 }
 function build(p,mount=null){
   const sections=crossSection(p,mount),seat=mount?.integrated||null;
   const N=seat?192:SEGMENTS,h=p.height;
   const material=p.thickness;
   const intensity=Number(p.surfaceIntensity??1);
   const ribs=Number.isFinite(intensity)&&intensity!==1?
     (intensity<1?0.55:1.15):0;
   const positions=new Float32Array(sections.length*N*3);
   const indices=new Uint32Array(sections.length*N*6);
   const idx=(k,j)=>k*N+(j+N)%N;
   const radiusFor=(section,a)=>{
     if(section.kind==='plain')return section.r;
     if(section.kind==='saddle'){
       const inner=seat.innerShelfRadius;
       const outer=visualRadiusAt(0,p,mount,a)-material;
       return inner+(outer-inner)*section.fraction;
     }
     const t=section.z/h;
     const fade=smooth((t-0.20)/0.10)*(1-smooth((t-0.87)/0.13));
     const relief=ribs*fade*Math.pow((1+Math.cos(28*a))/2,2);
     return visualRadiusAt(t,p,mount,a)+relief-(section.kind==='inner'?material:0);
   };
   for(let k=0;k<sections.length;k++)for(let j=0;j<N;j++){
     const section=sections[k],a=TAU*j/N,r=radiusFor(section,a);
     if(!Number.isFinite(r)||r<=0)throw new Error('Radio interior inválido');
     const z=section.kind==='saddle'?saddleUndersideAt(r,a,seat):section.z;
     if(seat&&section.kind==='saddle'&&z>=seat.seatRoofZ-2)
       throw new Error('Wibble: espesor insuficiente sobre el asiento cóncavo');
     const i=idx(k,j)*3;
     positions[i]=r*Math.cos(a);positions[i+1]=r*Math.sin(a);positions[i+2]=z;
   }
   if(seat)refineSaddleClearance(positions,sections,seat,N);
   // With outer skirt -> upper profile -> inner socket -> lower lip order
   // the profile runs CCW in (r,z); reverse orientation if volume is negative
   // (the winding has to remain consistent over the complete cross-section).
   let at=0;
   for(let k=0;k<sections.length;k++){
     const next=(k+1)%sections.length;
     for(let j=0;j<N;j++){
       const nj=(j+1)%N,a=idx(k,j),b=idx(k,nj),c=idx(next,j),d=idx(next,nj);
       indices[at++]=a;indices[at++]=c;indices[at++]=b;
       indices[at++]=b;indices[at++]=c;indices[at++]=d;
     }
   }
   // Correct global winding if the cross-section's signed area is reversed.
   // For toroidal revolutions this signed tetrahedron integral is exact enough
   // to determine consistent outward orientation.
   let signed=0;
   for(let k=0;k<indices.length;k+=3){
     const ai=3*indices[k],bi=3*indices[k+1],ci=3*indices[k+2];
     const ax=positions[ai],ay=positions[ai+1],az=positions[ai+2];
     const bx=positions[bi],by=positions[bi+1],bz=positions[bi+2];
     const cx=positions[ci],cy=positions[ci+1],cz=positions[ci+2];
     signed+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
   }
   if(signed<0)for(let i=0;i<indices.length;i+=3){
     const tmp=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=tmp;
   }
   return {positions,indices,vertexCount:sections.length*N,triangleCount:indices.length/3};
 }
 return Object.freeze({presets,shapeFor,validId,optionsFor,radiusAt,validateParams,build,
  INNER_MOUNT,INSERTION,SOCKET_WALL,SOCKET_ROOF,SOCKET_UNDERSIDE,MIN_LIGAMENT,minimumDiameter,crossSection,visualRadiusAt,saddleUndersideAt,SEGMENTS,LEVELS});
});
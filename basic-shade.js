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
  ['sphere','Sphere','○',155,205,{}],
  ['pear','Pear','♧',160,153,{belly:0.34}],
  ['disc','Disc','═',78,235,{discDepth:0.40}],
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
      // An EXACT circular section: all exterior vertices satisfy the SAME
      // sphere equation r² + (z-height/2)² = (diameter/2)².
      // Height controls ONLY the two planar cropping positions. It does not
      // stretch a sphere into an ellipsoid. Diameters <= height are invalid.
      const z=(u-.5)*p.height;
      r=Math.sqrt(R*R-z*z);break;
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
      // Symmetric lenticular disc: two rounded shoulders and a wide equator.
      // The 72% radial opening preserves the hidden Wibble contact area.
      const shoulder=clamp(o.discDepth,0.20,0.50);
      r=R*(0.72+0.28*smooth(u/shoulder)*smooth((1-u)/shoulder));
      break;
    }
    default:throw new Error('Forma básica desconocida');
   }
   return r;
 }
 function minimumDiameter(p){
   // A radial web must fit between the visual exterior and the concealed
   // socket wall; neither the original stand nor the exterior gets squeezed.
   const target=INNER_MOUNT+SOCKET_WALL+p.thickness+MIN_LIGAMENT;
   if(shapeFor(p)==='sphere')return 2*Math.hypot(target,p.height/2);
   const ratio={cylinder:1,cone:1,dome:1,bell:1,pear:0.76,disc:0.72}[shapeFor(p)];
   return ratio?2*target/ratio:Infinity;
 }
 function maxDiameter(p){
   switch(shapeFor(p)){
     case 'sphere':return 300;
     case 'pear':return 260; // Wibble crown clearance needs a wider true Pear, never a hidden flare.
     case 'disc':return 280;
     default:return 220;
   }
 }
 function validateParams(p){
   const shape=shapeFor(p),errors=[];
   if(!validId(shape))errors.push('Forma desconocida');
   const minHeight=shape==='disc'?50:90,maxHeight=shape==='disc'?150:270;
   if(!Number.isFinite(p.height)||p.height<minHeight||p.height>maxHeight)
     errors.push('Altura fuera del rango '+minHeight+'–'+maxHeight+' mm');
   if(!Number.isFinite(p.diameter)||p.diameter<110||p.diameter>maxDiameter(p))errors.push('Diámetro fuera del rango 110–'+maxDiameter(p)+' mm');
   if(shape==='sphere'&&p.height>=p.diameter)
     errors.push('Sphere: altura de la zona esférica debe ser menor que el diámetro');
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
   // Do not add a Wibble flare, collar or fabricated radial blending. A shape
   // whose lower radius is insufficient must enlarge explicitly or be blocked.
   return radiusAt(t,p);
 }
 function requiredDiameter(p,mount){
   const seat=mount?.integrated;
   if(!seat)return minimumDiameter(p);
   const target=seat.minExteriorRadius+p.thickness;
   // Solve against the TRUE radial profile. Sphere is nonlinear in diameter:
   // multiplying a 200-mm sample would incorrectly reject spherical sections.
   const upper=maxDiameter(p),lower=Math.max(110,minimumDiameter(p));
   if(lower>upper)return lower;
   if(radiusAt(0,{...p,diameter:upper})<target)return Infinity;
   let lo=lower,hi=upper;
   for(let step=0;step<28;step++){
     const d=(lo+hi)/2;
     if(radiusAt(0,{...p,diameter:d})<target)lo=d;
     else hi=d;
   }
   return hi;
 }
 function fitForMount(p,mount){
   const needed=requiredDiameter(p,mount);
   const max=maxDiameter(p);
   if(!Number.isFinite(needed)||needed>max)
     return {ok:false,minimum:Math.ceil(needed),reason:'Esta silueta requiere más de Ø'+max+' mm para asentarse en Wibble sin deformarse.'};
   const minimum=Math.ceil(needed+0.002);
   return {ok:true,minimum,params:{...p,diameter:Math.max(p.diameter,minimum)}};
 }
 function conformedLipZ(z,theta,seat){
   if(!seat)return z;
   const lip=seat.lipHeight(theta);
   const transition=Math.max(52,2.5*lip);
   return z+lip*(1-smooth(z/transition));
 }
 function saddleUndersideAt(r,theta,seat){
   const actual=seat.sampleTop(r,theta);
   if(actual===null)return seat.minContactZ;
   return Math.max(seat.minContactZ,actual+seat.contactClearance);
 }
 function matingUndersideAt(r,theta,fraction,seat){
   const contact=saddleUndersideAt(r,theta,seat);
   // Outer underside approaches the sculpted visible edge. The inner part
   // stays source-conformal and continues to support all four real lobes.
   const blend=smooth((fraction-0.82)/0.18);
   return contact+(seat.lipHeight(theta)-contact)*blend;
 }
 function crossSection(p,mount=null){
   const report=validateParams(p);if(!report.ok)throw new Error(report.errors.join('; '));
   if(mount?.integrated&&p.diameter+0.01<requiredDiameter(p,mount))
     throw new Error('Diámetro insuficiente para Wibble: mínimo Ø'+Math.ceil(requiredDiameter(p,mount))+' mm. No se deformará la silueta.');
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
     // Underside finishes at the real lower lip. A second inner ring
     // at z=0 would make an obsolete planar skirt hang below the seam.
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
   const corrections=new Float32Array(P.length/3);
   const v=(k,j)=>k*N+(j+N)%N;
   // CGAL revealed micro-intersections invisible at triangle vertices and
   // centroids. Sample the projected triangle interior, not just its borders.
   const gap=seat.contactClearance+0.15;
   const checks=[];
   for(let i=0;i<=8;i++)for(let j=0;j<=8-i;j++){
     const k=8-i-j;
     if(i===8||j===8||k===8)continue;
     checks.push([i/8,j/8,k/8]);
   }
   for(let pass=0;pass<5;pass++){
     corrections.fill(0);
     let worst=0;
     for(let k=first;k<last;k++)for(let j=0;j<N;j++){
       const a=v(k,j),b=v(k,j+1),c=v(k+1,j),d=v(k+1,j+1);
       for(const ids of [[a,c,b],[b,c,d]]){
         for(const [wa,wb,wc] of checks){
           const [ia,ib,ic]=ids.map(i=>i*3);
           const x=P[ia]*wa+P[ib]*wb+P[ic]*wc;
           const y=P[ia+1]*wa+P[ib+1]*wb+P[ic+1]*wc;
           const z=P[ia+2]*wa+P[ib+2]*wb+P[ic+2]*wc;
           const top=seat.sampleTop(Math.hypot(x,y),Math.atan2(y,x));
           if(top===null||top<seat.minContactZ-3)continue;
           const missing=top+gap-z;
           worst=Math.max(worst,missing);
           if(missing>0)for(const id of ids)
             corrections[id]=Math.max(corrections[id],missing);
         }
       }
     }
     if(worst<=0.01)break;
     for(let i=0;i<corrections.length;i++)if(corrections[i]){
       P[i*3+2]+=corrections[i];
       if(P[i*3+2]>=seat.seatRoofZ-2)throw Error('Wibble sin espesor mínimo en apoyo interior');
     }
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
     const z=section.kind==='saddle'
       ? matingUndersideAt(r,a,section.fraction,seat)
       : (seat&&(section.kind==='outer'||section.kind==='inner')
          ?conformedLipZ(section.z,a,seat):section.z);
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
  INNER_MOUNT,INSERTION,SOCKET_WALL,SOCKET_ROOF,SOCKET_UNDERSIDE,MIN_LIGAMENT,minimumDiameter,maxDiameter,requiredDiameter,fitForMount,conformedLipZ,matingUndersideAt,crossSection,visualRadiusAt,saddleUndersideAt,SEGMENTS,LEVELS});
});
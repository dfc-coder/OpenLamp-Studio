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
 const SEGMENTS=128,LEVELS=96;
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
 const defs=[
  ['cylinder','Cylinder','▥',170,132,{}],
  ['cone','Cone','△',165,148,{topDiameter:100}],
  ['dome','Dome','◠',143,154,{}],
  ['bell','Bell','⌒',148,162,{topDiameter:91}],
  ['sphere','Sphere','○',155,158,{}],
  ['pear','Pear','♧',160,153,{belly:0.58}],
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
   if(shape==='pear')o.belly=clamp(Number.isFinite(Number(o.belly))?Number(o.belly):0.58,0.4,0.75);
   if(shape==='disc')o.discDepth=clamp(Number.isFinite(Number(o.discDepth))?Number(o.discDepth):0.30,0.2,0.5);
   return o;
 }
 // A fixed bottom collar, followed by a smooth transition to the design body.
 // The entire outer profile is sampled from the same radial equation.
 function radiusAt(t,p){
   const shape=shapeFor(p),o=optionsFor(p),R=p.diameter/2;
   const u=clamp(t,0,1);
   let r;
   switch(shape){
    case 'cylinder':r=R;break;
    case 'cone':r=R+(o.topDiameter/2-R)*u;break;
    case 'dome':{
      // Gentle upright cylinder transforming into a quarter-dome shoulder.
      const v=smooth((u-0.43)/0.57);
      r=R*(1-0.38*(1-Math.cos(Math.PI*v/2)));break;
    }
    case 'bell':{
      // Narrow shoulder at top, broad calm skirt below (no extra humps).
      const v=smooth(u);
      r=R+(o.topDiameter/2-R)*v;break;
    }
    case 'sphere':{
      // Cropped oval: both ends remain printable, open and nonzero-radius.
      const q=2*u-1;
      r=R*Math.sqrt(Math.max(0.35,1-0.57*q*q));break;
    }
    case 'pear':{
      const c=o.belly;
      const q=(u-c)/(u<c?c:1-c);
      r=R*(1-0.33*Math.pow(Math.abs(q),1.7));break;
    }
    case 'disc':{
      const c=1-o.discDepth,spread=Math.max(0.1,o.discDepth);
      r=R*(0.47+0.53*Math.exp(-Math.pow((u-c)/spread,2)));break;
    }
    default:throw new Error('Forma básica desconocida');
   }
   // The inset lower interface cannot be scaled along with the silhouette.
   const collar=INNER_MOUNT+p.thickness;
   const transition=smooth(u/0.18);
   return collar+(r-collar)*transition;
 }
 function validateParams(p){
   const shape=shapeFor(p),errors=[];
   if(!validId(shape))errors.push('Forma desconocida');
   if(!Number.isFinite(p.height)||p.height<90||p.height>270)errors.push('Altura 90–270 mm');
   if(!Number.isFinite(p.diameter)||p.diameter<110||p.diameter>220)errors.push('Diámetro 110–220 mm');
   if(!Number.isFinite(p.thickness)||p.thickness<1.2||p.thickness>3.5)errors.push('Pared 1,2–3,5 mm');
   if(shape==='cone'||shape==='bell'){
     const input=p.basicOptions?.topDiameter;
     if(!Number.isFinite(input)||input<80||input>p.diameter)errors.push('Diámetro superior fuera del rango permitido');
   }
   return {ok:errors.length===0,errors};
 }
 function build(p){
   const report=validateParams(p);if(!report.ok)throw new Error(report.errors.join('; '));
   const N=SEGMENTS,L=LEVELS;
   const positions=new Float32Array((2*L*N)*3),indices=new Uint32Array(12*N*(L-1)+12*N);
   const ring=L*N;
   const oidx=(k,j)=>k*N+(j+N)%N, iidx=(k,j)=>ring+oidx(k,j);
   let cursor=0;
   const tri=(a,b,c)=>{indices[cursor++]=a;indices[cursor++]=b;indices[cursor++]=c;};
   const intensity=Number(p.surfaceIntensity??1);
   const ribs=Number.isFinite(intensity)&&intensity!==1?
     (intensity<1?0.55:1.15):0;
   for(let k=0;k<L;k++){
     const t=k/(L-1),z=p.height*t,outer=radiusAt(t,p);
     const fade=smooth((t-0.2)/0.1)*(1-smooth((t-0.87)/0.13));
     for(let j=0;j<N;j++){
       const a=TAU*j/N;
       const detail=ribs*fade*Math.pow((1+Math.cos(28*a))/2,2);
       // Symmetric offset of interior/exterior preserves radial wall width.
       const r=outer+detail;
       for(const [at,rad] of [[oidx(k,j),r],[iidx(k,j),r-p.thickness]]){
         const i=at*3;positions[i]=rad*Math.cos(a);positions[i+1]=rad*Math.sin(a);positions[i+2]=z;
       }
     }
   }
   for(let k=0;k<L-1;k++)for(let j=0;j<N;j++){
     const a=oidx(k,j),b=oidx(k,j+1),c=oidx(k+1,j),d=oidx(k+1,j+1);
     tri(a,b,c);tri(b,d,c);
     const ia=iidx(k,j),ib=iidx(k,j+1),ic=iidx(k+1,j),id=iidx(k+1,j+1);
     tri(ia,ic,ib);tri(ib,ic,id);
   }
   for(let j=0;j<N;j++){
     // Bottom and top annular end faces: open cavities and watertight walls.
     tri(oidx(0,j),iidx(0,j),oidx(0,j+1));
     tri(oidx(0,j+1),iidx(0,j),iidx(0,j+1));
     tri(oidx(L-1,j),oidx(L-1,j+1),iidx(L-1,j));
     tri(oidx(L-1,j+1),iidx(L-1,j+1),iidx(L-1,j));
   }
   if(cursor!==indices.length)throw new Error('Topology allocation mismatch');
   return {positions,indices,vertexCount:2*L*N,triangleCount:indices.length/3};
 }
 return Object.freeze({presets,shapeFor,validId,optionsFor,radiusAt,validateParams,build,
  INNER_MOUNT,INSERTION,SEGMENTS,LEVELS});
});
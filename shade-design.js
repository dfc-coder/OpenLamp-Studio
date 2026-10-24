/* OpenLamp Shade v1: original-mesh silhouette grammar, pure and testable.
 * Profile offsets are radial MILLIMETERS, not new geometry or new ribbing.
 * The locked 20-mm mounting collar is never affected.
 */
(function(root,build){
  const api=build();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.OpenLampShade=api;
})(typeof window!=='undefined'?window:undefined,function(){
  'use strict';
  const KNOTS=Object.freeze([0,0.2,0.43,0.72,1]);
  const LABELS=Object.freeze(['Montaje','Transición','Cintura','Volumen','Borde']);
  const master=Object.freeze({height:228.142662,diameter:131.198182});
  const families=Object.freeze({
    original:Object.freeze({name:'Taller original',height:[195,265.2],diameter:[131.198182,175.2],
      offsets:[0,0,0,0,0],limits:[[0,0],[0,0],[0,0],[0,0],[0,0]]}),
    vertical:Object.freeze({name:'Taller Vertical',height:[215,265.2],diameter:[131.198182,151],
      offsets:[0,0,-1,-2,0],limits:[[0,0],[-2,2],[-6,3],[-5,4],[-2,4]]}),
    soft:Object.freeze({name:'Taller Soft',height:[195,245],diameter:[131.198182,165],
      offsets:[0,0,4,7,5],limits:[[0,0],[-2,3],[-1,8],[3,11],[1,9]]}),
    flared:Object.freeze({name:'Taller Flared',height:[195,250],diameter:[131.198182,175.2],
      offsets:[0,0,-2,7,13],limits:[[0,0],[-2,2],[-6,2],[3,11],[9,17]]}),
  });
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function normalize(input={}){
    const family=Object.hasOwn(families,input.family)?input.family:'original';
    const f=families[family];
    const offsets=Array.isArray(input.offsets)&&input.offsets.length===5?input.offsets:f.offsets;
    if(!offsets.every(Number.isFinite))throw new Error('Puntos de perfil no válidos');
    return {family,offsets:offsets.map((v,i)=>clamp(v,...f.limits[i]))};
  }
  function preset(family){
    if(!Object.hasOwn(families,family))throw new Error('Familia no reconocida');
    return normalize({family});
  }
  function slopes(offsets){
    const result=new Float64Array(offsets.length);
    // Monotone cubic Hermite derivatives: no accidental overshoots or bumps.
    const d=[];
    for(let i=0;i<offsets.length-1;i++)d.push((offsets[i+1]-offsets[i])/(KNOTS[i+1]-KNOTS[i]));
    result[0]=d[0];result[result.length-1]=d[d.length-1];
    for(let i=1;i<offsets.length-1;i++){
      if(d[i-1]*d[i]<=0){result[i]=0;continue;}
      const h0=KNOTS[i]-KNOTS[i-1],h1=KNOTS[i+1]-KNOTS[i];
      const w1=2*h1+h0,w2=h1+2*h0;
      result[i]=(w1+w2)/(w1/d[i-1]+w2/d[i]);
    }
    return result;
  }
  function makeCurve(shape){
    const p=normalize(shape),v=p.offsets,m=slopes(v);
    return function radialOffset(t){
      if(t<=0)return v[0];
      if(t>=1)return v[v.length-1];
      let k=0;
      while(k<KNOTS.length-2&&t>KNOTS[k+1])k++;
      const h=KNOTS[k+1]-KNOTS[k],u=(t-KNOTS[k])/h;
      const u2=u*u,u3=u2*u;
      return (2*u3-3*u2+1)*v[k]+(u3-2*u2+u)*h*m[k]+
        (-2*u3+3*u2)*v[k+1]+(u3-u2)*h*m[k+1];
    };
  }
  function validateShape(shape, height, diameter){
    let normalized;
    try{normalized=normalize(shape);}catch(e){return {ok:false,problems:[e.message]};}
    const f=families[normalized.family],problems=[];
    if(!Number.isFinite(height)||height<f.height[0]||height>f.height[1])
      problems.push('Altura fuera del rango de '+f.name);
    if(!Number.isFinite(diameter)||diameter<f.diameter[0]-0.002||diameter>f.diameter[1])
      problems.push('Diámetro fuera del rango de '+f.name);
    if(normalized.family==='original'&&normalized.offsets.some(x=>x!==0))
      problems.push('El maestro original no admite desplazamiento de perfil');
    const curve=makeCurve(normalized);
    let turns=0,lastSign=0,prev=curve(0);
    for(let i=1;i<=200;i++){
      const next=curve(i/200),sign=Math.sign(next-prev);
      if(sign!==0&&lastSign!==0&&sign!==lastSign)turns++;
      if(sign!==0)lastSign=sign;
      prev=next;
    }
    if(turns>3)problems.push('Demasiados extremos en la envolvente');
    return {ok:problems.length===0,problems,turns,ratio:height/diameter};
  }
  // A narrow profile derived from the REAL OBJ; bins store outer-envelope
  // percentile (not a mix of internal/external vertices).
  function extractEnvelope(mesh,zMin,zMax,bins=160){
    const P=mesh.positions,slices=Array.from({length:bins},()=>[]);
    const h=zMax-zMin;
    for(let i=0;i<P.length;i+=3){
      const t=clamp((P[i+2]-zMin)/h,0,0.999999);
      slices[Math.floor(t*bins)].push(Math.hypot(P[i],P[i+1]));
    }
    const raw=slices.map(v=>{
      if(!v.length)return null;
      v.sort((a,b)=>a-b);
      return v[Math.min(v.length-1,Math.floor(v.length*0.95))];
    });
    for(let k=0;k<bins;k++)if(raw[k]===null){
      const before=raw.slice(0,k).findLastIndex(v=>v!==null);
      const after=raw.findIndex((v,i)=>i>k&&v!==null);
      raw[k]=before>=0?raw[before]:(after>=0?raw[after]:0);
    }
    return raw.map((_,i)=>({t:(i+0.5)/bins,radius:(raw[Math.max(0,i-1)]+raw[i]+raw[Math.min(bins-1,i+1)])/3}));
  }
  function sampleProfile(envelope,shape){
    const curve=makeCurve(shape);
    return envelope.map(x=>({t:x.t,radius:x.radius+curve(x.t)}));
  }
  return Object.freeze({master,KNOTS,LABELS,families,preset,normalize,makeCurve,validateShape,extractEnvelope,sampleProfile});
});
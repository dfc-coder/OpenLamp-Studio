/* OpenLamp Studio — static prototype for DESK lamp shades and modular bases.
 * Reuses polar profiles/grid topology and STL exporter concepts from VaseMaker
 * (dcityorg/vasemaker, MIT). Rendering by bundled Plotly.js (MIT).
 * No electrical fixtures are represented as mechanically validated.
 */
(() => {
  'use strict';
  // Six curated designs. IDs from v0.2 remain stable for JSON backwards compatibility.
  const FAMILY = {
    soft: {label:'ABSTRACT SOFT',ribDepth:[0,0.5],ribCount:[0,14],twist:[-6,6]},
    petal: {label:'ABSTRACT CLASSIC',ribDepth:[0,1.2],ribCount:[10,26],twist:[-8,8]},
    calm: {label:'ABSTRACT MINIMAL',ribDepth:[0,0.9],ribCount:[14,34],twist:[-6,6]},
    atelier: {label:'ATELIER · PANTALLAS DE MESA',ribDepth:[0,0.6],ribCount:[0,32],twist:[-5,5]},
    taller: {label:'TALLER · PARAMÉTRICA',ribDepth:[0,2],ribCount:[0,52],twist:[-10,10]},
    original: {label:'ARCHIVO OBJ ORIGINAL',ribDepth:[0,0],ribCount:[0,0],twist:[0,0]},
    basic: {label:'FORMAS BÁSICAS',ribDepth:[0,0],ribCount:[0,0],twist:[0,0]},
  };
  const PRESETS = [...(window.OpenLampBasics?.presets||[]),
    {id:'tallertop_original',archived:!!window.OpenLampBasics,name:'Taller Top · Original',family:'original',glyph:'◉',height:228.142662,diameter:131.198182,thickness:1.6,ribDepth:0,ribCount:0,twist:0,topMode:'original',waist:0,curvature:0},
    {id:'taller_top',archived:true,name:'Taller Top',family:'taller',glyph:'⌛',height:228,diameter:131.2,thickness:1.6,ribDepth:0.6,ribCount:40,twist:0,topMode:'open'},
    {id:'halo',archived:true,name:'Halo',family:'atelier',glyph:'◒',height:120,diameter:238,thickness:1.6,ribDepth:0,ribCount:0,twist:0},
    {id:'domo',archived:true,name:'Domo',family:'atelier',glyph:'◠',height:128,diameter:220,thickness:1.6,ribDepth:0,ribCount:0,twist:0},
    {id:'campana_atelier',archived:true,name:'Campana',family:'atelier',glyph:'⌒',height:134,diameter:219,thickness:1.6,ribDepth:0,ribCount:0,twist:0},
    {id:'tambor_atelier',archived:true,name:'Tambor',family:'atelier',glyph:'▥',height:144,diameter:207,thickness:1.6,ribDepth:0.35,ribCount:28,twist:0},
    {id:'globo',archived:true,name:'Globo',family:'soft',glyph:'◯',height:158,diameter:168,thickness:1.6,ribDepth:0.15,ribCount:10,twist:0},
    {id:'organica',archived:true,name:'Óvalo',family:'soft',glyph:'⬭',height:178,diameter:154,thickness:1.6,ribDepth:0.12,ribCount:12,twist:0},
    {id:'hongo',archived:true,name:'Hongo',family:'petal',glyph:'◠',height:132,diameter:188,thickness:1.8,ribDepth:0.45,ribCount:18,twist:0},
    {id:'petalo',archived:true,name:'Campana',family:'petal',glyph:'⌒',height:152,diameter:176,thickness:1.8,ribDepth:0.35,ribCount:20,twist:0},
    {id:'cilindrica',archived:true,name:'Tambor',family:'calm',glyph:'▥',height:176,diameter:146,thickness:1.6,ribDepth:0.55,ribCount:26,twist:0},
    {id:'conica',archived:true,name:'Imperio',family:'calm',glyph:'▽',height:150,diameter:178,thickness:1.6,ribDepth:0.35,ribCount:22,twist:0},
  ];
  const FIELDS = [
    ['height','Altura pantalla','mm',80,280,1], ['diameter','Diámetro nominal','mm',110,280,1],
    ['thickness','Espesor','mm',1.2,3.5,0.1], ['ribDepth','Relieve','mm',0,3.5,0.1],
    ['ribCount','Estrías','',0,34,1], ['twist','Torsión','°',-8,8,1],
    ['clearance','Holgura radial de acople','mm',0.2,0.8,0.05],
    ['waist','Cintura','mm',-8,8,0.5], ['curvature','Curvatura','mm',-8,8,0.5],
  ];
  // Classic lamp silhouettes defined by piecewise cubic Bézier curves.
  // Each segment is [p0, p1, p2, p3] in normalized [height, radiusFactor].
  const SHAPE_PROFILES = {
    taller_top: {fullProfile:true,crownStart:1,curves:[[[0,0.9],[.33,.6],[.66,.6],[1,.9]]]},
    // Full-height cubic Bézier silhouettes, built for desktop lamps.
    // Mounting diameter is still fixed by the existing collar geometry.
    halo: {fullProfile:true,crownStart:0.78,curves:[
      [[0,0.36],[0.12,0.42],[0.12,0.86],[0.34,1.00]],
      [[0.34,1.00],[0.50,1.09],[0.66,1.07],[0.78,0.94]],
      [[0.78,0.94],[0.91,0.83],[1.00,0.26],[1.00,0]],
    ]},
    domo: {fullProfile:true,crownStart:0.87,curves:[
      [[0,0.38],[0.09,0.59],[0.19,0.94],[0.42,1.00]],
      [[0.42,1.00],[0.63,1.00],[0.77,0.88],[0.87,0.68]],
      [[0.87,0.68],[0.95,0.44],[1.00,0.14],[1.00,0]],
    ]},
    campana_atelier: {fullProfile:true,crownStart:0.84,curves:[
      [[0,0.38],[0.08,0.54],[0.16,0.99],[0.30,1.00]],
      [[0.30,1.00],[0.46,1.00],[0.66,0.72],[0.84,0.41]],
      [[0.84,0.41],[0.92,0.29],[1.00,0.13],[1.00,0]],
    ]},
    tambor_atelier: {fullProfile:true,crownStart:0.78,curves:[
      [[0,0.41],[0.05,0.80],[0.14,0.97],[0.22,1.00]],
      [[0.22,1.00],[0.45,1.01],[0.68,1.01],[0.78,0.98]],
      [[0.78,0.98],[0.91,0.93],[1.00,0.17],[1.00,0]],
    ]},
    globo: {crownStart:0.74,curves:[
      [[0.16,0.70],[0.18,0.84],[0.34,1.01],[0.52,1.00]],
      [[0.52,1.00],[0.61,0.99],[0.68,0.97],[0.74,0.95]],
    ]},
    organica: {crownStart:0.76,curves:[
      [[0.16,0.68],[0.20,0.74],[0.34,0.88],[0.50,0.97]],
      [[0.50,0.97],[0.60,1.00],[0.69,0.98],[0.76,0.95]],
    ]},
    hongo: {crownStart:0.60,curves:[
      [[0.16,0.78],[0.20,0.95],[0.30,1.04],[0.44,1.04]],
      [[0.44,1.04],[0.52,1.03],[0.57,0.98],[0.60,0.94]],
    ]},
    petalo: {crownStart:0.68,curves:[
      [[0.16,0.96],[0.24,0.98],[0.38,0.92],[0.52,0.82]],
      [[0.52,0.82],[0.58,0.79],[0.63,0.76],[0.68,0.73]],
    ]},
    cilindrica: {crownStart:0.78,curves:[
      [[0.16,0.86],[0.18,0.95],[0.22,0.99],[0.28,1.00]],
      [[0.28,1.00],[0.44,1.00],[0.62,1.00],[0.78,0.99]],
    ]},
    conica: {crownStart:0.72,curves:[
      [[0.16,1.00],[0.24,0.98],[0.40,0.90],[0.56,0.80]],
      [[0.56,0.80],[0.62,0.77],[0.67,0.74],[0.72,0.71]],
    ]},
  };
  const TALLER_TOP_PROFILE=[
    [0,65.599],[.03070,65.162],[.05702,64.776],[.08333,64.314],
    [.11842,62.366],[.14474,59.174],[.17105,55.630],[.19737,52.245],
    [.22368,49.188],[.25,46.203],[.27632,43.485],[.31140,40.531],
    [.33772,38.702],[.36404,37.127],[.39035,35.989],[.41667,35.115],
    [.44298,34.477],[.46930,34.056],[.49561,33.878],[.53070,34.018],
    [.55702,34.383],[.58333,35.044],[.60965,35.980],[.63596,37.099],
    [.66228,38.526],[.68860,40.370],[.72368,43.385],[.75,45.931],
    [.77632,48.817],[.80263,51.954],[.82895,55.408],[.85526,58.848],
    [.88158,61.955],[.91667,63.040],[.94298,63.008],[.96930,63.005],[1,65.599]
  ];
  const TALLER_TOP_ORIGINAL_HEIGHT=228.14266205;
  const TALLER_TOP_ORIGINAL_DIAMETER=131.19818116;
  const TALLER_MOUNT_INNER_RADIUS=35.04433221;
  const TALLER_MOUNT_ZONE_HEIGHT=14.17264533;
  const TALLER_MOUNT_FIXED_UNTIL=20;
  const TALLER_TOP_MODES=['original','open','flat','curved'];
  const SHADE_SEGMENTS=128, SHADE_LEVELS=100, BASE_SEGMENTS=256, TAU=2*Math.PI;
  const OPENING_RADIUS=40; // inner opening radius in mm; fixed shared shade/base interface
  const BASE_HEIGHT=12, SEAT_HEIGHT=9, SEAT_WALL=4, HOLE_RADIUS=3.5;
  const GROUND_GROOVE_DEPTH=3.2, GROUND_GROOVE_WIDTH=5.5;
  const defaultClearance=0.4;
  const BASE_PRESETS = [
    {id:'flat',name:'Taller Stand',author:'Usuario',type:'mesh',experimental:false,height:35.59607,diameter:131.19819,asset:'assets/stands/taller-stand.olmesh.gz',preview:'assets/stands/taller-stand-reference.png',filename:'openlamp-taller-stand.stl'},
    {id:'wibble',name:'Wibble Stand',author:'Abstractia Design',type:'mesh',height:199.37149,diameter:162.87946,asset:'assets/stands/wibble-stand.olmesh.gz',preview:'assets/stands/wibble-reference.webp',filename:'abstractia-wibble-original-stand.stl'},
  ];
  let state={...PRESETS[0],clearance:defaultClearance,surfaceIntensity:1,hardware:{type:'none'},shadeDesign:{family:'original',offsets:[0,0,0,0,0]}};
  let selectedBase='flat',standMeshes=new Map(),standPromises=new Map(),renderRequest=0;
  let meshes=null, reports=null, plotPrepared=false, pendingRender=0, viewMode='ensamblada';
  let lastShadeDimensions=null, mountAssembly=null;
  const byId=id=>document.getElementById(id);
  const clamp=(x,a,b)=>Math.max(a,Math.min(x,b));
  const smoothstep=x=>{const y=clamp(x,0,1);return y*y*(3-2*y);};
  const presetById=id=>PRESETS.find(p=>p.id===id);
  const basePresetById=id=>BASE_PRESETS.find(p=>p.id===id)||BASE_PRESETS[0];
  const currentBasePreset=()=>basePresetById(selectedBase);
  function fieldLimits(key,p,advanced=false){
    const field=FIELDS.find(f=>f[0]===key);
    if(!field)throw new Error('Parámetro desconocido: '+key);
    if(advanced || !(key in FAMILY[p.family]))return [field[3],field[4]];
    return FAMILY[p.family][key];
  }
  function sanitize(raw,{legacy=false}={}){
    const preset=presetById(raw.id);
    if(!preset)throw new Error('Perfil desconocido');
    const out={waist:0,curvature:0,...preset,clearance:defaultClearance};
    for(const [key] of FIELDS){
      const value=raw[key]===undefined?out[key]:raw[key];
      if(typeof value!=='number'||!Number.isFinite(value))throw new Error('Parámetro inválido: '+key);
      const [minimum,maximum]=fieldLimits(key,preset,true);
      // Preserve historical values for old projects, warning visibly in the editor.
      out[key]=legacy?value:clamp(value,minimum,maximum);
    }
    out.ribCount=Math.round(out.ribCount);
    out.topMode=TALLER_TOP_MODES.includes(raw.topMode)?raw.topMode:(preset.topMode||'curved');
    const intensity=Number(raw.surfaceIntensity??1);
    out.surfaceIntensity=Number.isFinite(intensity)?clamp(intensity,0.88,1.06):1;
    out.hardware=window.OpenLampCompatibility?.sanitizeHardware(raw.hardware)||{type:'none'};
    out.shadeDesign=window.OpenLampShade?.normalize(raw.shadeDesign)||{family:'original',offsets:[0,0,0,0,0]};
    if(window.OpenLampBasics?.shapeFor(out))out.basicOptions=window.OpenLampBasics.optionsFor({...out,basicOptions:raw.basicOptions});
    return out;
  }
  function bezierPoint(segment,u){
    const omt=1-u;
    const b0=omt*omt*omt,b1=3*omt*omt*u,b2=3*omt*u*u,b3=u*u*u;
    return [
      b0*segment[0][0]+b1*segment[1][0]+b2*segment[2][0]+b3*segment[3][0],
      b0*segment[0][1]+b1*segment[1][1]+b2*segment[2][1]+b3*segment[3][1],
    ];
  }
  function sampleBezierProfile(curves,resolution=72){
    const samples=[];
    curves.forEach((segment,index)=>{
      for(let i=0;i<=resolution;i++){
        if(index>0&&i===0)continue;
        samples.push(bezierPoint(segment,i/resolution));
      }
    });
    return samples;
  }
  for(const spec of Object.values(SHAPE_PROFILES))spec.samples=sampleBezierProfile(spec.curves);
  function interpolateSamples(samples,t){
    if(t<=samples[0][0])return samples[0][1];
    const last=samples[samples.length-1];
    if(t>=last[0])return last[1];
    let lo=0,hi=samples.length-1;
    while(hi-lo>1){
      const mid=(lo+hi)>>1;
      if(samples[mid][0]<t)lo=mid;else hi=mid;
    }
    const [x0,y0]=samples[lo],[x1,y1]=samples[hi];
    return y0+(y1-y0)*(t-x0)/(x1-x0||1);
  }
  function profile(t,id){
    if(id==='taller_top')return interpolateSamples(TALLER_TOP_PROFILE,t)/(TALLER_TOP_ORIGINAL_DIAMETER/2);
    const spec=SHAPE_PROFILES[id];
    if(!spec)throw new Error('Perfil inválido');
    return interpolateSamples(spec.samples,spec.fullProfile?t:Math.min(t,spec.crownStart));
  }
  function crownFactor(t,p){
    const spec=SHAPE_PROFILES[p.id];
    if(spec.fullProfile)return 1;
    const start=spec.crownStart;
    if(t<=start)return 1;
    const u=clamp((t-start)/(1-start),0,1);
    return Math.sqrt(Math.max(0,1-u*u));
  }
  function surfaceDetail(t,theta,p){
    if(p.ribCount===0||p.ribDepth<=0)return 0;
    const fadeStart=SHAPE_PROFILES[p.id].crownStart-0.08;
    const baseEnvelope=smoothstep((t-0.17)/0.18)*(1-smoothstep((t-fadeStart)/0.18));
    const phase=p.ribCount*theta+p.twist*Math.PI/180*t;
    const wave=(1+Math.cos(phase))*0.5;
    const shape=p.family==='soft'?Math.pow(wave,2.4):
      p.family==='petal'?0.35+0.65*Math.pow(wave,1.45):Math.pow(wave,1.15);
    const familyFactor=p.family==='soft'?0.6:(p.family==='petal'?0.9:0.75);
    return p.ribDepth*shape*baseEnvelope*familyFactor;
  }
  function outerRadius(t,theta,p){
    if(p.id==='taller_top')return tallerOuterRadius(t,theta,p);
    // Mechanical socket is untouched: Ø80 mm inner aperture on the underside.
    const collar=OPENING_RADIUS+p.thickness;
    const body=(p.diameter/2)*profile(t,p.id);
    const blend=smoothstep(t/(SHAPE_PROFILES[p.id].fullProfile?0.10:0.20));
    const radiused=collar+(body-collar)*blend;
    return Math.max(0,radiused*crownFactor(t,p)+surfaceDetail(t,theta,p));
  }
  function suggestedParams(id){const p=presetById(id);return {...p,clearance:state.clearance,surfaceIntensity:state.surfaceIntensity??1,hardware:state.hardware||{type:'none'},shadeDesign:{family:'original',offsets:[0,0,0,0,0]}};}
  function exceedsCurated(p){
    return ['ribDepth','ribCount','twist'].some(key=>{
      const [a,b]=fieldLimits(key,p);return p[key]<a||p[key]>b;
    });
  }
  function createMesh(positions,indices){
    return {positions:Float32Array.from(positions),indices:Uint32Array.from(indices),triangleCount:indices.length/3,vertexCount:positions.length/3};
  }

  // Mechanical mounting rim never scales with overall shade dimensions.
  function tallerHeightAt(t,p,bodyHeight){
    const threshold=TALLER_MOUNT_ZONE_HEIGHT/TALLER_TOP_ORIGINAL_HEIGHT;
    if(t<=threshold)return t*TALLER_TOP_ORIGINAL_HEIGHT;
    return TALLER_MOUNT_ZONE_HEIGHT+(bodyHeight-TALLER_MOUNT_ZONE_HEIGHT)*(t-threshold)/(1-threshold);
  }
  function tallerOuterRadius(t,theta,p){
    const original=interpolateSamples(TALLER_TOP_PROFILE,t);
    const sourceHeight=t*TALLER_TOP_ORIGINAL_HEIGHT;
    const blend=smoothstep((sourceHeight-TALLER_MOUNT_FIXED_UNTIL)/35);
    const scale=p.diameter/TALLER_TOP_ORIGINAL_DIAMETER;
    const amplitude=p.ribDepth*smoothstep((sourceHeight-TALLER_MOUNT_FIXED_UNTIL)/30)*(1-smoothstep((t-.88)/.12));
    const relief=p.ribCount>0?amplitude*.5*(1+Math.cos(theta*p.ribCount+p.twist*Math.PI/180*t)):0;
    return original*(1+(scale-1)*blend)+relief;
  }
  function buildTallerShade(p){
    const mode=TALLER_TOP_MODES.includes(p.topMode)?p.topMode:'open';
    const N=SHADE_SEGMENTS,domeRise=mode==='curved'?Math.min(27,p.height*.17):0;
    const bodyHeight=p.height-domeRise;
    if(bodyHeight<=TALLER_MOUNT_FIXED_UNTIL+20)throw new Error('Altura insuficiente');
    const rings=[];
    for(let k=0;k<=SHADE_LEVELS;k++){
      const t=k/SHADE_LEVELS;
      rings.push({t,z:tallerHeightAt(t,p,bodyHeight)});
    }
    if(mode==='curved'){
      const outerR=tallerOuterRadius(1,0,p);
      for(let k=1;k<=18;k++){
        const phi=k*Math.PI/2/19;
        rings.push({t:1,cap:true,z:bodyHeight+domeRise*Math.sin(phi),capScale:Math.cos(phi),outerR});
      }
    }
    const R=rings.length,I=[];
    const out=(q,j)=>q*N+(j+N)%N,inn=(q,j)=>R*N+out(q,j);
    const positions=new Float32Array((2*R*N+(mode==='open'?0:2))*3);
    const place=(idx,r,theta,z)=>{
      const at=3*idx;positions[at]=r*Math.cos(theta);positions[at+1]=r*Math.sin(theta);positions[at+2]=z;
    };
    for(let q=0;q<R;q++){
      const ring=rings[q];
      for(let j=0;j<N;j++){
        const angle=j*TAU/N;
        const outerR=ring.cap?ring.outerR*ring.capScale:tallerOuterRadius(ring.t,angle,p);
        const innerR=q===0?TALLER_MOUNT_INNER_RADIUS:Math.max(.01,outerR-p.thickness);
        const innerZ=mode!=='open'&&q===R-1?ring.z-p.thickness:ring.z;
        place(out(q,j),outerR,angle,ring.z);
        place(inn(q,j),innerR,angle,innerZ);
      }
    }
    const tri=(a,b,c)=>I.push(a,b,c);
    for(let q=0;q<R-1;q++)for(let j=0;j<N;j++){
      const a=out(q,j),b=out(q,j+1),c=out(q+1,j),d=out(q+1,j+1);
      tri(a,b,c);tri(b,d,c);
      const ai=inn(q,j),bi=inn(q,j+1),ci=inn(q+1,j),di=inn(q+1,j+1);
      tri(ai,ci,bi);tri(bi,ci,di);
    }
    for(let j=0;j<N;j++){
      tri(out(0,j),inn(0,j),out(0,j+1));
      tri(out(0,j+1),inn(0,j),inn(0,j+1));
    }
    if(mode==='open'){
      const q=R-1;
      for(let j=0;j<N;j++){
        tri(out(q,j),out(q,j+1),inn(q,j));
        tri(out(q,j+1),inn(q,j+1),inn(q,j));
      }
    }else{
      const outerTip=R*N*2,innerTip=outerTip+1,q=R-1;
      positions.set([0,0,p.height],outerTip*3);
      positions.set([0,0,p.height-p.thickness],innerTip*3);
      for(let j=0;j<N;j++){
        tri(out(q,j),out(q,j+1),outerTip);
        tri(inn(q,j),innerTip,inn(q,j+1));
      }
    }
    return {positions,indices:Uint32Array.from(I),triangleCount:I.length/3,vertexCount:positions.length/3};
  }
  function buildShade(p){
    if(window.OpenLampBasics?.shapeFor(p))return window.OpenLampBasics.build(p);
    if(p.id==='taller_top')return buildTallerShade(p);
    const N=SHADE_SEGMENTS,L=SHADE_LEVELS,ringCount=L*N;
    const verts=new Float32Array((2*ringCount+2)*3),indices=[];
    const outer=(k,j)=>k*N+(j+N)%N;
    const inner=(k,j)=>ringCount+outer(k,j);
    const outsideTip=2*ringCount,insideTip=2*ringCount+1;
    const tri=(a,b,c)=>indices.push(a,b,c);
    const setPos=(idx,r,theta,z)=>{const at=idx*3;verts[at]=r*Math.cos(theta);verts[at+1]=r*Math.sin(theta);verts[at+2]=z;};
    for(let k=0;k<L;k++){
      const t=k/L,z=t*p.height;
      for(let j=0;j<N;j++){
        const theta=j*TAU/N;
        const radius=outerRadius(t,theta,p);
        const eps=0.00035;
        const slope=(outerRadius(Math.min(0.999999,t+eps),theta,p)-outerRadius(Math.max(0,t-eps),theta,p))/(p.height*(Math.min(0.999999,t+eps)-Math.max(0,t-eps)));
        const denom=Math.hypot(1,slope);
        const radialThickness=p.thickness/denom;
        // Avoid collapse: near the apex wall thickness shifts into Z instead of radius.
        const innerR=Math.max(0.001,radius-radialThickness);
        const innerZ=z+p.thickness*slope/denom;
        setPos(outer(k,j),radius,theta,z);
        setPos(inner(k,j),innerR,theta,innerZ);
      }
    }
    verts.set([0,0,p.height],outsideTip*3);
    verts.set([0,0,p.height-p.thickness],insideTip*3);
    for(let k=0;k<L-1;k++)for(let j=0;j<N;j++){
      const a=outer(k,j),b=outer(k,j+1),c=outer(k+1,j),d=outer(k+1,j+1);
      tri(a,b,c);tri(b,d,c);
      const ia=inner(k,j),ib=inner(k,j+1),ic=inner(k+1,j),id=inner(k+1,j+1);
      tri(ia,ic,ib);tri(ib,ic,id);
    }
    for(let j=0;j<N;j++){
      // Bottom annulus, downward-facing: the cavity stays OPEN but the wall is a solid.
      tri(outer(0,j),inner(0,j),outer(0,j+1));
      tri(outer(0,j+1),inner(0,j),inner(0,j+1));
      // The two apex fans give a CLOSED, ROUNDED top with physical thickness.
      tri(outer(L-1,j),outer(L-1,j+1),outsideTip);
      tri(inner(L-1,j),insideTip,inner(L-1,j+1));
    }
    return {positions:verts,indices:Uint32Array.from(indices),triangleCount:indices.length/3,vertexCount:verts.length/3};
  }
  // Imported mesh retains every source vertex and triangle; z was translated
  // so the stand rests on z=0. The source file is supplied under separate permission.
  function parseStandMesh(buffer){
    if(buffer.byteLength<12)throw new Error('Archivo de stand incompleto');
    const view=new DataView(buffer);
    if(view.getUint32(0,true)!==0x314d4c4f)throw new Error('Formato del stand desconocido'); // 'OLM1'
    const nVerts=view.getUint32(4,true),nFaces=view.getUint32(8,true);
    if(nVerts===0||nVerts>500000||nFaces===0||nFaces>800000)throw new Error('Tamaño de malla inválido');
    if(buffer.byteLength!==12+12*nVerts+12*nFaces)throw new Error('Longitud de malla incorrecta');
    const positions=new Float32Array(buffer.slice(12,12+12*nVerts));
    const indices=new Uint32Array(buffer.slice(12+12*nVerts));
    for(const index of indices)if(index>=nVerts)throw new Error('Índice fuera de rango');
    return {positions,indices,triangleCount:nFaces,vertexCount:nVerts};
  }
  // OBJ files often contain separate vertices with IDENTICAL positions to support
  // hard-edge normals. Weld by exact Float32 coordinates (no rounding, smoothing,
  // movement, face deletion, triangulation, or change to the visible surface).
  // This makes the source's shared edges topologically connected for STL.
  function weldCoincidentVertices(mesh){
    const source=mesh.positions,faces=mesh.indices;
    const lookup=new Map(),unique=[],remap=new Uint32Array(mesh.vertexCount);
    for(let v=0;v<mesh.vertexCount;v++){
      const at=3*v,x=source[at],y=source[at+1],z=source[at+2];
      if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z))throw new Error('Coordenadas no válidas');
      const key=x+','+y+','+z;
      let index=lookup.get(key);
      if(index===undefined){
        index=unique.length/3;
        unique.push(x,y,z);
        lookup.set(key,index);
      }
      remap[v]=index;
    }
    const indices=new Uint32Array(faces.length);
    for(let i=0;i<faces.length;i++)indices[i]=remap[faces[i]];
    return {positions:Float32Array.from(unique),indices,
      triangleCount:mesh.triangleCount,vertexCount:unique.length/3};
  }
  // Source OBJ geometry only: original face indices and vertex order, no reconstruction.
  const ORIGINAL_SHADE_PARTS=19;
  const ORIGINAL_SHADE_SHA256='3c49c7f36ac77d74e74e4c624250540fa2e7f9305f908fd6eacbfd64b1421e7a';
  const ORIGINAL_SHADE_VERTICES=342396,ORIGINAL_SHADE_FACES=684792;
  const ORIGINAL_SHADE_BASE_OFFSET=102.31434631;
  const ORIGINAL_SHADE_Z_MIN=-80.89092255;
  let originalShade=null,originalShadePromise=null;
  async function loadOriginalShade(){
    if(originalShade)return originalShade;
    if(!originalShadePromise){
      originalShadePromise=(async()=>{
        if(typeof DecompressionStream!=='function')throw new Error('Se requiere soporte gzip');
        const urls=Array.from({length:ORIGINAL_SHADE_PARTS},(_,i)=>
          'assets/shades/tallertop-original.olmesh.gz.part-'+String(i).padStart(2,'0'));
        const parts=await Promise.all(urls.map(async url=>{
          const r=await fetch(url);
          if(!r.ok)throw new Error('Falta una parte del OBJ original: '+url);
          return r.arrayBuffer();
        }));
        const compressed=await new Blob(parts).arrayBuffer();
        if(typeof crypto!=='undefined' && crypto.subtle){
          const digest=await crypto.subtle.digest('SHA-256',compressed);
          const hex=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
          if(hex!==ORIGINAL_SHADE_SHA256)throw new Error('Error de integridad del OBJ original');
        }
        const raw=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        const mesh=parseStandMesh(raw);
        if(mesh.vertexCount!==ORIGINAL_SHADE_VERTICES||mesh.triangleCount!==ORIGINAL_SHADE_FACES)
          throw new Error('No coincide la geometría original');
        originalShade=mesh;
        if(typeof document!=='undefined'&&window.OpenLampShade){
          document.dispatchEvent(new CustomEvent('openlamp:shade-source',{detail:{
            envelope:window.OpenLampShade.extractEnvelope(mesh,ORIGINAL_SHADE_Z_MIN,ORIGINAL_SHADE_Z_MAX)}}));
        }
        return mesh;
      })().catch(e=>{originalShadePromise=null;throw e;});
    }
    return originalShadePromise;
  }
  // Deformation always starts with the original, never the previous output.
  // The lowest 20 mm of CAD coordinates are bitwise unchanged.
  const ORIGINAL_SHADE_Z_MAX=147.25173950;
  const ORIGINAL_SHADE_HEIGHT=ORIGINAL_SHADE_Z_MAX-ORIGINAL_SHADE_Z_MIN;
  const DEFORMATION_LOCK_END=ORIGINAL_SHADE_Z_MIN+20;
  const DEFORMATION_BLEND_END=DEFORMATION_LOCK_END+35;
  function originalParameterState(p){
    return Math.abs(p.height-ORIGINAL_SHADE_HEIGHT)<0.001 && Math.abs(p.diameter-131.198182)<0.001 &&
      (p.waist||0)===0 && (p.curvature||0)===0 && (p.surfaceIntensity??1)===1 &&
      (!p.shadeDesign||p.shadeDesign.family==='original');
  }
  // Compute the radial envelope of the original OBJ once. Keep mesh indices and
  // vertex coordinates unchanged at intensity=1. This is not a new rib generator.
  const surfaceReferenceCache=new WeakMap();
  function surfaceReference(source){
    if(surfaceReferenceCache.has(source))return surfaceReferenceCache.get(source);
    const P=source.positions,step=1.5,buckets=Math.ceil(ORIGINAL_SHADE_HEIGHT/step)+2;
    const sum=new Float64Array(buckets),count=new Uint32Array(buckets);
    for(let i=0;i<P.length;i+=3){
      const bin=clamp(Math.floor((P[i+2]-ORIGINAL_SHADE_Z_MIN)/step),0,buckets-1);
      sum[bin]+=Math.hypot(P[i],P[i+1]);count[bin]++;
    }
    const avg=new Float32Array(buckets);
    for(let b=0;b<buckets;b++)avg[b]=count[b]?sum[b]/count[b]:0;
    surfaceReferenceCache.set(source,{avg,step});
    return {avg,step};
  }
  function deformOriginalShade(source,p){
    if(originalParameterState(p))return source;
    const h=Number(p.height),d=Number(p.diameter),waist=Number(p.waist||0),curve=Number(p.curvature||0);
    const intensity=Number(p.surfaceIntensity??1),surface=surfaceReference(source);
    const design=p.shadeDesign||{family:'original',offsets:[0,0,0,0,0]};
    const designCurve=window.OpenLampShade?.makeCurve(design);
    if(design.family!=='original'&&window.OpenLampShade){
      const report=window.OpenLampShade.validateShape(design,h,d);
      if(!report.ok)throw new Error('Perfil fuera de familia: '+report.problems.join(', '));
    }
    if(![h,d,waist,curve,intensity].every(Number.isFinite)||intensity<0.88||intensity>1.06||h<195||h>265.2||d<131.198182||d>175.2||
      Math.abs(waist)>8||Math.abs(curve)>8)throw new Error('Parámetros fuera de límites seguros');
    const base=source.positions,out=new Float32Array(base.length);
    const dh=h-ORIGINAL_SHADE_HEIGHT,dd=d-131.198182;
    const usable=ORIGINAL_SHADE_Z_MAX-DEFORMATION_LOCK_END;
    for(let i=0;i<base.length;i+=3){
      const x=base[i],y=base[i+1],z=base[i+2];
      if(z<=DEFORMATION_LOCK_END){
        out[i]=x;out[i+1]=y;out[i+2]=z;continue;
      }
      const t=clamp((z-DEFORMATION_LOCK_END)/usable,0,1);
      const blend=smoothstep((z-DEFORMATION_LOCK_END)/(DEFORMATION_BLEND_END-DEFORMATION_LOCK_END));
      // Radial scaling retains sculptural ribs as part of the ORIGINAL indexed mesh.
      // Width parameter changes the body but not the oversized original bottom skirt.
      const width=dd*t*0.5;
      const waistDelta=waist*t*Math.exp(-Math.pow((t-0.50)/0.22,2));
      const curveDelta=curve*t*Math.sin(2*Math.PI*t);
      const radius=Math.hypot(x,y);
      const bin=clamp(Math.floor((z-ORIGINAL_SHADE_Z_MIN)/surface.step),0,surface.avg.length-1);
      const detail=(radius-surface.avg[bin])*(intensity-1)*
        smoothstep((z-DEFORMATION_LOCK_END)/30);
      const profileDelta=designCurve&&design.family!=='original'?designCurve(t)*blend:0;
      const offset=width+waistDelta+curveDelta+detail+profileDelta;
      const factor=radius>0.001?Math.max(0.15,(radius+offset)/radius):1;
      out[i]=x*factor;out[i+1]=y*factor;out[i+2]=z+dh*t;
    }
    return {positions:out,indices:source.indices,triangleCount:source.triangleCount,vertexCount:source.vertexCount};
  }
  // This radial displacement and monotonic Z transform are injective in
  // cylindrical coordinates: r' = r + delta(z), z' = g(z), g'(z)>0.
  // Face normals CAN rotate >90° when curvature changes; comparing normal
  // vectors would falsely reject valid bends. Verify unchanged topology,
  // locked mount, finite vertices, triangle area, and signed volume instead.
  function validateOriginalDeformation(source,deformed){
    if(source===deformed)return {ok:true,source:'Original SHA-256'};
    if(deformed.indices!==source.indices||deformed.positions.length!==source.positions.length)
      return {ok:false,reason:'Topology changed'};
    const orig=source.positions,P=deformed.positions,I=deformed.indices;
    let errors=0,degenerate=0,volume=0;
    for(let i=0;i<P.length;i+=3){
      if(!Number.isFinite(P[i])||!Number.isFinite(P[i+1])||!Number.isFinite(P[i+2]))errors++;
      if(orig[i+2]<=DEFORMATION_LOCK_END &&
        (orig[i]!==P[i]||orig[i+1]!==P[i+1]||orig[i+2]!==P[i+2]))errors++;
    }
    for(let k=0;k<I.length;k+=3){
      const a=3*I[k],b=3*I[k+1],c=3*I[k+2];
      const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2];
      const vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
      const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
      if(Math.hypot(nx,ny,nz)<1e-8)degenerate++;
      volume+=(P[a]*nx+P[a+1]*ny+P[a+2]*nz)/6;
    }
    return {ok:errors===0&&degenerate===0&&volume>0,errors,degenerate,volume};
  }
  // Independent removable closure: no change to the original mesh topology.
  // A cylindrical locating ring fits inside the existing upper opening.
  function buildTopCap(shade,mode){
    if(mode==='original'||mode==='open')return null;
    if(mode!=='flat'&&mode!=='curved')throw new Error('Cierre inválido');
    const P=shade.positions;let zTop=-Infinity;
    for(let i=2;i<P.length;i+=3)zTop=Math.max(zTop,P[i]);
    let inner=Infinity,outer=0;
    for(let i=0;i<P.length;i+=3){
      if(Math.abs(P[i+2]-zTop)>0.001)continue;
      const r=Math.hypot(P[i],P[i+1]);
      inner=Math.min(inner,r);outer=Math.max(outer,r);
    }
    if(!Number.isFinite(inner)||inner<8||outer<inner)throw new Error('Borde superior inválido');
    const pegOuter=inner-0.45,pegInner=pegOuter-1.8,flangeOuter=outer+1.2;
    if(pegInner<5)throw new Error('Sin lugar para aro de fijación');
    const bottom=zTop-3.2,under=zTop+0.35,top=zTop+2.6;
    const outline=[
      [0.01,under],[pegInner,under],[pegInner,bottom],[pegOuter,bottom],
      [pegOuter,under],[flangeOuter,under],[flangeOuter,top],
    ];
    if(mode==='curved'){
      for(let i=1;i<=22;i++){
        const fraction=i/22,rad=flangeOuter*(1-fraction);
        outline.push([Math.max(0.01,rad),top+16*(fraction*fraction*(3-2*fraction))]);
      }
    } else outline.push([0.01,top]);
    const n=128,vertices=[],indices=[],idx=(q,j)=>q*n+j;
    for(const [r,z] of outline)for(let j=0;j<n;j++){
      const a=TAU*j/n;vertices.push(r*Math.cos(a),r*Math.sin(a),z);
    }
    for(let q=0;q<outline.length-1;q++)for(let j=0;j<n;j++){
      const k=(j+1)%n,a=idx(q,j),b=idx(q,k),c=idx(q+1,j),d=idx(q+1,k);
      indices.push(a,b,c,b,d,c);
    }
    // Seal both ~zero-radius tips with fans (do not create zero-area triangles).
    // The first/last rings have a nonzero 0.01-mm radius.
    const lowerTip=vertices.length/3;vertices.push(0,0,under);
    const upperTip=vertices.length/3;vertices.push(0,0,outline[outline.length-1][1]);
    for(let j=0;j<n;j++){
      const k=(j+1)%n;
      indices.push(idx(0,j),lowerTip,idx(0,k));
      indices.push(idx(outline.length-1,j),idx(outline.length-1,k),upperTip);
    }
    const cap=createMesh(vertices,indices);
    const check=validate(cap);
    if(!check.ok)throw new Error('La tapa no supera validación: '+JSON.stringify(check));
    return cap;
  }
  async function loadStand(id=selectedBase){
    const preset=basePresetById(id);
    if(standMeshes.has(id))return standMeshes.get(id);
    if(!standPromises.has(id)){
      const task=(async()=>{
        if(typeof DecompressionStream!=='function')throw new Error('Este navegador no admite descompresión gzip');
        const response=await fetch(preset.asset);
        if(!response.ok||!response.body)throw new Error('No se pudo cargar '+preset.name+' (HTTP '+response.status+')');
        const raw=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        const source=parseStandMesh(raw);
        const mesh=id==='flat'?weldCoincidentVertices(source):source;
        const report=validate(mesh);
        if(!report.ok)throw new Error('Malla inválida: '+preset.name+'; '+JSON.stringify(report));
        standMeshes.set(id,mesh);
        return mesh;
      })().catch(e=>{standPromises.delete(id);throw e;});
      standPromises.set(id,task);
    }
    return standPromises.get(id);
  }
  function baseHeight(){return currentBasePreset().height;}
  function baseDiameter(){return currentBasePreset().diameter;}
  function shadeElevation(){
    if(window.OpenLampBasics?.shapeFor(state))return mountAssembly?.baseId===selectedBase?mountAssembly.shadeBottom:baseHeight()-window.OpenLampBasics.INSERTION;
    if(state.id==='tallertop_original')return selectedBase==='flat'?ORIGINAL_SHADE_BASE_OFFSET:baseHeight()-ORIGINAL_SHADE_Z_MIN;
    return baseHeight()-(selectedBase==='flat'&&state.id==='taller_top'?TALLER_MOUNT_ZONE_HEIGHT:0);
  }
  function channelBottom(r,theta){
    // Open underside radial cable channel: only a geometric provision, not rated strain relief.
    const x=r*Math.cos(theta),y=r*Math.sin(theta);
    if(x<0)return 0;
    const across=1-smoothstep((Math.abs(y)-GROUND_GROOVE_WIDTH/2)/1.9);
    return GROUND_GROOVE_DEPTH*across*smoothstep((x+1.5)/3);
  }
  function buildBase(p){
    const N=BASE_SEGMENTS;
    const outerSeat=OPENING_RADIUS-p.clearance;
    const innerSeat=outerSeat-SEAT_WALL;
    const baseRadius=Math.max(62,p.diameter*0.43);
    // Closed radial profile of a low round foot with raised annular receiving seat.
    // Top has a central cable passage; underside has an open groove to the edge.
    const contour=[
      [HOLE_RADIUS,BASE_HEIGHT], [12,BASE_HEIGHT], [25,BASE_HEIGHT],
      [innerSeat,BASE_HEIGHT], [innerSeat,BASE_HEIGHT+SEAT_HEIGHT],
      [outerSeat,BASE_HEIGHT+SEAT_HEIGHT], [outerSeat,BASE_HEIGHT],
      [(outerSeat+baseRadius)*0.5,BASE_HEIGHT], [baseRadius,BASE_HEIGHT],
      [baseRadius,0,true], [baseRadius*0.77,0,true],
      [baseRadius*0.53,0,true], [baseRadius*0.28,0,true],
      [12,0,true], [HOLE_RADIUS,0,true],
    ];
    const P=[],I=[];
    const idx=(r,j)=>r*N+(j+N)%N;
    for(const [r,z,g] of contour)for(let j=0;j<N;j++){
      const theta=j*TAU/N;
      P.push(r*Math.cos(theta),r*Math.sin(theta),g?channelBottom(r,theta):z);
    }
    for(let k=0;k<contour.length;k++){
      const nk=(k+1)%contour.length;
      for(let j=0;j<N;j++){
        const a=idx(k,j),b=idx(k,j+1),c=idx(nk,j),d=idx(nk,j+1);
        // Profile follows clockwise outline in (radius,Z) plane; reverse turn to face out.
        I.push(a,c,b,b,c,d);
      }
    }
    return createMesh(P,I);
  }
  function validate(m){
    const {positions:P,indices:I}=m;
    const edges=new Map();let volume=0,degenerate=0,finite=true;
    for(const value of P)if(!Number.isFinite(value)){finite=false;break;}
    for(let k=0;k<I.length;k+=3){
      const a=I[k],b=I[k+1],c=I[k+2];
      const ax=P[a*3],ay=P[a*3+1],az=P[a*3+2],bx=P[b*3],by=P[b*3+1],bz=P[b*3+2],cx=P[c*3],cy=P[c*3+1],cz=P[c*3+2];
      const u=[bx-ax,by-ay,bz-az],v=[cx-ax,cy-ay,cz-az];
      if(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])<1e-8)degenerate++;
      volume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
      for(const [i,j] of [[a,b],[b,c],[c,a]]){const e=i<j?`${i},${j}`:`${j},${i}`;const item=edges.get(e)||[0,0];item[0]++;item[1]+=i<j?1:-1;edges.set(e,item);}
    }
    let badEdges=0,wrongWinding=0;
    for(const [n,w] of edges.values()){if(n!==2)badEdges++;if(w!==0)wrongWinding++;}
    return{ok:finite&&degenerate===0&&badEdges===0&&wrongWinding===0&&volume>0,finite,degenerate,badEdges,wrongWinding,volume};
  }
  function stlBinary(m){
    const {positions:P,indices:I}=m,buffer=new ArrayBuffer(84+m.triangleCount*50),dv=new DataView(buffer);
    const header='OpenLamp Studio experimental STL - units mm';
    for(let j=0;j<header.length&&j<80;j++)dv.setUint8(j,header.charCodeAt(j));
    dv.setUint32(80,m.triangleCount,true);let pos=84;
    const put=v=>{dv.setFloat32(pos,v,true);pos+=4;};
    for(let k=0;k<I.length;k+=3){
      const a=I[k]*3,b=I[k+1]*3,c=I[k+2]*3,ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
      let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const len=Math.hypot(nx,ny,nz)||1;
      put(nx/len);put(ny/len);put(nz/len);
      for(const at of [a,b,c]){put(P[at]);put(P[at+1]);put(P[at+2]);}
      dv.setUint16(pos,0,true);pos+=2;
    }
    return buffer;
  }
  function fileDownload(data,name,type){
    const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function makeTrace(m,color,zShift=0){
    const P=m.positions,I=m.indices,x=[],y=[],z=[];
    for(let a=0;a<P.length;a+=3){x.push(P[a]);y.push(P[a+1]);z.push(P[a+2]+zShift);}
    const i=[],j=[],k=[];
    for(let a=0;a<I.length;a+=3){i.push(I[a]);j.push(I[a+1]);k.push(I[a+2]);}
    return{type:'mesh3d',x,y,z,i,j,k,flatshading:false,opacity:1,color,
      lighting:{ambient:.72,diffuse:.66,specular:.07,roughness:.93,fresnel:.02},
      lightposition:{x:-700,y:460,z:1250},hoverinfo:'skip'};
  }
  function fallback2D() {
    if(state.id==='tallertop_original'){
      byId('viewer').innerHTML='<div class="wibble-fallback"><strong>Taller Top · malla OBJ con 684.792 triángulos</strong><p>Se requiere WebGL para visualizar las deformaciones. La exportación STL conserva las caras originales.</p></div>';
      const hint=document.querySelector('.view-help');if(hint)hint.textContent='WebGL no disponible';
      plotPrepared=false;return Promise.resolve();
    }
    // Explicit, non-interactive 2D profile preview when WebGL is unavailable.
    const help=document.querySelector('.view-help');if(help)help.textContent='Vista lateral esquemática · Interacción 3D no disponible';
    const area=byId('viewer'),w=Math.max(400,area.clientWidth||800),h=Math.max(360,area.clientHeight||580);
    const maxR=Math.max(62,state.diameter*.51,state.diameter*.43,(baseDiameter()||0)/2);
    const vertical=state.height+shadeElevation()+(viewMode==='separada'?27:0);
    const scale=Math.min((w-95)/(2*maxR),(h-85)/vertical);
    const cx=w/2,ground=h-45,screenOffset=shadeElevation()+(viewMode==='separada'?27:0);
    const xx=r=>(cx+r*scale).toFixed(1), yy=z=>(ground-z*scale).toFixed(1);
    const radius=(t,a)=>window.OpenLampBasics?.shapeFor(state)?window.OpenLampBasics.radiusAt(t,state):outerRadius(t,a,state);
    let outline=`M ${xx(0)} ${yy(screenOffset+state.height)}`;
    for(let k=99;k>=0;k--){const t=k/100;outline+=` L ${xx(radius(t,0))} ${yy(screenOffset+t*state.height)}`;}
    outline+=` L ${xx(-radius(0,0))} ${yy(screenOffset)}`;
    for(let k=1;k<=99;k++){const t=k/100;outline+=` L ${xx(-radius(t,Math.PI))} ${yy(screenOffset+t*state.height)}`;}
    outline+=' Z';
    const br=Math.max(62,state.diameter*.43),footTop=yy(BASE_HEIGHT),footBottom=yy(0);
    const bp=currentBasePreset(),isWibble=bp.id==='wibble';
    const guide='Montaje no verificado';
    if(bp.type==='mesh'){
      area.innerHTML=`<div class="wibble-fallback"><img src="${bp.preview}" alt="Vista de referencia de ${bp.name}"><p>Referencia visual · Montaje no verificado</p></div>`;
      byId('status').textContent=bp.experimental?'Base OBJ experimental · Vista 3D no disponible':'Stand original · Vista 3D no disponible';
      plotPrepared=false;
      return Promise.resolve();
    }
    area.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Vista esquemática 2D de lámpara con pantalla cerrada arriba y base" style="width:100%;height:100%;display:block">
      <defs><linearGradient id="ol-surface" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a18e73"/><stop offset=".5" stop-color="#eddfc6"/><stop offset="1" stop-color="#b6a383"/></linearGradient></defs>
      <ellipse cx="${cx}" cy="${footBottom}" rx="${br*scale}" ry="${7*scale}" fill="#585d54" opacity=".14"/>
      <rect x="${xx(-br)}" y="${footTop}" width="${2*br*scale}" height="${BASE_HEIGHT*scale}" rx="4" fill="#777d71" stroke="#60695c" stroke-width="1.5"/>
      <rect x="${xx(-(OPENING_RADIUS-state.clearance))}" y="${yy(BASE_HEIGHT+SEAT_HEIGHT)}" width="${2*(OPENING_RADIUS-state.clearance)*scale}" height="${SEAT_HEIGHT*scale}" rx="4" fill="#80867a"/>
      <path d="${outline}" fill="url(#ol-surface)" stroke="#917e65" stroke-width="1.7"/>
      <text x="${cx}" y="27" fill="#657363" text-anchor="middle" font-size="13">Vista 2D de respaldo · WebGL no disponible</text>
      <text x="${cx}" y="${h-14}" fill="#879187" text-anchor="middle" font-size="11">${guide} · La geometría STL es independiente del visor</text>
    </svg>`;
    byId('status').textContent='2 STL verificados · Vista 2D (WebGL no disponible)';
    plotPrepared=false;
    return Promise.resolve();
  }
  function plotMeshes(all){
    let gl=false;try{const c=document.createElement('canvas');gl=Boolean(c.getContext('webgl')||c.getContext('webgl2'));}catch(e){gl=false;}
    if(!gl||typeof Plotly==='undefined')return fallback2D();
    const exploded=viewMode==='separada';
    const dz=shadeElevation()+(exploded?27:0);
    const traces=[makeTrace(all.base,'#bb765f'),makeTrace(all.shade,'#e7d6bc',dz)];
    if(all.cap)traces.push(makeTrace(all.cap,'#ddceb3',dz+(exploded?18:0)));
    const layout={paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',margin:{t:0,b:0,l:0,r:0},showlegend:false,uirevision:'orbit',
      scene:{xaxis:{visible:false},yaxis:{visible:false},zaxis:{visible:false},aspectmode:'data',camera:{eye:{x:1.4,y:1.7,z:1.13}},bgcolor:'rgba(0,0,0,0)'},dragmode:'turntable'};
    const opts={responsive:true,displaylogo:false,displayModeBar:false,scrollZoom:true};
    const help=document.querySelector('.view-help');if(help)help.textContent='Arrastrar para rotar · Rueda para zoom';
    const operation=plotPrepared?Plotly.react:Plotly.newPlot;
    return operation(byId('viewer'),traces,layout,opts).then(()=>{plotPrepared=true;});
  }
  const timer=()=>{clearTimeout(pendingRender);pendingRender=setTimeout(render,170);};
  function refreshControls(){
    const exact=state.id==='tallertop_original',basic=!!window.OpenLampBasics?.shapeFor(state);
    byId('controls').hidden=false;
    const actions=document.querySelector('.design-actions');if(actions)actions.hidden=!(exact||basic);
    const term=byId('top-mode').closest('.control');if(term)term.hidden=!(exact||basic);
    const adv=byId('advanced-design')?.closest('label');if(adv)adv.hidden=basic;
    const notice=byId('original-notice');if(notice)notice.hidden=true;
    for(const [key,label,unit,min,max] of FIELDS){
      const input=byId('in-'+key);
      let [lo,hi]=fieldLimits(key,state,byId('advanced-design').checked);
      // Historical projects remain editable without silently discarding values.
      lo=Math.min(lo,state[key]);hi=Math.max(hi,state[key]);
      const family=state.shadeDesign?.family||'original';
      const limits=window.OpenLampShade?.families[family];
      if(basic&&key==='height'){lo=90;hi=270;input.step='1';}
      if(basic&&key==='diameter'){lo=Math.max(110,Math.ceil(window.OpenLampBasics.minimumDiameter(state)));hi=220;input.step='1';}
      if(exact&&key==='height'){lo=limits?limits.height[0]:195.142662;hi=limits?limits.height[1]:265.142662;input.step='1';}
      if(exact&&key==='diameter'){lo=limits?limits.diameter[0]:131.198182;hi=limits?limits.diameter[1]:175.198182;input.step='0.5';}
      input.min=lo;input.max=hi;input.value=state[key];
      const display=exact&&['height','diameter'].includes(key)?state[key].toFixed(2).replace('.',','):state[key].toLocaleString('es-AR');
      byId('out-'+key).textContent=display+(unit?` ${unit}`:'');
    }
    document.querySelectorAll('.preset').forEach(el=>{el.classList.toggle('active',el.dataset.id===state.id);el.setAttribute('aria-pressed',String(el.dataset.id===state.id));});
    const preset=presetById(state.id);
    document.querySelectorAll('.base-preset').forEach(btn=>{
      const active=btn.dataset.base===selectedBase;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
    });
    const bp=currentBasePreset();
    byId('mount-warning').hidden=false;
    byId('mount-warning').textContent=bp.id==='flat'
      ? 'Taller Stand: socket interno oculto bajo la pantalla, sin cuello exterior. Holgura CAD radial nominal de 0,164 mm; ajuste físico pendiente.'
      : 'Wibble Stand: la pantalla integra su propio apoyo anular interno sobre los cuatro extremos originales. Sin pieza intermedia; apoyo CAD sujeto a prueba física.';
    byId('download-base').textContent='STL '+bp.name+' ↗';
    byId('current-name').textContent=exact&&!originalParameterState(state)?'Taller Top · Paramétrico':preset.name;
    byId('current-family').textContent=FAMILY[preset.family].label;
    byId('curated-warning').hidden=!exceedsCurated(state);
    byId('top-mode').value=state.topMode==='open'?'original':(TALLER_TOP_MODES.includes(state.topMode)?state.topMode:'original');
    for(const key of ['thickness','ribDepth','ribCount','twist','clearance']){
      const parent=byId('in-'+key)?.closest('.control');if(parent)parent.hidden=exact||(basic&&key!=='thickness');
    }
    for(const key of ['height','diameter','waist','curvature']){
      const parent=byId('in-'+key)?.closest('.control');
      if(parent)parent.hidden=basic?['waist','curvature'].includes(key):!exact||(['waist','curvature'].includes(key)&&state.shadeDesign?.family!=='original');
    }
    for(const el of document.querySelectorAll('.view-mode'))el.classList.toggle('active',el.dataset.view===viewMode);
  }
  async function render(){
    for(const id of ['download-shade','download-base','download-cap'])byId(id).disabled=true;
    const requestId=++renderRequest;
    byId('status').textContent='Generando pantalla y base…';
    try{
      const exact=state.id==='tallertop_original';
      const basic=!!window.OpenLampBasics?.shapeFor(state);
      const bp=currentBasePreset(),base=await loadStand(bp.id);
      if(requestId!==renderRequest)return;
      const mount=basic&&window.OpenLampMounts?
        window.OpenLampMounts.mountFor(bp.id,base):null;
      // The base controls the INSIDE of Shade. Wibble does not generate a
      // third solid, bridge, connector or hidden export.
      const shade=exact?deformOriginalShade(await loadOriginalShade(),state):
        basic?window.OpenLampBasics.build(state,mount):buildShade(state);
      const cap=exact||basic?buildTopCap(shade,state.topMode):null;
      if(requestId!==renderRequest)return;
      mountAssembly=mount;
      const shadeReport=exact?validateOriginalDeformation(await loadOriginalShade(),shade):validate(shade),baseReport=validate(base);
      const baseAccepted=baseReport.ok;
      meshes={shade,base,cap};reports={shade:shadeReport,base:baseReport,baseAccepted,cap:cap?{ok:true}:null};
      byId('s-height').textContent=`${Math.round(exact?Math.max(baseHeight(),ORIGINAL_SHADE_Z_MIN+state.height+shadeElevation()):state.height+shadeElevation())} mm`;
      let maxR=0,lowestZ=Infinity,highestZ=-Infinity;
      for(let i=0;i<shade.positions.length;i+=3){
        maxR=Math.max(maxR,Math.hypot(shade.positions[i],shade.positions[i+1]));
        lowestZ=Math.min(lowestZ,shade.positions[i+2]);
        highestZ=Math.max(highestZ,shade.positions[i+2]);
      }
      lastShadeDimensions={heightMm:highestZ-lowestZ,diameterMm:2*maxR};
      byId('s-diameter').textContent=`${Math.ceil(2*maxR)} mm`;
      byId('s-tris').textContent=(shade.triangleCount+base.triangleCount+(cap?.triangleCount||0)).toLocaleString('es-AR');
      byId('s-valid').textContent=shadeReport.ok&&baseAccepted?((2+Number(!!cap))+' sólidos ✓'):'Revisar';
      if(!shadeReport.ok||!baseAccepted)throw new Error('La geometría no superó la validación');
      byId('status').textContent=bp.id==='flat'
        ? 'Taller: socket cilíndrico interior · prueba FDM pendiente'
        : mount?.integrated
          ? 'Wibble: pantalla con apoyo interior sobre 4 lóbulos · sin adaptador adicional'
          : 'Wibble: unión no verificada para este proyecto anterior';
      for(const id of ['download-shade','download-base'])byId(id).disabled=false;
      byId('download-cap').disabled=!cap;
      document.dispatchEvent(new CustomEvent('openlamp:rendered',
        {detail:{shadeValid:!!shadeReport.ok,baseValid:!!baseReport.ok,baseId:selectedBase,integratedMount:!!mount?.integrated}}));
      try{await plotMeshes(meshes);}catch(err){byId('status').textContent='STL preparados · No se pudo cargar el visor';console.warn(err);}
    }catch(e){byId('status').textContent='Error: '+(e.message||e);byId('s-valid').textContent='Error';console.error(e);}
  }
  function init(){
    byId('base-presets').innerHTML=BASE_PRESETS.map(p=>
      `<button type="button" class="base-preset" data-base="${p.id}" aria-pressed="false"><strong>${p.name}</strong><span>${p.id==='wibble'?'Abstractia Design · Malla original':'Modelo OBJ · geometría cerrada'}</span></button>`).join('');
    document.querySelectorAll('.base-preset').forEach(btn=>btn.addEventListener('click',()=>{
      selectedBase=btn.dataset.base;
      refreshControls();timer();
    }));
    byId('presets').innerHTML=Object.entries(FAMILY).filter(([key])=>PRESETS.some(p=>p.family===key&&!p.archived)).map(([key,f])=>
      `<div class="family-group" ${PRESETS.some(p=>p.family===key&&!p.archived)?'':'hidden'}><div class="family-title">${f.label}</div><div class="family-grid">${PRESETS.filter(p=>p.family===key&&!p.archived).map(p=>
        `<button class="preset" data-id="${p.id}" aria-pressed="false"><span class="glyph" aria-hidden="true">${p.glyph}</span><span>${p.name}</span></button>`).join('')}</div></div>`).join('');
    document.querySelectorAll('.preset').forEach(btn=>btn.addEventListener('click',()=>{
      state=suggestedParams(btn.dataset.id);refreshControls();timer();
    }));
    byId('controls').innerHTML=FIELDS.map(([key,label,unit,min,max,step])=>`<div class="control"><div class="control-head"><label for="in-${key}">${label}</label><output id="out-${key}"></output></div><input id="in-${key}" type="range" min="${min}" max="${max}" step="${step}" aria-label="${label}" /></div>`).join('');
    for(const [key] of FIELDS)byId('in-'+key).addEventListener('input',e=>{
      state[key]=Number(e.target.value);
      if(window.OpenLampBasics?.shapeFor(state)){
        if(key==='thickness')state.diameter=Math.max(state.diameter,Math.ceil(window.OpenLampBasics.minimumDiameter(state)));
        if(key==='diameter'&&state.basicOptions?.topDiameter>state.diameter)state.basicOptions.topDiameter=state.diameter;
      }
      refreshControls();timer();
      if(key==='height'||key==='diameter')document.dispatchEvent(new Event('openlamp:shade-updated'));
    });
    byId('top-mode').addEventListener('change',e=>{state.topMode=e.target.value;refreshControls();timer();});
    byId('advanced-design').addEventListener('change',refreshControls);
    byId('reset-design').addEventListener('click',()=>{state={...suggestedParams(state.id)};refreshControls();timer();document.dispatchEvent(new Event('openlamp:project-loaded'));});
    document.querySelectorAll('.view-mode').forEach(btn=>btn.addEventListener('click',()=>{viewMode=btn.dataset.view;refreshControls();if(meshes)plotMeshes(meshes).catch(console.warn);}));
    byId('download-shade').addEventListener('click',()=>{if(!reports?.shade?.ok)return;fileDownload(stlBinary(meshes.shade),state.id==='tallertop_original'?(originalParameterState(state)?'tallertop-original-exacto.stl':`openlamp-shade-${state.shadeDesign?.family||'custom'}.stl`):`openlamp-pantalla-${state.id}.stl`,'model/stl');});
    byId('download-cap').addEventListener('click',()=>{if(!meshes?.cap||!reports?.cap?.ok)return;
      fileDownload(stlBinary(meshes.cap),`openlamp-${state.id}-tapa-${state.topMode}.stl`,'model/stl');
    });
    byId('download-base').addEventListener('click',()=>{if(!reports?.baseAccepted)return;
      const name=currentBasePreset().filename;
      fileDownload(stlBinary(meshes.base),name,'model/stl');
    });
    byId('save-json').addEventListener('click',()=>fileDownload(JSON.stringify({app:'openlamp-studio',version:9,params:state,baseId:selectedBase},null,2),`openlamp-${state.id}.json`,'application/json'));
    byId('load-json').addEventListener('click',()=>byId('json-file').click());
    byId('json-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{
      const data=JSON.parse(await file.text());
      if(data.app!=='openlamp-studio'||![1,2,3,4,5,6,7,8,9].includes(data.version))throw new Error('Formato incompatible');
      state=sanitize(data.params,{legacy:data.version<3});
      selectedBase=BASE_PRESETS.some(p=>p.id===data.baseId)?data.baseId:'flat';
      if(exceedsCurated(state))byId('advanced-design').checked=true;
      refreshControls();timer();document.dispatchEvent(new Event('openlamp:project-loaded'));
    }catch(err){alert('No se pudo abrir el proyecto: '+err.message);}finally{e.target.value='';}});
    refreshControls();render();
  }
  window.OpenLampBridge={
    getProject:()=>({params:{...state},baseId:selectedBase}),
    setBasicOption:(key,value)=>{
      if(!window.OpenLampBasics?.shapeFor(state))return;
      if(!['topDiameter','belly','discDepth'].includes(key))throw new Error('Opción básica desconocida');
      state.basicOptions=window.OpenLampBasics.optionsFor({...state,basicOptions:{...state.basicOptions,[key]:Number(value)}});
      refreshControls();timer();document.dispatchEvent(new Event('openlamp:basic-updated'));
    },
    setShadeDesign:design=>{
      if(state.id!=='tallertop_original')throw new Error('Editor visual disponible para Taller Top');
      const next=window.OpenLampShade.normalize(design);
      const f=window.OpenLampShade.families[next.family];
      state.shadeDesign=next;
      state.height=Math.max(f.height[0],Math.min(f.height[1],state.height));
      state.diameter=Math.max(f.diameter[0],Math.min(f.diameter[1],state.diameter));
      state.waist=0;state.curvature=0;
      refreshControls();timer();
      document.dispatchEvent(new Event('openlamp:shade-updated'));
    },
    setHardware:hardware=>{
      state.hardware=window.OpenLampCompatibility?.sanitizeHardware(hardware)||{type:'none'};
      document.dispatchEvent(new Event('openlamp:project-updated'));
    },
    setSurfaceIntensity:intensity=>{
      const v=Number(intensity);
      if(!Number.isFinite(v)||v<0.88||v>1.06)throw new Error('Intensidad de superficie fuera de límites');
      state.surfaceIntensity=v;refreshControls();timer();
    },
    getShadeInterface:()=>({
      modelId:state.id,familyId:state.shadeDesign?.family||'original',
      mount:{baseId:selectedBase,
        kind:mountAssembly?.interface?.kind||'unverified',
        adapterRequired:false,
        adapterGenerated:false,
        integratedMount:!!mountAssembly?.integrated,
        cadFitStatus:mountAssembly?.status||'unverified',
        innerRadiusMm:mountAssembly?.integrated?.innerShelfRadius??(window.OpenLampBasics?.shapeFor(state)?window.OpenLampBasics.INNER_MOUNT:TALLER_MOUNT_INNER_RADIUS),
        protectedHeightMm:window.OpenLampBasics?.shapeFor(state)?window.OpenLampBasics.SOCKET_ROOF:20,
        socketType:mountAssembly?.integrated?'wibble-integrated-saddle':window.OpenLampBasics?.shapeFor(state)?'hidden-internal':'legacy',
        socketDepthMm:mountAssembly?.integrated?0:window.OpenLampBasics?.shapeFor(state)?window.OpenLampBasics.INSERTION:null,
        socketWallMm:window.OpenLampBasics?.shapeFor(state)?window.OpenLampBasics.SOCKET_WALL:null,
        shadowGapMm:mountAssembly?.integrated?mountAssembly.integrated.contactClearance:mountAssembly?window.OpenLampMounts.SHADOW_GAP:null,
        fitStatus:'physical-test-required'},
      actualDimensions:lastShadeDimensions?{...lastShadeDimensions}:null,
      closure:state.topMode,geometryValid:!!reports?.shade?.ok,
      hardwareClearanceValidated:false,
    }),
    getStatus:()=>({adapterGenerated:false,adapterValid:false,integratedMount:!!mountAssembly?.integrated,mountStatus:mountAssembly?.status||'unverified',shadeValid:!!reports?.shade?.ok,baseValid:!!reports?.base?.ok,
      baseId:selectedBase,sourceModelId:state.id}),
  };
  window.OpenLampTest={deformOriginalShade,buildTopCap,validateOriginalDeformation,originalParameterState,DEFORMATION_LOCK_END,ORIGINAL_SHADE_HEIGHT,weldCoincidentVertices,loadOriginalShade,ORIGINAL_SHADE_PARTS,ORIGINAL_SHADE_SHA256,buildTallerShade,tallerOuterRadius,shadeElevation,TALLER_MOUNT_INNER_RADIUS,TALLER_MOUNT_ZONE_HEIGHT,TALLER_TOP_PROFILE,TALLER_TOP_ORIGINAL_HEIGHT,TALLER_TOP_ORIGINAL_DIAMETER,buildShade,buildBase,parseStandMesh,validate,stlBinary,PRESETS,BASE_PRESETS,FAMILY,SHAPE_PROFILES,profile,outerRadius,surfaceDetail,fieldLimits,sanitize,OPENING_RADIUS,BASE_HEIGHT,SEAT_HEIGHT,defaultClearance,getState:()=>({...state}),getReport:()=>reports};
  window.addEventListener('load',init);
})();

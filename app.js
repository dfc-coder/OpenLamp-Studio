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
  };
  const PRESETS = [
    {id:'globo',name:'Globo',family:'soft',glyph:'◯',height:158,diameter:168,thickness:1.6,ribDepth:0.15,ribCount:10,twist:0},
    {id:'organica',name:'Óvalo',family:'soft',glyph:'⬭',height:178,diameter:154,thickness:1.6,ribDepth:0.12,ribCount:12,twist:0},
    {id:'hongo',name:'Hongo',family:'petal',glyph:'◠',height:132,diameter:188,thickness:1.8,ribDepth:0.45,ribCount:18,twist:0},
    {id:'petalo',name:'Campana',family:'petal',glyph:'⌒',height:152,diameter:176,thickness:1.8,ribDepth:0.35,ribCount:20,twist:0},
    {id:'cilindrica',name:'Tambor',family:'calm',glyph:'▥',height:176,diameter:146,thickness:1.6,ribDepth:0.55,ribCount:26,twist:0},
    {id:'conica',name:'Imperio',family:'calm',glyph:'▽',height:150,diameter:178,thickness:1.6,ribDepth:0.35,ribCount:22,twist:0},
  ];
  const FIELDS = [
    ['height','Altura pantalla','mm',80,280,1], ['diameter','Diámetro nominal','mm',110,280,1],
    ['thickness','Espesor','mm',1.2,3.5,0.1], ['ribDepth','Relieve','mm',0,3.5,0.1],
    ['ribCount','Estrías','',0,34,1], ['twist','Torsión','°',-8,8,1],
    ['clearance','Holgura radial de acople','mm',0.2,0.8,0.05],
  ];
  // Classic lamp silhouettes defined by piecewise cubic Bézier curves.
  // Each segment is [p0, p1, p2, p3] in normalized [height, radiusFactor].
  const SHAPE_PROFILES = {
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
  const SHADE_SEGMENTS=128, SHADE_LEVELS=100, BASE_SEGMENTS=256, TAU=2*Math.PI;
  const OPENING_RADIUS=40; // inner opening radius in mm; fixed shared shade/base interface
  const BASE_HEIGHT=12, SEAT_HEIGHT=9, SEAT_WALL=4, HOLE_RADIUS=3.5;
  const GROUND_GROOVE_DEPTH=3.2, GROUND_GROOVE_WIDTH=5.5;
  const defaultClearance=0.4;
  const BASE_PRESETS = [
    {id:'flat',name:'Plana',author:'OpenLamp Studio',type:'parametric'},
    {id:'wibble',name:'Wibble Stand',author:'Abstractia Design',type:'mesh',height:199.37149,diameter:162.87946},
  ];
  const WIBBLE_ASSET='assets/stands/wibble-stand.olmesh.gz';
  let state={...PRESETS[0],clearance:defaultClearance};
  let selectedBase='flat',standMesh=null,standPromise=null,renderRequest=0;
  let meshes=null, reports=null, plotPrepared=false, pendingRender=0, viewMode='ensamblada';
  const byId=id=>document.getElementById(id);
  const clamp=(x,a,b)=>Math.max(a,Math.min(x,b));
  const smoothstep=x=>{const y=clamp(x,0,1);return y*y*(3-2*y);};
  const presetById=id=>PRESETS.find(p=>p.id===id);
  function fieldLimits(key,p,advanced=false){
    const field=FIELDS.find(f=>f[0]===key);
    if(!field)throw new Error('Parámetro desconocido: '+key);
    if(advanced || !(key in FAMILY[p.family]))return [field[3],field[4]];
    return FAMILY[p.family][key];
  }
  function sanitize(raw,{legacy=false}={}){
    const preset=presetById(raw.id);
    if(!preset)throw new Error('Perfil desconocido');
    const out={...preset,clearance:defaultClearance};
    for(const [key] of FIELDS){
      const value=raw[key]===undefined?out[key]:raw[key];
      if(typeof value!=='number'||!Number.isFinite(value))throw new Error('Parámetro inválido: '+key);
      const [minimum,maximum]=fieldLimits(key,preset,true);
      // Preserve historical values for old projects, warning visibly in the editor.
      out[key]=legacy?value:clamp(value,minimum,maximum);
    }
    out.ribCount=Math.round(out.ribCount);
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
    for(let i=0;i<samples.length-1;i++){
      const [x0,y0]=samples[i], [x1,y1]=samples[i+1];
      if(t<=x1){
        const u=(t-x0)/(x1-x0||1);
        return y0+(y1-y0)*u;
      }
    }
    return last[1];
  }
  function profile(t,id){
    const spec=SHAPE_PROFILES[id];
    if(!spec)throw new Error('Perfil inválido');
    return interpolateSamples(spec.samples,Math.min(t,spec.crownStart));
  }
  function crownFactor(t,p){
    const start=SHAPE_PROFILES[p.id].crownStart;
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
    // Mechanical socket is untouched: Ø80 mm inner aperture on the underside.
    const collar=OPENING_RADIUS+p.thickness;
    const body=(p.diameter/2)*profile(t,p.id);
    const blend=smoothstep(t/0.20);
    const radiused=collar+(body-collar)*blend;
    return Math.max(0,radiused*crownFactor(t,p)+surfaceDetail(t,theta,p));
  }
  function suggestedParams(id){const p=presetById(id);return {...p,clearance:state.clearance};}
  function exceedsCurated(p){
    return ['ribDepth','ribCount','twist'].some(key=>{
      const [a,b]=fieldLimits(key,p);return p[key]<a||p[key]>b;
    });
  }
  function createMesh(positions,indices){
    return {positions:Float32Array.from(positions),indices:Uint32Array.from(indices),triangleCount:indices.length/3,vertexCount:positions.length/3};
  }
  function buildShade(p){
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
    if(nVerts===0||nVerts>200000||nFaces===0||nFaces>400000)throw new Error('Tamaño de malla inválido');
    if(buffer.byteLength!==12+12*nVerts+12*nFaces)throw new Error('Longitud de malla incorrecta');
    const positions=new Float32Array(buffer.slice(12,12+12*nVerts));
    const indices=new Uint32Array(buffer.slice(12+12*nVerts));
    for(const index of indices)if(index>=nVerts)throw new Error('Índice fuera de rango');
    return {positions,indices,triangleCount:nFaces,vertexCount:nVerts};
  }
  async function loadStand(){
    if(standMesh)return standMesh;
    if(!standPromise){
      standPromise=(async()=>{
        if(typeof DecompressionStream!=='function')throw new Error('Este navegador no admite descompresión de mallas gzip');
        const response=await fetch(WIBBLE_ASSET);
        if(!response.ok||!response.body)throw new Error('No se pudo cargar el stand Wibble (HTTP '+response.status+')');
        const buffer=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        const mesh=parseStandMesh(buffer);
        const quality=validate(mesh);
        if(!quality.ok)throw new Error('El stand no pasó validación de geometría');
        standMesh=mesh;
        return mesh;
      })().catch(e=>{standPromise=null;throw e;});
    }
    return standPromise;
  }
  function baseHeight(){return selectedBase==='wibble'?BASE_PRESETS[1].height:BASE_HEIGHT;}
  function baseDiameter(){return selectedBase==='wibble'?BASE_PRESETS[1].diameter:null;}
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
    // Explicit, non-interactive 2D profile preview when WebGL is unavailable.
    const help=document.querySelector('.view-help');if(help)help.textContent='Vista lateral esquemática · Interacción 3D no disponible';
    const area=byId('viewer'),w=Math.max(400,area.clientWidth||800),h=Math.max(360,area.clientHeight||580);
    const maxR=Math.max(62,state.diameter*.51,state.diameter*.43,(baseDiameter()||0)/2);
    const vertical=state.height+baseHeight()+(viewMode==='separada'?27:0);
    const scale=Math.min((w-95)/(2*maxR),(h-85)/vertical);
    const cx=w/2,ground=h-45,screenOffset=baseHeight()+(viewMode==='separada'?27:0);
    const xx=r=>(cx+r*scale).toFixed(1), yy=z=>(ground-z*scale).toFixed(1);
    let outline=`M ${xx(0)} ${yy(screenOffset+state.height)}`;
    for(let k=99;k>=0;k--){const t=k/100;outline+=` L ${xx(outerRadius(t,0,state))} ${yy(screenOffset+t*state.height)}`;}
    outline+=` L ${xx(-outerRadius(0,0,state))} ${yy(screenOffset)}`;
    for(let k=1;k<=99;k++){const t=k/100;outline+=` L ${xx(-outerRadius(t,Math.PI,state))} ${yy(screenOffset+t*state.height)}`;}
    outline+=' Z';
    const br=Math.max(62,state.diameter*.43),footTop=yy(BASE_HEIGHT),footBottom=yy(0);
    const isWibble=selectedBase==='wibble';
    const guide=isWibble?'Wibble Stand · montaje de pantalla SIN VERIFICAR':viewMode==='ensamblada'?'Pantalla apoyada sobre el asiento':'Pantalla y base separadas';
    if(isWibble){
      area.innerHTML=`<div class="wibble-fallback"><img src="assets/stands/wibble-reference.webp" alt="Referencia del stand original Wibble de Abstractia Design, fotografiado con su propia pantalla"><p>Referencia del fabricante · No representa encastre con la pantalla OpenLamp</p></div>`;
      byId('status').textContent='Stand original cargado · Vista 3D no disponible · Acople no verificado';
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
    const traces=[makeTrace(all.base,'#bb765f'),makeTrace(all.shade,'#e7d6bc',baseHeight()+(exploded?27:0))];
    const layout={paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',margin:{t:0,b:0,l:0,r:0},showlegend:false,uirevision:'orbit',
      scene:{xaxis:{visible:false},yaxis:{visible:false},zaxis:{visible:false},aspectmode:'data',camera:{eye:{x:1.4,y:1.7,z:1.13}},bgcolor:'rgba(0,0,0,0)'},dragmode:'turntable'};
    const opts={responsive:true,displaylogo:false,displayModeBar:false,scrollZoom:true};
    const help=document.querySelector('.view-help');if(help)help.textContent='Arrastrar para rotar · Rueda para zoom';
    const operation=plotPrepared?Plotly.react:Plotly.newPlot;
    return operation(byId('viewer'),traces,layout,opts).then(()=>{plotPrepared=true;});
  }
  const timer=()=>{clearTimeout(pendingRender);pendingRender=setTimeout(render,170);};
  function refreshControls(){
    for(const [key,label,unit,min,max] of FIELDS){
      const input=byId('in-'+key);
      let [lo,hi]=fieldLimits(key,state,byId('advanced-design').checked);
      // Historical projects remain editable without silently discarding values.
      lo=Math.min(lo,state[key]);hi=Math.max(hi,state[key]);
      input.min=lo;input.max=hi;input.value=state[key];
      byId('out-'+key).textContent=state[key].toLocaleString('es-AR')+(unit?` ${unit}`:'');
    }
    document.querySelectorAll('.preset').forEach(el=>{el.classList.toggle('active',el.dataset.id===state.id);el.setAttribute('aria-pressed',String(el.dataset.id===state.id));});
    const preset=presetById(state.id);
    document.querySelectorAll('.base-preset').forEach(btn=>{
      const active=btn.dataset.base===selectedBase;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
    });
    byId('mount-warning').hidden=selectedBase!=='wibble';
    byId('download-base').textContent=selectedBase==='wibble'?'STL stand Wibble ↗':'STL base ↗';
    byId('current-name').textContent=preset.name;
    byId('current-family').textContent=FAMILY[preset.family].label;
    byId('curated-warning').hidden=!exceedsCurated(state);
    for(const el of document.querySelectorAll('.view-mode'))el.classList.toggle('active',el.dataset.view===viewMode);
  }
  async function render(){
    for(const id of ['download-shade','download-base'])byId(id).disabled=true;
    const requestId=++renderRequest;
    byId('status').textContent='Generando pantalla y base…';
    try{
      const shade=buildShade(state);
      const base=selectedBase==='wibble'?await loadStand():buildBase(state);
      if(requestId!==renderRequest)return;
      const shadeReport=validate(shade),baseReport=validate(base);
      meshes={shade,base};reports={shade:shadeReport,base:baseReport};
      byId('s-height').textContent=`${Math.round(state.height+baseHeight())} mm`;
      let maxR=0;for(let i=0;i<shade.positions.length;i+=3)maxR=Math.max(maxR,Math.hypot(shade.positions[i],shade.positions[i+1]));
      byId('s-diameter').textContent=`${Math.ceil(2*maxR)} mm`;
      byId('s-tris').textContent=(shade.triangleCount+base.triangleCount).toLocaleString('es-AR');
      byId('s-valid').textContent=shadeReport.ok&&baseReport.ok?'Dos sólidos ✓':'Revisar';
      if(!shadeReport.ok||!baseReport.ok)throw new Error(`Malla inválida — pantalla: ${JSON.stringify(shadeReport)}, base: ${JSON.stringify(baseReport)}`);
      byId('status').textContent=selectedBase==='wibble'
        ? 'STL del stand original y pantalla listos · Montaje NO verificado'
        : 'Geometría validada · 2 STL preparados';
      for(const id of ['download-shade','download-base'])byId(id).disabled=false;
      try{await plotMeshes(meshes);}catch(err){byId('status').textContent='STL preparados · No se pudo cargar el visor';console.warn(err);}
    }catch(e){byId('status').textContent='Error: '+(e.message||e);byId('s-valid').textContent='Error';console.error(e);}
  }
  function init(){
    byId('base-presets').innerHTML=BASE_PRESETS.map(p=>
      `<button type="button" class="base-preset" data-base="${p.id}" aria-pressed="false"><strong>${p.name}</strong><span>${p.id==='wibble'?'Abstractia Design · Malla original':'Base circular paramétrica'}</span></button>`).join('');
    document.querySelectorAll('.base-preset').forEach(btn=>btn.addEventListener('click',()=>{
      selectedBase=btn.dataset.base;
      refreshControls();timer();
    }));
    byId('presets').innerHTML=Object.entries(FAMILY).map(([key,f])=>
      `<div class="family-group"><div class="family-title">${f.label}</div><div class="family-grid">${PRESETS.filter(p=>p.family===key).map(p=>
        `<button class="preset" data-id="${p.id}" aria-pressed="false"><span class="glyph" aria-hidden="true">${p.glyph}</span><span>${p.name}</span></button>`).join('')}</div></div>`).join('');
    document.querySelectorAll('.preset').forEach(btn=>btn.addEventListener('click',()=>{
      state=suggestedParams(btn.dataset.id);refreshControls();timer();
    }));
    byId('controls').innerHTML=FIELDS.map(([key,label,unit,min,max,step])=>`<div class="control"><div class="control-head"><label for="in-${key}">${label}</label><output id="out-${key}"></output></div><input id="in-${key}" type="range" min="${min}" max="${max}" step="${step}" aria-label="${label}" /></div>`).join('');
    for(const [key] of FIELDS)byId('in-'+key).addEventListener('input',e=>{
      state[key]=Number(e.target.value);refreshControls();timer();
    });
    byId('advanced-design').addEventListener('change',refreshControls);
    byId('reset-design').addEventListener('click',()=>{state=suggestedParams(state.id);refreshControls();timer();});
    document.querySelectorAll('.view-mode').forEach(btn=>btn.addEventListener('click',()=>{viewMode=btn.dataset.view;refreshControls();if(meshes)plotMeshes(meshes).catch(console.warn);}));
    byId('download-shade').addEventListener('click',()=>{if(!reports?.shade?.ok)return;fileDownload(stlBinary(meshes.shade),`openlamp-pantalla-${state.id}.stl`,'model/stl');});
    byId('download-base').addEventListener('click',()=>{if(!reports?.base?.ok)return;
      const name=selectedBase==='wibble'?'abstractia-wibble-original-stand.stl':`openlamp-base-${state.id}.stl`;
      fileDownload(stlBinary(meshes.base),name,'model/stl');
    });
    byId('save-json').addEventListener('click',()=>fileDownload(JSON.stringify({app:'openlamp-studio',version:3,params:state,baseId:selectedBase},null,2),`openlamp-${state.id}.json`,'application/json'));
    byId('load-json').addEventListener('click',()=>byId('json-file').click());
    byId('json-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{
      const data=JSON.parse(await file.text());
      if(data.app!=='openlamp-studio'||![1,2,3].includes(data.version))throw new Error('Formato incompatible');
      state=sanitize(data.params,{legacy:data.version<3});
      selectedBase=BASE_PRESETS.some(p=>p.id===data.baseId)?data.baseId:'flat';
      if(exceedsCurated(state))byId('advanced-design').checked=true;
      refreshControls();timer();
    }catch(err){alert('No se pudo abrir el proyecto: '+err.message);}finally{e.target.value='';}});
    refreshControls();render();
  }
  window.OpenLampTest={buildShade,buildBase,parseStandMesh,validate,stlBinary,PRESETS,BASE_PRESETS,FAMILY,SHAPE_PROFILES,profile,outerRadius,surfaceDetail,fieldLimits,sanitize,OPENING_RADIUS,BASE_HEIGHT,SEAT_HEIGHT,defaultClearance,getState:()=>({...state}),getReport:()=>reports};
  window.addEventListener('load',init);
})();

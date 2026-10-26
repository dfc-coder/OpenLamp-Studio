/* Stage 01 — per-shape dimensions; no new framework. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const fields={
    cone:[['topDiameter','Diámetro superior',80,'diameter',1]],
    bell:[['topDiameter','Diámetro superior',80,'diameter',1]],
    pear:[['belly','Altura del volumen principal',0.28,0.44,0.01]],
    disc:[['discDepth','Curvatura del canto',0.2,0.5,0.01]]
  };
  function sync(){
    const data=window.OpenLampBridge?.getProject(),B=window.OpenLampBasics,slot=$('ol-basic-options');
    if(!data||!B||!slot)return;
    const p=data.params,shape=B.shapeFor(p);
    slot.replaceChildren();
    if(!shape){
      const text=document.createElement('p');
      text.textContent='Proyecto heredado. Podés exportarlo o seleccionar una nueva forma básica.';
      text.className='ol-shape-note';slot.append(text);return;
    }
    const options=B.optionsFor(p);
    for(const [key,title,min,maxParam,step] of (fields[shape]||[])){
      const max=maxParam==='diameter'?p.diameter:maxParam;
      const wrapper=document.createElement('div');wrapper.className='control';
      const head=document.createElement('div');head.className='control-head';
      const label=document.createElement('label');label.textContent=title;label.htmlFor='basic-'+key;
      const output=document.createElement('output');
      output.textContent=Number(options[key]).toLocaleString('es-AR');
      head.append(label,output);
      const slider=document.createElement('input');
      slider.type='range';slider.id='basic-'+key;slider.min=min;slider.max=max;slider.step=step;
      slider.value=options[key];
      slider.addEventListener('input',()=>{
        output.textContent=Number(slider.value).toLocaleString('es-AR');
        window.OpenLampBridge.setBasicOption(key,Number(slider.value));
      });
      wrapper.append(head,slider);slot.append(wrapper);
    }
    const warning=document.createElement('p');warning.className='ol-shape-note';
    warning.textContent='Montaje fijo: abertura interior Ø70,09 mm. Requiere calibración de encastre físico.';
    slot.append(warning);
  }
  function init(){
    const pane=document.querySelector('.ol-step-pane[data-step="shade"]'),controls=$('controls');
    if(!pane||!controls||!window.OpenLampBasics)return;
    const section=document.createElement('div');section.id='ol-basic-options';section.className='ol-basic-options';
    controls.after(section);
    // Show the ACTUAL generated silhouettes, not approximate unicode icons.
    const captions={
      cylinder:'Recta',cone:'Tronco cónico',dome:'Cúpula alta',
      bell:'Boca ancha',sphere:'Simétrica',pear:'Volumen inferior',
      disc:'Disco lenticular'
    };
    const NS='http://www.w3.org/2000/svg';
    for(const preset of window.OpenLampBasics.presets){
      const button=pane.querySelector('.preset[data-id="'+preset.id+'"]');
      if(!button)continue;
      const glyph=button.querySelector('.glyph');
      const svg=document.createElementNS(NS,'svg');
      svg.setAttribute('viewBox','0 0 84 76');
      svg.setAttribute('width','74');svg.setAttribute('height','69');
      svg.setAttribute('role','img');svg.setAttribute('aria-label','Silueta de '+preset.name);
      const count=56,left=[],right=[];
      for(let i=0;i<=count;i++){
        const t=i/count,r=window.OpenLampBasics.radiusAt(t,preset)/(preset.diameter/2);
        const y=70-64*t;
        right.push([42+Math.min(1.05,r)*31,y]);
        left.push([42-Math.min(1.05,r)*31,y]);
      }
      const points=[...right,...left.reverse()];
      const path=document.createElementNS(NS,'path');
      path.setAttribute('d',points.map((p,i)=>(i?'L':'M')+p[0].toFixed(2)+' '+p[1].toFixed(2)).join(' ')+' Z');
      path.setAttribute('fill','#e7e4da');path.setAttribute('stroke','#7b8b76');
      path.setAttribute('stroke-width','1.65');path.setAttribute('stroke-linejoin','round');
      svg.appendChild(path);glyph.replaceChildren(svg);
      const caption=document.createElement('small');
      caption.className='ol-shape-caption';caption.textContent=captions[window.OpenLampBasics.shapeFor(preset)];
      button.appendChild(caption);
    }
    pane.querySelectorAll('.preset:not(:disabled)').forEach(btn=>btn.addEventListener('click',()=>queueMicrotask(sync)));
    pane.querySelector('#in-diameter')?.addEventListener('change',sync);
    document.addEventListener('openlamp:project-loaded',sync);
    sync();
  }
  window.addEventListener('load',init);
})();
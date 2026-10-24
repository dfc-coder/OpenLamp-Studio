/* Stage 01 — per-shape dimensions; no new framework. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const fields={
    cone:[['topDiameter','Diámetro superior',80,'diameter',1]],
    bell:[['topDiameter','Diámetro superior',80,'diameter',1]],
    pear:[['belly','Posición del volumen',0.4,0.75,0.01]],
    disc:[['discDepth','Altura relativa del disco',0.2,0.5,0.01]]
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
    for(const [name,glyph] of [['Torus','◎'],['Free Curve','∿']]){
      const button=document.createElement('button');button.type='button';button.disabled=true;
      button.className='preset ol-coming-soon';button.title='Disponible en una versión posterior';
      const symbol=document.createElement('span');symbol.className='glyph';symbol.textContent=glyph;
      const label=document.createElement('span');label.textContent=name;
      const footer=document.createElement('small');footer.textContent='Próximamente';
      button.append(symbol,label,footer);$('presets').append(button);
    }
    pane.querySelectorAll('.preset:not(:disabled)').forEach(btn=>btn.addEventListener('click',()=>queueMicrotask(sync)));
    pane.querySelector('#in-diameter')?.addEventListener('change',sync);
    document.addEventListener('openlamp:project-loaded',sync);
    sync();
  }
  window.addEventListener('load',init);
})();
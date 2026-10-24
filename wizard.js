/* Five-step Desk Lamp Generator workflow, progressive enhancement of the
 * existing tested OpenLamp model/viewer/export. No additional 3D engine.
 */
(() => {
  'use strict';
  const steps=[
    {id:'shade',number:'01',title:'Shade',subtitle:'Silueta y proporciones'},
    {id:'bulb',number:'02',title:'Bulb',subtitle:'Kit e interfaces mecánicas'},
    {id:'base',number:'03',title:'Base',subtitle:'Stand y encastre'},
    {id:'surface',number:'04',title:'Surface',subtitle:'Nervaduras Taller'},
    {id:'make',number:'05',title:'Make',subtitle:'Revisión y exportación'},
  ];
  const $=id=>document.getElementById(id);
  const el=(tag,classes,text)=>{
    const node=document.createElement(tag);
    if(classes)node.className=classes;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  let active='shade';

  function createPanel(id){
    const pane=el('section','ol-step-pane');
    pane.dataset.step=id;
    pane.hidden=id!==active;
    return pane;
  }
  function appendRange(target,items){for(const item of items)target.appendChild(item);}
  function stepNotice(target,title,body){
    const panel=el('div','ol-message');
    panel.append(el('strong','',title),el('p','',body));target.appendChild(panel);
  }
  function renderRail(){
    const rail=el('nav','ol-rail');
    rail.setAttribute('aria-label','Etapas de diseño');
    const heading=el('div','ol-rail-title','LAMP WORKFLOW');
    rail.appendChild(heading);
    for(const step of steps){
      const button=el('button','ol-step-nav');
      button.type='button';button.dataset.step=step.id;
      button.setAttribute('aria-current',step.id===active?'step':'false');
      const number=el('span','ol-step-number',step.number);
      const info=el('span','ol-step-info');
      info.append(el('strong','',step.title),el('small','',step.subtitle));
      button.append(number,info);
      button.addEventListener('click',()=>navigate(step.id));
      rail.appendChild(button);
    }
    const footer=el('p','ol-rail-footer','PROCESAMIENTO LOCAL · SIN REGISTRO');
    rail.appendChild(footer);
    return rail;
  }
  function navigate(id){
    if(!steps.some(step=>step.id===id))return;
    active=id;
    for(const pane of document.querySelectorAll('.ol-step-pane'))pane.hidden=pane.dataset.step!==id;
    for(const button of document.querySelectorAll('.ol-step-nav')){
      const selected=button.dataset.step===id;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-current',selected?'step':'false');
    }
    $('ol-panel-title').textContent=steps.find(step=>step.id===id).number+' / '+id.toUpperCase();
    document.querySelector('.sidebar').scrollTop=0;
    refreshChecks();
  }
  function numericInput(name,title,placeholder){
    const row=el('label','ol-field');
    const titleNode=el('span','',title);
    const input=el('input','ol-input');input.type='number';input.name=name;
    input.min='0.1';input.max='350';input.step='0.1';input.placeholder=placeholder;
    row.append(titleNode,input);return row;
  }
  function setupBulb(pane){
    pane.appendChild(el('h2','ol-title','02 · Bulb'));
    pane.appendChild(el('p','ol-subtitle','Definí un kit comercial real. Un diámetro E27 no define por sí solo un portalámparas compatible.'));
    const group=el('div','ol-field');
    const label=el('label','', 'Sistema de iluminación');
    label.htmlFor='ol-kit-type';
    const select=el('select','ol-input');select.id='ol-kit-type';
    for(const [value,text] of [['none','Sin kit definido'],['led-low-voltage','Kit LED de baja tensión'],['e27','Portalámparas E27 comercial']]){
      const option=el('option','',text);option.value=value;select.append(option);
    }
    group.append(label,select);pane.append(group);
    const skuGroup=el('label','ol-field');
    skuGroup.appendChild(el('span','', 'Fabricante y referencia exacta'));
    const sku=el('input','ol-input');sku.id='ol-kit-sku';sku.placeholder='Marca · modelo · revisión';
    sku.maxLength=120;skuGroup.append(sku);pane.append(skuGroup);
    const info=el('div','ol-two-col');
    for(const [key,title,placeholder] of [
      ['diameterMm','Diámetro exterior (mm)','Ej.: 38'],
      ['heightMm','Altura exterior (mm)','Ej.: 45'],
      ['cableDiameterMm','Ø cable (mm)','Ej.: 4'],
    ]){
      const field=numericInput(key,title,placeholder);
      const input=field.querySelector('input');input.id='ol-kit-'+key;
      info.append(field);
    }
    pane.append(info);
    const box=el('div','ol-message');
    box.appendChild(el('strong','','Estado de compatibilidad'));
    const readout=el('p','');readout.id='ol-bulb-status';box.append(readout);pane.append(box);
    stepNotice(pane,'Adaptador físico todavía no disponible',
      'Estas dimensiones sirven para definir un perfil CAD. No fabricamos ni certificamos soportes eléctricos a partir de medidas supuestas. El carrier de cada kit requiere ensayos reales.');
    const onChange=()=>{
      const fields={type:select.value,sku:sku.value};
      for(const key of ['diameterMm','heightMm','cableDiameterMm']){
        const raw=$('ol-kit-'+key).value;
        fields[key]=raw.trim()===''?null:Number(raw);
      }
      window.OpenLampBridge.setHardware(fields);
      refreshChecks();
    };
    pane.querySelectorAll('input,select').forEach(node=>node.addEventListener('change',onChange));
    sku.addEventListener('input',onChange);
    return pane;
  }
  function setupSurface(pane){
    pane.appendChild(el('h2','ol-title','04 · Surface'));
    pane.appendChild(el('p','ol-subtitle','Tratamiento de las nervaduras del OBJ original. Sin patrones arbitrarios ni cambios al encastre.'));
    const label=el('label','ol-field');
    label.append(el('span','','Acabado de la superficie'));
    const select=el('select','ol-input');select.id='ol-surface-recipe';
    for(const [value,text] of [['original','Original · relieve intacto'],['soft','Soft · relieve discreto'],['defined','Defined · relieve acentuado']]){
      const opt=el('option','',text);opt.value=value;select.appendChild(opt);
    }
    label.appendChild(select);pane.append(label);
    const rangeLabel=el('label','ol-field');rangeLabel.htmlFor='ol-surface-intensity';
    const cap=el('span','','Intensidad (factor de relieve)');
    const output=el('output','');output.id='ol-surface-output';output.htmlFor='ol-surface-intensity';
    const input=el('input','');input.type='range';input.id='ol-surface-intensity';
    input.min='0.88';input.max='1.06';input.step='0.01';input.value='1';
    rangeLabel.append(cap,output,input);pane.append(rangeLabel);
    stepNotice(pane,'Diseño original protegido',
      'El factor 1,00 reproduce exactamente la superficie de Taller. La deformación se atenúa hasta desaparecer en la zona inferior de montaje.');
    select.addEventListener('change',()=>{
      const values={original:1,soft:0.91,defined:1.05};
      input.value=String(values[select.value]);
      window.OpenLampBridge.setSurfaceIntensity(values[select.value]);
      output.textContent=Number(input.value).toFixed(2);
      refreshChecks();
    });
    input.addEventListener('change',()=>{
      const value=Number(input.value);
      select.value=value===1?'original':value<1?'soft':'defined';
      window.OpenLampBridge.setSurfaceIntensity(value);
      output.textContent=value.toFixed(2);
      refreshChecks();
    });
    return pane;
  }
  function setupMake(pane){
    pane.appendChild(el('h2','ol-title','05 · Make'));
    pane.appendChild(el('p','ol-subtitle','Revisá la geometría, el encastre y el estado del kit antes de exportar.'));
    const statuses=el('div','ol-checklist');statuses.id='ol-checklist';pane.append(statuses);
    const exportNodes=document.querySelector('.workspace-bottom .export');
    if(exportNodes)pane.append(exportNodes);
    stepNotice(pane,'STL para prototipos, no luminaria certificada',
      'Se pueden exportar piezas individuales. No se ofrece descarga de un conjunto funcional con kit instalado mientras falten adaptadores ensayados y validación térmica/eléctrica.');
    return pane;
  }
  function syncFromProject(){
    const data=window.OpenLampBridge?.getProject();
    if(!data)return;
    const hardware=window.OpenLampCompatibility.sanitizeHardware(data.params.hardware);
    $('ol-kit-type').value=hardware.type;
    $('ol-kit-sku').value=hardware.sku;
    for(const key of ['diameterMm','heightMm','cableDiameterMm'])
      $('ol-kit-'+key).value=hardware[key]??'';
    const value=data.params.surfaceIntensity??1;
    $('ol-surface-intensity').value=value;
    $('ol-surface-output').textContent=Number(value).toFixed(2);
    $('ol-surface-recipe').value=value===1?'original':value<1?'soft':'defined';
    refreshChecks();
  }
  function refreshChecks(){
    const bridge=window.OpenLampBridge,compat=window.OpenLampCompatibility;
    if(!bridge||!compat)return;
    const project=bridge.getProject(),status=bridge.getStatus();
    const report=compat.evaluate({baseId:project.baseId,hardware:project.params.hardware,
      shadeValid:status.shadeValid,baseValid:status.baseValid});
    const bulb=$('ol-bulb-status');
    if(bulb){
      bulb.textContent=report.blockers.length?
        'Sin validación: '+report.blockers.join('; '):
        'Perfil dimensional completo · portador y ensayos pendientes';
    }
    const checklist=$('ol-checklist');
    if(checklist){
      checklist.replaceChildren();
      const rows=[
        ['Pantalla','Modelo Taller original / deformable','ok'],
        ['Geometría',report.geometryStatus==='valid'?'STL individuales habilitados':'Geometría pendiente',''+(report.geometryStatus==='valid'?'ok':'warn')],
        ['Base',compat.interfaces[project.baseId]?.name||'Sin base',report.knownMount?'ok':'warn'],
        ['Bulb',report.hardware.type==='none'?'Kit no seleccionado':(report.hardware.sku||'Sin referencia'),'warn'],
        ['Encastre',report.knownMount?'Encastre CAD · falta prueba física':'Sin interfaz mecánica verificada','warn'],
        ['Fabricación','Carrier y seguridad no ensayados','warn'],
      ];
      for(const [name,desc,style] of rows){
        const item=el('div','ol-check-item '+style);
        item.append(el('strong','',name),el('span','',desc));
        checklist.append(item);
      }
      const warning=el('div','ol-message');
      warning.append(el('strong','','Conjunto no habilitado'));
      warning.append(el('p','',report.blockers.join(' · ')||'Hardware y portador pendientes de ensayos.'));
      checklist.append(warning);
    }
    for(const btn of document.querySelectorAll('.ol-step-nav')){
      const indicator=btn.querySelector('.ol-step-number');
      if(!indicator)continue;
      indicator.dataset.ready=btn.dataset.step==='bulb'&&!report.blockers.length?'cad':'';
    }
  }
  function initialize(){
    if(!window.OpenLampBridge||!window.OpenLampCompatibility)return;
    const sidebar=document.querySelector('.sidebar'),main=document.querySelector('.layout');
    if(!sidebar||!main)return;
    const children=Array.from(sidebar.children);
    const baseStart=children.findIndex(e=>e.classList?.contains('eyebrow')&&e.textContent?.includes('03 / BASE'));
    const makeStart=children.findIndex(e=>e.classList?.contains('eyebrow')&&e.textContent?.includes('04 /'));
    if(baseStart<0||makeStart<=baseStart)return;
    const panels={};
    for(const step of steps)panels[step.id]=createPanel(step.id);
    appendRange(panels.shade,children.slice(0,baseStart));
    appendRange(panels.base,children.slice(baseStart,makeStart));
    appendRange(panels.make,children.slice(makeStart));
    const panelTitle=el('div','ol-panel-heading');panelTitle.id='ol-panel-title';
    sidebar.replaceChildren(panelTitle,...steps.map(step=>panels[step.id]));
    setupBulb(panels.bulb);setupSurface(panels.surface);setupMake(panels.make);
    main.prepend(renderRail());
    document.documentElement.classList.add('ol-wizard');
    document.addEventListener('openlamp:rendered',refreshChecks);
    document.addEventListener('openlamp:project-updated',refreshChecks);
    document.addEventListener('openlamp:project-loaded',syncFromProject);
    sidebar.querySelectorAll('.base-preset').forEach(btn=>btn.addEventListener('click',refreshChecks));
    syncFromProject();navigate('shade');
  }
  window.addEventListener('load',initialize);
})();

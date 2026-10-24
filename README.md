# OpenLamp Studio v0.4 — Atelier de pantallas de mesa

Demo estática de diseño paramétrico de **pantallas para lámparas de mesa**. La colección Atelier v0.4 incorpora cuatro siluetas de perfil bajo estudiadas con el stand Wibble de Abstractia como referencia de proporciones, sin copiar su pantalla. Se conserva la base plana, el stand Wibble, las exportaciones, los controles y la lectura de proyectos existentes.

## Probar en navegador

```bash
cd openlamp-studio-v0.3
python3 -m http.server 8000
```

Abrí <http://localhost:8000>. No requiere Node, cuenta, API ni conexión a internet: Plotly.js está incluido localmente. Cuando WebGL no está disponible se muestra un esquema 2D sin interacción orbital; los STL siguen funcionando.

## Colección Atelier v0.4

| Preset | Altura | Diámetro nominal | Enfoque |
| --- | ---: | ---: | --- |
| Halo | 120 mm | 238 mm | Volumen bajo de borde continuo |
| Domo | 128 mm | 220 mm | Cúpula redondeada |
| Campana | 134 mm | 219 mm | Silueta acampanada |
| Tambor | 144 mm | 207 mm | Cilindro con transiciones suaves |

Todos los perfiles se definen mediante curvas Bézier cúbicas completas. La corona no utiliza el antiguo taper esférico genérico. Los relieves predeterminados son mínimos. El Wibble es la base inicial de la demo para evaluar la composición.

Los seis presets anteriores se mantienen internamente para poder cargar proyectos JSON antiguos, pero se ocultan de la selección principal. No se altera la geometría original del Wibble ni las interfaces mecánicas de la base plana.

**Advertencia:** la composición pantalla + Wibble es una visualización; el encastre, la orientación y la impresión FDM real no han sido probados físicamente. Los STL válidos no equivalen a compatibilidad mecánica o eléctrica certificada.

## Historial: v0.3
Qué cambió respecto a v0.2

- **Seis diseños curados** en tres familias, sin texturas excesivas: Globo y Óvalo (*Abstract Soft*), Hongo y Campana (*Abstract Classic*), Tambor e Imperio (*Abstract Minimal*).
- Siluetas clásicas definidas mediante curvas Bézier cúbicas por tramos; sustituyen los perfiles senoidales y las formas amorfas anteriores.
- Coronación gradual y cierre superior continuo, transición inferior más corta hacia la interfaz mecánica existente.
- Relieves editables con envolvente gradual: se atenúan cerca de la unión y de la parte alta.
- Rangos estéticos por familia; botón **Restablecer diseño recomendado**; modo **Ajustes avanzados** para abrir rangos generales de los controles.
- Compatibilidad de lectura de archivos JSON v1/v2 (manteniendo valores anteriores fuera de los nuevos rangos y avisando). Nuevos proyectos en esquema JSON v3.
- Biblioteca inicial de **12 STL**; salida STL siempre calculada desde los controles, no desde modelos estáticos.

## Funciones mecánicas conservadas

- Abertura inferior de pantalla **80 mm de diámetro interior**.
- Base plana circular, altura **12 mm**, con asiento de **9 mm**.
- Holgura radial editable **0,2–0,8 mm** (valor inicial **0,4 mm**).
- Paso central de cable **7 mm** y canal inferior; no son un dispositivo de retención del cable.
- Cierre superior y pared hueca real en STL, exportación independiente de pantalla/base.

## Pruebas

```bash
node --check app.js
node tests/verify.cjs
node tests/export.cjs
python tests/browser_inline.py
```

Se comprobaron los cuatro diseños Atelier, seis diseños archivados y tres combinaciones límite, total **26 mallas STL en pruebas unitarias**; se exportaron e inspeccionaron independientemente **12 STL nominales** con Trimesh (`watertight`, `winding_consistent`, volumen positivo). El test de Chromium comprueba controles, presets, guardado/carga JSON, archivos STL y vista alternativa 2D.

Ver `tests/VERIFICACION.md` para resultados y limitaciones. Las imágenes `tests/design/` ilustran la geometría calculada; no son fotografías de impresión ni simulaciones fotométricas.

## Limitaciones

Las pruebas matemáticas no garantizan una impresión limpia de coronas/cúpulas en cualquier material, ni ausencia de autointersecciones para todos los valores, ni encastres reales ni compatibilidad con LED/E27. Las piezas son experimentales. Evaluar soportes y capas en OrcaSlicer, imprimir muestra y verificar montaje, estabilidad y temperatura antes de uso eléctrico.

## Créditos

MIT. Ideas de barrido geométrico y exportación STL: [VaseMaker](https://github.com/dcityorg/vasemaker) (Gary Muhonen, MIT), adaptadas de manera independiente; no se trata de un fork completo. Visor: [Plotly.js](https://github.com/plotly/plotly.js) (MIT). Los diseños y presets v0.3 son propios; no se han reproducido archivos ni geometrías de lámparas comerciales.


## Preset de base: Wibble Stand

La demo incorpora como opción de **base**, sin sustituir los presets de pantalla, la geometría escultórica original Wibble (Abstractia Design, permiso de uso y redistribución indicado por el usuario). Se conservan el nombre del autor y un aviso de que el encastre con pantallas OpenLamp no está verificado.

### Optimización medida

| Medida | Geometría original | Optimizada |
|---|---:|---:|
| Triángulos | 76.884 | 19.220 (−75,0 %) |
| Recurso comprimido del navegador | 694.720 B | 182.375 B (−73,7 %) |
| STL binario equivalente | 3.844.284 B | 961.084 B |

La superficie optimizada mantiene la malla cerrada y las normales consistentes. La desviación máxima vértice original → superficie optimizada medida sobre **todos los 38.426 vértices originales** fue **0,0852 mm**, con RMS de **0,0199 mm**; el cambio de volumen fue ≈0,016 %. Esta medición no constituye una garantía del ajuste del encastre real, de seguridad o de manufacturabilidad.

### Pruebas del preset

```bash
node tests/stand.cjs
python tests/stand_browser.py
```

El test de navegador simula la entrega de la malla gzip y verifica selección de base, descompresión, descarga STL, persistencia JSON y advertencia de montaje. El visor WebGL del conjunto permanece pendiente de verificación en navegador con aceleración 3D.

**Marca de agua física:** pendiente del archivo de logo vectorial del propietario y de validación del grabado; el STL actual no contiene ningún logo agregado.

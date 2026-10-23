# Alcance MVP y criterios de aceptación

## Objetivo de beta para LinkedIn
Un usuario sin experiencia CAD diseña una pantalla para lámpara de mesa, la visualiza junto a la base y descarga archivos STL independientes desde el navegador.

## Dentro del MVP
- Editor sin registro y 100 % client-side.
- Siluetas clásicas y curvas Bézier: globo, óvalo, hongo, campana, tambor, imperio.
- Dimensiones en milímetros, espesor, intensidad/frecuencia de relieve controlados.
- Vista ensamblada y de piezas separadas; respaldo 2D explícito si no hay WebGL.
- Pantalla con tapa superior cerrada, abertura inferior funcional; base circular simple.
- Malla con volumen y geometría verificables; exportación STL binario local.
- JSON editable y compatible con versiones existentes.
- Presets curados y atribuciones OSS visibles.

## Fuera del MVP
- Portalámparas E27 y módulo LED específicos hasta contar con muestras comerciales medidas y ensayos.
- Certificación eléctrica/térmica, instrucciones de cableado a red y venta de artefactos completos.
- STEP paramétrico, 3MF avanzado, usuarios, backend, comunidad, pagos.
- Catálogo de diseños ajenos sin prueba de licencia.

## Condiciones de lanzamiento
1. Carga exitosa en Firefox y Chromium y prueba de controles.
2. Visualización 3D real donde WebGL esté disponible; fallback 2D identificado sin confundirlo con 3D.
3. Todos los presets generan geometría con normales orientadas, sin bordes libres indebidos ni triángulos degenerados.
4. Descarga STL y reapertura en OrcaSlicer; las pruebas automatizadas no reemplazan una impresión real.
5. La unión pantalla/base conserva las cotas compartidas; holguras de encastre se presentan como experimentales.
6. Código público, avisos de terceros y licencia revisados.
7. No se publica como «kit compatible» ningún montaje no probado físicamente.

## Calidad estética
Las siluetas deben ser agradables sin relieve; los patrones solo acompañan la forma; no se permiten torsiones/deformaciones extremas por defecto. La selección estética final requiere revisión humana en el visor y, si corresponde, muestras impresas.

## Política de verificación
Toda capacidad se marca como verificada, experimental o pendiente. Un test unitario de STL no demuestra funcionamiento térmico ni mecánico del producto.

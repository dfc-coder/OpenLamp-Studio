# Dirección estética y sistema de siluetas

## Referencias e independencia
Estudiar productos destacados de diseño industrial, incluyendo Red Dot, y lenguaje contemporáneo de Abstract Design. Las referencias sirven para analizar proporciones, materialidad y difusión de luz; **no copiar geometrías protegidas, archivos, texturas ni identidad comercial**.

## Familias iniciales
- **Abstract Soft:** globo y óvalo de contorno suave.
- **Abstract Classic:** hongo y campana con volúmenes legibles.
- **Abstract Minimal:** tambor e imperio de líneas limpias.

## Fuente de verdad de la silueta
Perfiles de revolución definidos por curvas **Bézier cúbicas** (pares normalizados altura/radio), no combinaciones aleatorias de senos. Presets conservan proporciones recomendadas, son elegantes sin textura y pueden refinarse desde controles de curva.

## Superficie
Relieves discretos, límites por familia, atenuación cerca de la parte superior y de la unión. No mezclar torsión extrema, ondas múltiples ni relieves profundos en un mismo preset.

## Base
La base debe ser visualmente subordinada, no un segundo objeto escultórico. Conservar la interfaz mecánica probada y realizar cambios estéticos solo si no modifican tolerancias funcionales.

## Revisión de calidad
Para cada preset: silueta lisa frontal, tres cuartos, ensamblada, con textura, render uniforme y STL. Si el perfil no funciona visualmente en versión lisa, no aprobarlo con textura.

## Compatibilidad futura con modelos externos
- STEP: examinar superficies y derivar perfiles cuando el sólido sea de revolución.
- STL/OBJ: analizar topología y extraer perfil estimado cuando proceda.
- Modelo irregular: importar como pieza fija, no forzar su conversión a Bézier.
- Antes de incorporar un archivo, validar licencia, dimensiones y sistema de acople.

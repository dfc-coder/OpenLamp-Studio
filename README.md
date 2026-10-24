# Taller Top — OBJ original sin reinterpretación

El único preset visible usa **342.396 vértices y 684.792 triángulos originales** de `tallertop.obj`. No aplica reconstrucción Bézier, suavizado, reducción ni deformaciones. Las coordenadas se almacenan como Float32 con desviación máxima numérica de 0,000000005 mm. Sus 19 partes gzip se recomponen con SHA-256.

La posición del conjunto Taller Stand/Taller Top conserva su sistema CAD compartido. El acople físico no se considera verificado sin impresión real. Las variantes paramétricas previas quedan archivadas solo para proyectos JSON históricos: modificar altura, diámetro o tapa requiere una copia transformada y dejaría de ser el archivo exacto.

---

# OpenLamp Studio — Taller Top paramétrico (v0.5)

Generador web de pantallas para lámparas de escritorio. **Solo Taller Top aparece en la galería**, reconstruida a partir del perfil radial del archivo `tallertop.obj` aportado por el usuario. Los diez presets antiguos quedan ocultos para mantener compatibilidad de lectura de proyectos JSON.

## Diseño y controles

- **Altura y diámetro variables** sin cambiar la abertura inferior ni el cuerpo de montaje.
- **Terminación superior:** abierta, cerrada plana o cerrada curva.
- Control de espesor, relieve, estrías y torsión.
- Exportación independiente de pantalla y base como STL binarios y guardado JSON v4.
- Bases: **Taller Stand** (importado de OBJ) y **Wibble Stand**.

## Interfaz de montaje

La abertura inferior conserva un radio interior de **35,044 mm (Ø 70,089 mm)**, medido en el modelo fuente. Los primeros 20 mm del perfil exterior no se escalan al modificar el diámetro; la zona de 14,173 mm inferior mantiene su altura y la posición relativa con la base Taller Stand.

**Importante:** la pantalla es una *reconstrucción paramétrica* de la silueta longitudinal mediante 37 muestras, no una copia exacta de la malla OBJ original. La base Taller Stand es una malla no-manifold, exportable con advertencia experimental. La coincidencia matemática del asiento no garantiza un encastre FDM físico.

## Ejecutar y validar

```sh
python3 -m http.server 8000
# Navegar a http://localhost:8000
node --check app.js
node tests/verify.cjs
node tests/taller_top.cjs
node tests/stand.cjs
node tests/taller_base.cjs
node tests/export.cjs
```

Se verificaron 27 combinaciones de modo superior, altura y diámetro, con geometría STL manifold. La vista WebGL, el montaje físico, la seguridad térmica y eléctrica deben validarse por separado.

## Licencias y créditos

Código propio MIT. Créditos a [VaseMaker](https://github.com/dcityorg/vasemaker) y [Plotly.js](https://github.com/plotly/plotly.js). Wibble Stand es un modelo de Abstractia Design distribuido bajo el permiso señalado por el usuario, no bajo MIT. Los modelos Taller fueron suministrados por el usuario.

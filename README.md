# OpenLamp Studio v0.8 — Taller Top paramétrico fiel al OBJ

El único preset visible se construye a partir de los **342.396 vértices / 684.792 triángulos de `tallertop.obj`**, sin reconstruir las estrías. El modo por defecto devuelve el **mismo objeto de malla sin ninguna transformación**. Con parámetros diferentes, se modifica una copia de los vértices y se conservan todos los índices de triángulos originales.

## Controles del editor
- **Altura:** 195,14–265,14 mm.
- **Diámetro:** 131,20–175,20 mm. No puede reducirse por debajo del diámetro original mientras la falda/encastre inferior permanezcan exactamente iguales.
- **Cintura:** -8 a +8 mm, variación radial controlada alrededor de la zona media.
- **Curvatura:** -8 a +8 mm, deformación radial de la silueta.
- **Terminación superior:** Original abierta, tapa plana independiente, tapa curva independiente.
- **Restablecer:** recupera el mismo buffer de geometría original, no una reconstrucción aproximada.
- **Exportar STL:** pantalla y base independientes; si se selecciona tapa, aparece un tercer STL. El JSON de proyectos pasa a v5 y puede cargar versiones anteriores.

El programa inmoviliza los **9.085 vértices** ubicados en los primeros 20 mm de la zona inferior. La deformación vertical es monótona, el desplazamiento radial conserva la relación de los radios en una misma altura y cada actualización parte de la fuente original, evitando acumulación de errores.

## Pruebas de integración y límites
```sh
node --check app.js
node tests/verify.cjs
node tests/taller_top.cjs
node tests/original_top.cjs
node tests/parametric_original.cjs
node tests/stand.cjs
node tests/taller_base.cjs
node tests/assembly.cjs
node tests/export.cjs
```

Las pruebas verifican origen exacto, conservación de las caras y del montaje, deformaciones dentro de los rangos previstos, geometría no degenerada, volumen positivo y tapas STL independientes. GitHub Actions bloquea Pages si fallan.

**Advertencias:** las tapas y el montaje no se han probado físicamente; la comprobación de geometría no garantiza tolerancias FDM, resistencia térmica, estabilidad ni seguridad eléctrica. El visor de la malla de 684.792 triángulos puede ser lento en algunos navegadores/equipos; la validación de fluidez y del encastre físico permanece pendiente.

---

# OpenLamp Studio — Taller Stand reparado sin alterar el diseño

La base `newstandfortaller.obj` ya es **watertight/manifold** tras unificar únicamente vértices con coordenadas Float32 idénticas. Se mantienen los **19.196 triángulos** del OBJ y todas las coordenadas de cada esquina de cada triángulo, sin desplazamiento ni simplificación. Se reducen los vértices redundantes de 19.210 a 9.600; la validación exige orientación consistente, ausencia de caras degeneradas, bordes cerrados y volumen positivo. El STL del stand se exporta desde la malla corregida y no lleva ninguna marca «experimental: no manifold».

La pantalla `tallertop.obj` sigue siendo **la malla original exacta**, con **342.396 vértices y 684.792 triángulos**, sin parametrización ni reinterpretación. Los dos modelos se alinean usando el sistema de coordenadas CAD compartido. Entre el diámetro interior inferior de la pantalla (radio aproximado 35,044 mm) y el borde superior del asiento de la base (radio máximo aproximadamente 34,88 mm) hay una holgura radial nominal de alrededor de 0,16 mm. Es una comprobación dimensional, **no una prueba física de encastre**.

## Validación de release

```sh
node --check app.js
node tests/verify.cjs
node tests/original_top.cjs
node tests/taller_top.cjs
node tests/taller_base.cjs
node tests/stand.cjs
node tests/export.cjs
```

La geometría aprobada no equivale a certificación eléctrica, térmica ni de estabilidad. Antes de vender una lámpara física es necesario imprimir y probar el conjunto.

---

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

**Importante:** la pantalla es una *reconstrucción paramétrica* de la silueta longitudinal mediante 37 muestras, no una copia exacta de la malla OBJ original. La base Taller Stand se repara únicamente al unir vértices coincidentes; la geometría queda manifold y no se altera su superficie. La coincidencia matemática del asiento no garantiza un encastre FDM físico.

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

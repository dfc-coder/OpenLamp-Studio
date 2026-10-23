# Producto y visión

## Problema
Las herramientas de CAD tienen una curva de aprendizaje alta para quien solo quiere diseñar e imprimir una lámpara de mesa atractiva. Los generadores cerrados limitan personalización, interoperabilidad o acceso a los modelos.

## Solución
OpenLamp Studio es un generador **gratuito, open source y basado en navegador** para crear pantallas decorativas de lámparas de mesa y bases compatibles, sin registro ni instalación. Prioriza diseño industrial, sencillez de uso y exportaciones que puedan inspeccionarse con slicers comunes.

## Clientes / usuarios
1. Makers e impresión 3D doméstica: diseños editables sin CAD.
2. Diseñadores independientes y pequeños talleres: iteración rápida y fabricación local.
3. Personas interesadas en decoración: personalización estética guiada.
4. Educación / comunidades de código abierto: estudio y extensión de geometría paramétrica.

## Propuesta de valor
- **Diseño antes que cantidad:** siluetas clásicas proporcionales y perfiles Bézier editables.
- **Propiedad del resultado:** exportación de STL y proyecto editable JSON.
- **Procesamiento local:** no se sube geometría a servidores.
- **Modularidad:** pantalla, base e interfaz de montaje separadas.
- **Transparencia:** las comprobaciones geométricas no se confunden con certificación de seguridad.

## Viaje del usuario
Elegir modelo clásico → ajustar silueta/relieve → visualizar el conjunto → revisar advertencias de manufactura → descargar piezas STL → inspeccionar en OrcaSlicer/otro slicer → imprimir y probar.

## Principios de producto
KISS, DRY, no reinventar bibliotecas probadas, archivos interoperables, parámetros recuperables y avisos explícitos cuando una compatibilidad aún no está demostrada.

## No objetivos iniciales
Marketplace, cuentas, IA generativa, pagos, red social interna, render fotorrealista o sustitución de componentes eléctricos certificados.

## Métrica norte
Porcentaje de usuarios que descargan un STL válido y pueden abrirlo en su slicer. En piloto, medirlo con feedback voluntario sin instalar seguimiento intrusivo.

---
name: grafia
description: Hace hojas «escritas a mano» para estudiar o entregar —exámenes resueltos, solucionarios, apuntes, formularios, marcos teóricos, informes— en cuaderno cuadriculado, rayado, milimetrado o libreta, con letra manuscrita en tinta azul, títulos rojos subrayados, respuestas en recuadro y figuras dibujadas con lápiz de regla y compás (círculo de Mohr, red estereográfica y semiesfera, bloque rumbo-buzamiento, columna estratigráfica, corte con falla o pliegue, talud de bancos, labor con pernos, malla de perforación, diagrama de flujo de planta, curva granulométrica, barras). Sirve para cualquier curso: geología, minas, metalurgia, mecánica de rocas y otras materias. Úsala cuando André pida «hazlo a mano», «como examen resuelto», «estilo cuaderno», «estética de GeoStrike», «solucionario», «apuntes para estudiar», «sin estética web», o un PDF paginado A4 de una hoja así. Complemento de Geotechnic (3D casi real) y de sstutor-anatomia (isométricos de laboratorio).
---

# Grafia

Hojas A4 que parecen escritas y dibujadas a mano. Sale del motor «a mano» de GeoStrike
(`<REPOS>/geo\geostrike`: `stereonet.js` → `makePen`, `marco/` y `variantes.js`) convertido en un kit
reutilizable para cualquier materia.

## Qué pidió André y por qué

- «La estética web me pierde»: nada de tarjetas, chips, botones ni paneles. Papel, tinta y lápiz.
- «Que parezca un examen resuelto perfectamente»: enunciado corto, cálculo en líneas, resultado en recuadro.
- «Sin anotaciones entre líneas, guárdate deducciones»: no hay notas al margen, trampas, comentarios ni
  explicaciones de por qué. Si una deducción es parte de lo que se califica, van solo las fórmulas usadas.
- «En descargas las hojas salen mal»: imprimir desde el navegador parte las hojas y pierde el cuadriculado.
  El PDF se hace siempre con `scripts/pdf.py` (una hoja = una página A4, con el papel).

## Archivos

| Ruta | Qué es |
|---|---|
| `kit/grafia.css` | Papel (cuadricula, rayado, milimetrado, libreta, blanco, lamina, kraft), letras, títulos, `.calc`, `.caja`, tablas, figuras e impresión A4 |
| `kit/grafia.js` | Lápiz a mano, geometría (planos, polos, proyecciones Schmidt y Wulff), ejes y 15 figuras; mide si cada hoja cabe en A4 |
| `plantilla/hoja.html` | Esqueleto de una hoja con una pregunta |
| `ejemplos/muestrario.html` | Las 15 figuras por materia, con su `data-datos` (sirve de prueba) |
| `ejemplos/solucionario-cordova.html` | Caso real: solucionario de Mecánica de Rocas (7 hojas) |
| `scripts/armar.py` | Junta fuente + kit en un solo HTML (para Artifact o para abrir sin servidor) |
| `scripts/pdf.py` | PDF A4 paginado en Descargas; se niega si una hoja no cabe |
| `references/estilo.md` | Reglas del «a mano»: tintas, letras, papeles, qué no hacer |
| `references/figuras.md` | Catálogo de figuras con sus datos y cómo agregar una nueva |
| `references/materias.md` | Qué figuras y qué formato usar por curso (geología, minas, metalurgia, MR, otras) |

## Flujo

1. **Formato**: examen resuelto, apuntes o informe (`references/estilo.md` → formatos). Por defecto, examen resuelto en cuadriculado con Kalam azul.
2. **Escribe la fuente** copiando `plantilla/hoja.html` a la carpeta de trabajo (o al scratchpad). Enlaza el kit con rutas a `kit/grafia.css` y `kit/grafia.js` de esta skill.
   - Una `.hoja` por página A4. Agrupa 1 o 2 preguntas por hoja; nunca dejes que una hoja pase de 297 mm.
   - Cálculos en `.calc` (un `<div>` por línea), resultado en `.caja`, tablas en `.tabla > table`.
   - Figuras: `<div class="fig" data-fig="…" data-w="…" data-h="…" data-datos='{…}'></div>` y su `<p class="pie">`.
3. **Verifica los números** antes de escribirlos (un script de Python o la calculadora): la hoja no explica, así que un error no se nota.
4. **Arma**: `python -I scripts/armar.py <fuente.html> <salida.html>`.
5. **Mira** el resultado una vez: capturas con `node <REPOS>/geo\geotechnic\.claude\skills\geotechnic\scripts\drive.mjs <salida.html> --actions …` o el PDF con `--vista`.
6. **Entrega**:
   - Página: publica `<salida.html>` con la herramienta Artifact.
   - PDF: `python -I scripts/pdf.py <salida.html>` → `Descargas\<título>.pdf`. Si avisa que una hoja no cabe, pártela.

## Reglas

- Una sola apariencia (papel claro), también en modo oscuro: es papel, no una interfaz.
- Tinta azul para el texto; rojo para títulos, ejes N-S-E-W y recuadros; verde para direcciones y cotas; colores de familia (azul, rojo ladrillo, verde, ocre) para series y familias.
- Los números de una figura salen de los mismos datos que el cálculo; nunca a ojo.
- Nada que no esté en papel: sin botones, sin modos, sin animación.

# Estilo «a mano»

Aprendido de los informes con nota 15 que imita GeoStrike 4 (`<REPOS>/geo\geostrike\docs\PLAN - Informes a mano (GeoStrike 4).md`)
y de lo que André corrigió en el solucionario de Córdova.

## Trazo

| Rasgo | Cómo lo hace el kit |
|---|---|
| Recta con regla | `P.recta`: desvío ≤ 0.3 mm y se pasa 0.5–1.6 px de los extremos (`exacta: true` lo evita en puntas de flecha y marcas) |
| Circunferencia con compás | `P.circulo`: radio exacto; el trazo arranca en un ángulo al azar y se pasa del inicio |
| Grafito | Dos pasadas: la primera en tramos cortos de presión variable, la segunda más fina y tenue |
| Lápiz de color | `P.rayado` (rayado diagonal irregular) y `P.sombra` (relleno suave + rayado fino); nunca relleno plano |
| Polo o marca | `P.punto`: mancha de tinta irregular |
| Letra | Fuente manuscrita de Google Fonts, con leve rotación y desplazamiento por rótulo |
| Semilla | Fija por figura (nombre + id): la irregularidad no cambia al recargar |

## Tintas

| Tinta | Para |
|---|---|
| Azul `#1f3c8c` | Texto, cálculos, contornos principales |
| Rojo `#b5302a` | Títulos, ejes N-S-E-W, recuadros de respuesta, ángulos, la cota que importa |
| Verde `#2e6b3c` | Dirección de buzamiento, cotas, superficie del terreno, rótulos secundarios |
| Negro `#1c1c22` | Ejes de gráficos, primitiva de la red, enunciados |
| Gris `#8b8b93` | Rejillas, líneas de construcción, pies de figura |
| Familias | `#2f5fa8`, `#b5432e`, `#3d7d4c`, `#b4842a`, `#8a3f78`, `#5b4f9a` (lápices de color) |

## Letras (`<body data-letra="…">`)

| Clave | Fuente | Tinta | Uso |
|---|---|---|---|
| `kalam` (por defecto) | Kalam | azul | Exámenes resueltos, apuntes |
| `caveat` | Caveat | azul | Apuntes rápidos, mapas conceptuales |
| `patrick` | Patrick Hand | lápiz | Libreta de campo |
| `architects` | Architects Daughter | negro | Láminas técnicas, milimetrado |
| `gochi` | Gochi Hand | azul | Sketchnotes |
| `shadows` | Shadows Into Light Two | azul | Fichas |

## Papeles (clase de la `.hoja`)

`cuadricula` (5 mm, el de examen) · `rayado` (con margen rojo) · `milimetrado` (gráficos y perfiles) ·
`libreta` (crema, campo) · `blanco` · `lamina` (marco de dibujante) · `kraft`.

## Formatos

### Examen resuelto (el que pidió André)
- Cabecera: curso y evaluación en rojo, línea de datos fina, raya roja.
- Por pregunta: `h2` numerado con `(4 ptos)`, `.enun` con los datos, `.calc` con una línea por paso, `.caja` con el resultado final y sus unidades, la figura si la pregunta la pide.
- Nada más: sin notas al margen, sin «ojo», sin explicar por qué, sin deducciones largas.
- Teoría: listas cortas con el término en negrita y una línea de definición.

### Apuntes o marco teórico
- Se permite el resaltador (`.res`), el subrayado (`.sub`), figuras flotando al lado del texto y post-its (`.postit`).

### Informe
- Papel blanco o cuadriculado, títulos numerados 1, 1.1, 1.1.1, figuras con «Fig. N ·» y tablas numeradas.

## Qué no hacer

- Nada de estética web: tarjetas, chips, sombras de interfaz, botones, pestañas o modo oscuro.
- No mezclar letra de imprenta con la manuscrita (salvo números en tablas, que siguen en manuscrita).
- No dibujar a ojo un valor que se puede calcular: las figuras reciben los datos.
- No imprimir con Ctrl+P sin las reglas de `grafia.css`: las hojas se parten y el cuadriculado desaparece. Usa `scripts/pdf.py`.

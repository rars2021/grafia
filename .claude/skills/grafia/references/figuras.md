# Figuras del kit

Se declaran en la hoja; `data-w` × `data-h` es el tamaño lógico y la figura se escala al ancho de su caja.

```html
<div class="fig" data-fig="red" data-w="400" data-h="400" data-datos='{"planos":["N50E/50SE","WE/00S"]}'></div>
<p class="pie">Fig. 2 · Red de Schmidt, hemisferio inferior</p>
```

Todas están en `ejemplos/muestrario.html` con datos de ejemplo.

| Figura | Datos | Tamaño sugerido |
|---|---|---|
| `mohr` | `sx, sy, txy, u, elemento` (false quita el elemento girado a θs) | 620 × 300 |
| `elemento` | `th` (°, antihorario desde X), `rotulo` | 300 × 160 |
| `red` | `planos` (rumbo/buz. como «N50E/50SE», «WE/00S», «N30W90NE» o `[DB, buz]`), `proy` (`schmidt` o `wulff`), `red` (true dibuja la red de fondo), `nombres` | 400 × 400 |
| `semiesfera` | `planos`, `az`, `el` (vista, en grados) | 400 × 380 |
| `bloque` | `plano` (uno), `rotulo` | 400 × 300 |
| `insitu` | `z, sv, sh, u` | 320 × 230 |
| `avance` | (ninguno) túnel en planta con avance a favor y en contra del buzamiento | 620 × 190 |
| `columna` | `capas: [{lit, e, nombre}]` de arriba abajo; `lit`: arenisca, lutita, caliza, conglomerado, ignea, carbon, suelo; `unidad` | 380 × 400 |
| `corte` | `tipo`: normal, inversa, anticlinal, sinclinal; `capas`: litologías de arriba abajo | 400 × 200 |
| `talud` | `bancos, hb, berma, cara, u` | 620 × 250 |
| `labor` | `ancho, alto, pernos, L, shotcrete, u` | 400 × 320 |
| `malla` | `ancho, alto` (arranque, ayudas, contorno, arrastre) | 400 × 320 |
| `flujo` | `nodos: [{id, t, col, fila, c}]`, `flechas: [{de, a, t, c}]` | 640 × 260 |
| `curva` | `series: [{x, y, nombre, c}]`, `x0, x1, y0, y1, logx, marcasX, marcasY, xlab, ylab` | 420 × 300 |
| `barras` | `cats, vals, y1, marcasY, xlab, ylab, colores` | 420 × 300 |

## Agregar una figura

En la hoja (o en `kit/grafia.js` si se va a reusar):

```js
Grafia.registrar("mineral", function (P, W, H, d) {
  P.circulo(W / 2, H / 2, 60, { c: "azul", w: 1.6 });
  P.rayado([[W/2-40, H/2], [W/2, H/2-40], [W/2+40, H/2], [W/2, H/2+40]], { c: "ocre", a: .5 });
  P.texto(d.nombre || "calcopirita", W / 2, H - 16, { t: 14 });
});
```

El script va después de `grafia.js`; las figuras se dibujan cuando cargan las fuentes. Para redibujar: `Grafia.dibujar()`.

## El lápiz `P`

| Método | Qué dibuja |
|---|---|
| `P.recta(x1, y1, x2, y2, o)` | recta con regla (`o.exacta` sin pasarse; `o.dash`) |
| `P.poly(pts, o)` | polilínea (`o.cerrado`) |
| `P.circulo(cx, cy, R, o)` · `P.arco(cx, cy, R, a0, a1, o)` | compás (`o.relleno`, `o.ra`) |
| `P.flecha(x1, y1, x2, y2, o)` | flecha (`o.doble`, `o.h`) |
| `P.punto(x, y, R, o)` | polo o marca (`o.hueco`) |
| `P.texto(s, x, y, o)` | rótulo manuscrito (`t` tamaño, `b` negrita, `al`, `rot`, `c`; `\n` parte líneas) |
| `P.rayado(poly, o)` · `P.sombra(poly, c, a)` · `P.punteado(poly, o)` · `P.patron(poly, dx, dy, fn, desfase)` | rellenos de lápiz |
| `P.rect`, `P.cota(x1, y1, x2, y2, txt, o)`, `P.angulo(cx, cy, R, a0, a1, txt)`, `P.norte(x, y, s)` | auxiliares |

`o.c` acepta una tinta (`azul`, `rojo`, `verde`, `negro`, `gris`, `naranja`, `ocre`, `marron`, `violeta`, `celeste`, `lapiz`) o un color.

## Geometría `Grafia.geo`

`plano("N50E/50SE") → {dd, dip}` · `dir(tendencia, inmersión) → {e, n, d}` · `circuloMax(dd, dip)` · `polo(dd, dip)` ·
`proyectar(v, "schmidt" | "wulff") → [x, y]` (radio 1). `Grafia.ejes(P, [x, y, w, h], o) → {X, Y}` arma ejes con marcas y escala log.

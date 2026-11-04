/**
 * grafia.js — dibujo y figuras «hechos a mano» para hojas de estudio, exámenes resueltos e informes.
 *
 * El lápiz sale del motor a mano de GeoStrike (stereonet.js → makePen): rectas con regla que se pasan
 * de los extremos, circunferencias con compás que no cierran exacto, grafito en dos pasadas con
 * presión variable y una semilla fija por figura (la irregularidad es estable entre recargas).
 *
 * Uso en la página:
 *   <div class="fig" data-fig="mohr" data-w="620" data-h="300" data-datos='{"sx":300,"sy":900,"txy":140}'></div>
 * Las figuras se dibujan al cargar las fuentes y al cambiar el ancho. data-w × data-h es el tamaño lógico:
 * la figura se escala al ancho de su caja. La tinta sale de --tinta y la letra de --mano (grafia.css).
 *
 * API: Grafia.lapiz(ctx, semilla) · Grafia.registrar(nombre, fn) · Grafia.dibujar(raiz) · Grafia.geo · Grafia.F
 */
var Grafia = (function () {
  "use strict";

  var INK = {
    azul: "#1f3c8c", lapiz: "#3b3b42", negro: "#1c1c22", rojo: "#b5302a", verde: "#2e6b3c", naranja: "#c8641f",
    violeta: "#6a3f8f", gris: "#8b8b93", ocre: "#b4842a", celeste: "#2f7fbf", marron: "#7a4a2a"
  };
  var FAM = ["#2f5fa8", "#b5432e", "#3d7d4c", "#b4842a", "#8a3f78", "#5b4f9a"];
  var rad = function (d) { return d * Math.PI / 180; }, deg = function (r) { return r * 180 / Math.PI; };

  function mul(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ── el lápiz ────────────────────────────────────────────────────────────────
  function lapiz(ctx, semilla, op) {
    op = op || {};
    var r = mul(semilla || 7), j = function (a) { return (r() * 2 - 1) * a; };
    var fuente = op.fuente || '"Kalam","Segoe Print",cursive', tinta = INK[op.tinta] || op.tinta || INK.azul;
    var col = function (c) { return c ? (INK[c] || c) : tinta; };
    function densa(p, s) { var o = [p[0]]; for (var i = 1; i < p.length; i++) { var a = p[i - 1], b = p[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / s)); for (var k = 1; k <= n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return o; }
    // desvío perpendicular de baja frecuencia: el pulso de la mano, no ruido
    function pulso(p, amp) {
      var o = [], L = 0, f1 = r() * 6.28, f2 = r() * 6.28, fr = .03 + r() * .03, base = j(amp * .4);
      for (var i = 0; i < p.length; i++) {
        var a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1;
        if (i) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        var d = base + amp * (.7 * Math.sin(L * fr + f1) + .3 * Math.sin(L * fr * 2.7 + f2));
        o.push([p[i][0] - dy / dl * d, p[i][1] + dx / dl * d]);
      }
      return o;
    }
    function camino(q) { ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (var i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]); }
    function recorte(poly) { ctx.beginPath(); poly.forEach(function (q, i) { i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); }
    function caja(poly) { var xs = poly.map(function (q) { return q[0]; }), ys = poly.map(function (q) { return q[1]; }); return [Math.min.apply(0, xs), Math.min.apply(0, ys), Math.max.apply(0, xs), Math.max.apply(0, ys)]; }

    var P = { ctx: ctx, r: r, j: j, col: col, fuente: fuente, tinta: tinta };
    /** Polilínea: dos pasadas de grafito; o = {w, c, dash, cerrado, amp, a} */
    P.poly = function (pts, o) {
      o = o || {}; if (!pts || pts.length < 2) return;
      var w = o.w || 1.4, amp = (o.amp != null ? o.amp : .5) * 1.9, d = densa(o.cerrado ? pts.concat([pts[0]]) : pts, 4), a0 = o.a != null ? o.a : 1;
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = col(o.c); if (o.dash) ctx.setLineDash(o.dash);
      for (var p = 0; p < 2; p++) {
        var q = amp > 0 ? pulso(d, amp * (p ? .8 : 1)) : d; ctx.lineWidth = w * (p ? .65 : 1.1);
        if (!p && q.length > 6) { var i0 = 0; while (i0 < q.length - 1) { var i1 = Math.min(q.length - 1, i0 + 4 + Math.floor(r() * 8)); ctx.globalAlpha = a0 * (.62 + r() * .33); camino(q.slice(i0, i1 + 1)); ctx.stroke(); i0 = i1; } }
        else { ctx.globalAlpha = a0 * (p ? .4 : .8); camino(q); ctx.stroke(); }
      }
      ctx.restore();
    };
    /** Recta con regla: se pasa un poco de los extremos (o.exacta lo evita). */
    P.recta = function (x1, y1, x2, y2, o) {
      o = Object.assign({ amp: .22 }, o || {});
      if (!o.exacta) { var dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, e1 = r() * 1.6, e2 = r() * 1.6; x1 -= dx / l * e1; y1 -= dy / l * e1; x2 += dx / l * e2; y2 += dy / l * e2; }
      P.poly([[x1, y1], [x2, y2]], o);
    };
    /** Circunferencia con compás: radio exacto, el trazo se pasa del inicio. */
    P.circulo = function (cx, cy, R, o) {
      o = o || {};
      if (o.relleno) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = col(o.relleno); ctx.globalAlpha = o.ra || .2; ctx.fill(); ctx.restore(); }
      var n = Math.max(24, Math.round(R * .8)), t0 = r() * 6.28, sobra = .12 + r() * .2, pts = [];
      for (var i = 0; i <= n; i++) { var t = t0 + (6.283 + sobra) * i / n; pts.push([cx + R * Math.cos(t), cy + R * Math.sin(t)]); }
      P.poly(pts, Object.assign({ amp: .2 }, o));
    };
    P.arco = function (cx, cy, R, a0, a1, o) { var n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * R / 5)), pts = []; for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } P.poly(pts, Object.assign({ amp: .2 }, o || {})); };
    P.flecha = function (x1, y1, x2, y2, o) {
      o = o || {}; var h = o.h || 9, a = Math.atan2(y2 - y1, x2 - x1);
      P.recta(x1, y1, x2, y2, o);
      [-.42, .42].forEach(function (s) { P.recta(x2, y2, x2 - h * Math.cos(a + s), y2 - h * Math.sin(a + s), Object.assign({}, o, { exacta: true, dash: null })); });
      if (o.doble) [-.42, .42].forEach(function (s) { P.recta(x1, y1, x1 + h * Math.cos(a + s), y1 + h * Math.sin(a + s), Object.assign({}, o, { exacta: true, dash: null })); });
    };
    /** Polo o marca: mancha de tinta irregular; o.hueco para círculo vacío. */
    P.punto = function (x, y, R, o) {
      o = o || {}; ctx.save(); ctx.beginPath();
      for (var i = 0; i <= 7; i++) { var t = 6.283 * i / 7, rr = R * (.8 + r() * .35); i ? ctx.lineTo(x + rr * Math.cos(t), y + rr * Math.sin(t)) : ctx.moveTo(x + rr * Math.cos(t), y + rr * Math.sin(t)); }
      ctx.closePath(); ctx.strokeStyle = ctx.fillStyle = col(o.c); ctx.globalAlpha = .88;
      if (o.hueco) { ctx.lineWidth = o.w || 1.2; ctx.stroke(); } else ctx.fill();
      ctx.restore();
    };
    /** Texto manuscrito: o = {t (tamaño), b (negrita), c, al, rot, base} */
    P.texto = function (s, x, y, o) {
      o = o || {}; var lineas = String(s).split("\n"), t = o.t || 15;
      ctx.save(); ctx.font = (o.b ? "700 " : "") + t + "px " + fuente; ctx.fillStyle = col(o.c);
      ctx.textAlign = o.al || "center"; ctx.textBaseline = "middle";
      ctx.translate(x + j(.5), y + j(.5)); ctx.rotate((o.rot || 0) + j(.03)); ctx.globalAlpha = .93;
      lineas.forEach(function (l, i) { ctx.fillText(l, j(.4), (i - (lineas.length - 1) / 2) * t * 1.15); });
      ctx.restore();
    };
    /** Rayado de lápiz de color dentro de un polígono. o = {c, a, sep, ang} */
    P.rayado = function (poly, o) {
      o = o || {}; var b = caja(poly), ang = rad(o.ang != null ? o.ang : 45), ca = Math.cos(ang), sa = Math.sin(ang), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, d = Math.hypot(b[2] - b[0], b[3] - b[1]) / 2 + 4;
      ctx.save(); recorte(poly); ctx.clip(); ctx.strokeStyle = col(o.c); ctx.lineCap = "round";
      for (var s = -d; s < d; s += (o.sep || 5) * (.82 + r() * .36)) {
        ctx.globalAlpha = (o.a || .45) * (.65 + r() * .45); ctx.lineWidth = (o.w || .8) * (.8 + r() * .5);
        var mx = cx - sa * s, my = cy + ca * s, w = j(1.2);
        ctx.beginPath(); ctx.moveTo(mx - ca * d, my - sa * d + w); ctx.lineTo(mx + ca * d, my + sa * d - w); ctx.stroke();
      }
      ctx.restore();
    };
    /** Sombreado suave (relleno + rayado fino). */
    P.sombra = function (poly, c, a) { ctx.save(); recorte(poly); ctx.fillStyle = col(c); ctx.globalAlpha = a || .12; ctx.fill(); ctx.restore(); P.rayado(poly, { c: c, a: (a || .12) * 2.2, sep: 3.2, ang: 60, w: .6 }); };
    /** Punteado (arena, arenisca, relleno). */
    P.punteado = function (poly, o) {
      o = o || {}; var b = caja(poly), n = Math.round((b[2] - b[0]) * (b[3] - b[1]) * (o.dens || .03));
      ctx.save(); recorte(poly); ctx.clip();
      for (var i = 0; i < n; i++) P.punto(b[0] + r() * (b[2] - b[0]), b[1] + r() * (b[3] - b[1]), (o.R || .9) * (.6 + r() * .8), { c: o.c });
      ctx.restore();
    };
    /** Patrón repetido dentro de un polígono: fn(x, y) dibuja una marca. */
    P.patron = function (poly, dx, dy, fn, desfase) {
      var b = caja(poly); ctx.save(); recorte(poly); ctx.clip();
      for (var y = b[1] + dy / 2, f = 0; y < b[3] + dy; y += dy, f++) for (var x = b[0] + (desfase && f % 2 ? dx / 2 : 0); x < b[2] + dx; x += dx) fn(x + j(.8), y + j(.8), f);
      ctx.restore();
    };
    P.rect = function (x, y, w, h, o) { P.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], Object.assign({ cerrado: true }, o || {})); };
    /** Cota con flechas en los dos extremos y su texto. */
    P.cota = function (x1, y1, x2, y2, txt, o) {
      o = o || {}; P.flecha(x1, y1, x2, y2, { doble: true, h: 6, w: 1, c: o.c || "rojo" });
      var a = Math.atan2(y2 - y1, x2 - x1), off = o.off != null ? o.off : -11, rot = Math.abs(a) > Math.PI / 2 ? a + Math.PI : a;
      P.texto(txt, (x1 + x2) / 2 - Math.sin(a) * off, (y1 + y2) / 2 + Math.cos(a) * off, { t: o.t || 13, c: o.c || "rojo", rot: o.recto ? 0 : rot });
    };
    /** Ángulo marcado con arco y rótulo. */
    P.angulo = function (cx, cy, R, a0, a1, txt, o) { o = o || {}; P.arco(cx, cy, R, a0, a1, { c: o.c || "rojo", w: 1.1 }); var m = (a0 + a1) / 2; P.texto(txt, cx + (R + 14) * Math.cos(m), cy + (R + 12) * Math.sin(m), { t: o.t || 13, c: o.c || "rojo" }); };
    P.norte = function (x, y, s, o) { o = o || {}; P.poly([[x, y - s], [x - s * .35, y + s * .35], [x, y + s * .1], [x + s * .35, y + s * .35]], { cerrado: true, w: 1.2, c: o.c }); P.rayado([[x, y - s], [x, y + s * .1], [x + s * .35, y + s * .35]], { c: o.c, sep: 2.2, a: .8 }); P.texto("N", x, y - s - 10, { t: 14, b: true, c: o.c }); };
    return P;
  }

  // ── geometría ───────────────────────────────────────────────────────────────
  var geo = {
    rad: rad, deg: deg,
    /** Vector (este, norte, abajo) de una línea con tendencia y buzamiento. */
    dir: function (tr, pl) { return { e: Math.cos(rad(pl)) * Math.sin(rad(tr)), n: Math.cos(rad(pl)) * Math.cos(rad(tr)), d: Math.sin(rad(pl)) }; },
    /** Puntos del círculo máximo de un plano (DB, buz.) en el hemisferio inferior. */
    circuloMax: function (dd, dip, n) { n = n || 72; var s = geo.dir(dd - 90, 0), b = geo.dir(dd, dip), o = []; for (var i = 0; i <= n; i++) { var t = Math.PI * i / n, c = Math.cos(t), z = Math.sin(t); o.push({ e: s.e * c + b.e * z, n: s.n * c + b.n * z, d: s.d * c + b.d * z }); } return o; },
    polo: function (dd, dip) { return geo.dir(dd + 180, 90 - dip); },
    /** Proyección al plano ecuatorial: [x, y] con radio 1 en la primitiva. */
    proyectar: function (v, modo) { var h = Math.hypot(v.e, v.n), th = Math.acos(Math.max(-1, Math.min(1, v.d))), rr = modo === "wulff" ? Math.tan(th / 2) : Math.SQRT2 * Math.sin(th / 2), k = h > 1e-9 ? rr / h : 0; return [v.e * k, v.n * k]; },
    /** «N50E/50SE», «WE/00S», «N30W90NE» → {dd, dip}; también acepta [dd, dip]. */
    plano: function (x) {
      if (Array.isArray(x)) return { dd: x[0], dip: x[1] };
      var s = String(x).toUpperCase().replace(/[°\s]/g, ""), m = s.match(/^(N\d+(?:\.\d+)?[EW]|EW|WE|NS|SN|E|W)\/?(\d+(?:\.\d+)?)(N|S|E|W|NE|NW|SE|SW)?$/);
      if (!m) return null;
      var a = /^(EW|WE|E|W)$/.test(m[1]) ? 90 : /^(NS|SN)$/.test(m[1]) ? 0 : (function () { var k = m[1].match(/^N(\d+(?:\.\d+)?)([EW])$/); return k[2] === "E" ? +k[1] : (360 - +k[1]) % 360; })();
      var Q = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }, c1 = (a + 90) % 360, c2 = (a + 270) % 360, dd = c1;
      if (m[3]) { var q = Q[m[3]], d = function (v) { return Math.min(Math.abs(v - q), 360 - Math.abs(v - q)); }; dd = d(c1) <= d(c2) ? c1 : c2; }
      return { dd: dd, dip: +m[2] };
    }
  };

  /** Ejes con marcas: devuelve {X, Y} para pasar datos a pantalla. o = {x0,x1,y0,y1,logx,marcasX,marcasY,xlab,ylab,rejilla} */
  function ejes(P, caja, o) {
    var x = caja[0], y = caja[1], w = caja[2], h = caja[3];
    var lx = function (v) { return o.logx ? Math.log10(v) : v; };
    var X = function (v) { return x + (lx(v) - lx(o.x0)) / (lx(o.x1) - lx(o.x0)) * w; }, Y = function (v) { return y + h - (v - o.y0) / (o.y1 - o.y0) * h; };
    (o.marcasX || []).forEach(function (v) { if (o.rejilla) P.recta(X(v), y, X(v), y + h, { c: "gris", w: .6, a: .5, exacta: true }); P.recta(X(v), y + h, X(v), y + h + 5, { c: "negro", w: 1, exacta: true }); P.texto(String(v), X(v), y + h + 16, { t: 12, c: "negro" }); });
    (o.marcasY || []).forEach(function (v) { if (o.rejilla) P.recta(x, Y(v), x + w, Y(v), { c: "gris", w: .6, a: .5, exacta: true }); P.recta(x - 5, Y(v), x, Y(v), { c: "negro", w: 1, exacta: true }); P.texto(String(v), x - 9, Y(v), { t: 12, c: "negro", al: "right" }); });
    P.flecha(x, y + h, x + w + 14, y + h, { c: "negro", w: 1.2 }); P.flecha(x, y + h, x, y - 14, { c: "negro", w: 1.2 });
    if (o.xlab) P.texto(o.xlab, x + w / 2, y + h + 36, { t: 14, c: "negro" });
    if (o.ylab) P.texto(o.ylab, x - 44, y + h / 2, { t: 14, c: "negro", rot: -Math.PI / 2 });
    return { X: X, Y: Y };
  }

  // ── figuras ─────────────────────────────────────────────────────────────────
  var F = {};

  /** Círculo de Mohr. d = {sx, sy, txy, u, elemento: true} */
  F.mohr = function (P, W, H, d) {
    var sx = +d.sx, sy = +d.sy, t = +d.txy, u = d.u || "", c = (sx + sy) / 2, R = Math.hypot((sx - sy) / 2, t);
    var lo = Math.min(0, c - R), hi = c + R, k = Math.min((W * .62) / (hi - lo || 1), (H - 60) / (2 * R || 1)), ox = 50 - lo * k, oy = H / 2;
    var X = function (s) { return ox + s * k; }, Y = function (v) { return oy - v * k; }, f = function (v) { return (Math.round(v * 100) / 100).toString(); };
    P.flecha(30, oy, X(hi) + 50, oy, { c: "negro", w: 1.2 }); P.texto("σ", X(hi) + 46, oy - 14, { c: "negro" });
    P.flecha(X(0), H - 14, X(0), 14, { c: "negro", w: 1.2 }); P.texto("τ", X(0) + 14, 18, { c: "negro" });
    P.circulo(X(c), oy, R * k, { w: 1.6 });
    P.punto(X(c + R), oy, 3.5); P.texto("σ1 = " + f(c + R), X(c + R) + 6, oy + 16, { al: "left", t: 14 });
    P.punto(X(c - R), oy, 3.5); P.texto("σ3 = " + f(c - R), X(c - R) - 6, oy + 16, { al: "right", t: 14 });
    P.punto(X(c), Y(R), 4, { c: "rojo" }); P.texto("τmax = " + f(R) + (u ? " " + u : ""), X(c) + 10, Y(R) - 12, { al: "left", t: 14, c: "rojo", b: true });
    P.recta(X(c), oy, X(c), Y(R), { c: "rojo", w: 1, dash: [5, 4] });
    P.punto(X(sx), Y(t), 3); P.texto("(σx, τxy)", X(sx) - 6, Y(t) - 12, { al: "right", t: 13 });
    P.punto(X(sy), Y(-t), 3); P.texto("(σy, −τxy)", X(sy) + 6, Y(-t) + 14, { al: "left", t: 13 });
    P.recta(X(sx), Y(t), X(sy), Y(-t), { c: "gris", w: 1 });
    if (d.elemento !== false) {
      var ths = geo.deg(Math.atan2(-(sx - sy), 2 * t)) / 2; if (ths > 90) ths -= 90; if (ths < -90) ths += 90;
      F.elemento(P, W, H, { th: ths, cx: W - 70, cy: 70, h: 24, rotulo: (Math.round(ths * 10) / 10) + "°" });
    }
  };
  /** Elemento girado θ (antihorario desde X). d = {th, cx, cy, h, rotulo} */
  F.elemento = function (P, W, H, d) {
    var cx = d.cx || W / 2, cy = d.cy || H / 2, h = d.h || Math.min(W, H) / 5, a = rad(-(+d.th || 0));
    var pts = [[-h, -h], [h, -h], [h, h], [-h, h]].map(function (q) { return [cx + q[0] * Math.cos(a) - q[1] * Math.sin(a), cy + q[0] * Math.sin(a) + q[1] * Math.cos(a)]; });
    P.recta(cx - 2.1 * h, cy, cx + 2.3 * h, cy, { c: "gris", w: .9, dash: [4, 4] }); P.texto("X", cx + 2.5 * h, cy, { t: 12, c: "gris" });
    P.poly(pts, { cerrado: true, w: 1.4 });
    var mx = (pts[1][0] + pts[2][0]) / 2, my = (pts[1][1] + pts[2][1]) / 2, nx = Math.cos(a), ny = Math.sin(a);
    P.flecha(mx, my, mx + nx * h * .9, my + ny * h * .9, { c: "rojo", w: 1.4, h: 7 });
    P.texto(d.rotulo || ((+d.th || 0) + "°"), cx + h * 1.5, cy - h * 1.1, { t: 13, c: "rojo" });
  };

  /** Red estereográfica. d = {planos: ["N50E/50SE", [140,50], …], proy: "schmidt"|"wulff", red: true, nombres} */
  F.red = function (P, W, H, d) {
    var C = [W / 2, H / 2 + 6], R = Math.min(W, H) / 2 - 34, modo = d.proy || "schmidt";
    var xy = function (v) { var q = geo.proyectar(v, modo); return [C[0] + R * q[0], C[1] - R * q[1]]; };
    if (d.red) {
      for (var b = 10; b < 90; b += 10) { P.poly(geo.circuloMax(90, b, 36).map(xy), { c: "gris", w: .5, a: .45, amp: .2 }); P.poly(geo.circuloMax(270, b, 36).map(xy), { c: "gris", w: .5, a: .45, amp: .2 }); }
      for (var al = 10; al < 180; al += 10) { var arr = []; for (var i = 0; i <= 36; i++) { var f = Math.PI * i / 36; arr.push({ n: Math.cos(rad(al)), e: Math.sin(rad(al)) * Math.cos(f), d: Math.sin(rad(al)) * Math.sin(f) }); } P.poly(arr.map(xy), { c: "gris", w: .5, a: .45, amp: .2 }); }
    }
    P.circulo(C[0], C[1], R, { c: "negro", w: 1.5 });
    P.recta(C[0] - 6, C[1], C[0] + 6, C[1], { c: "negro", w: 1 }); P.recta(C[0], C[1] - 6, C[0], C[1] + 6, { c: "negro", w: 1 });
    [["N", 0], ["E", 90], ["S", 180], ["W", 270]].forEach(function (q) { var a = rad(q[1]); P.recta(C[0] + R * Math.sin(a), C[1] - R * Math.cos(a), C[0] + (R + 8) * Math.sin(a), C[1] - (R + 8) * Math.cos(a), { c: "negro", w: 1.2 }); P.texto(q[0], C[0] + (R + 20) * Math.sin(a), C[1] - (R + 20) * Math.cos(a), { t: 15, c: "rojo", b: true }); });
    (d.planos || []).map(geo.plano).forEach(function (s, i) {
      if (!s) return; var c = FAM[i % FAM.length];
      if (s.dip < .5) P.circulo(C[0], C[1], R - 3, { c: c, w: 1.6 }); else P.poly(geo.circuloMax(s.dd, s.dip).map(xy), { c: c, w: 1.7 });
      var p = xy(geo.polo(s.dd, s.dip)), dx = p[0] - C[0], dy = p[1] - C[1], l = Math.hypot(dx, dy);
      P.punto(p[0], p[1], 4.5, { c: c });
      P.texto((d.nombres || [])[i] || "P" + (i + 1), p[0] + (l > 2 ? dx / l * 16 : 14), p[1] + (l > 2 ? dy / l * 16 : -12), { t: 14, c: c, b: true });
    });
  };

  /** Semiesfera inferior en 3D con planos y polos. d = {planos, az, el} */
  F.semiesfera = function (P, W, H, d) {
    var R = Math.min(W * .4, H * .42), C = [W / 2, H * .4], az = rad(d.az != null ? d.az : -25), el = rad(d.el != null ? d.el : 28);
    function pr(v) { var x = v.e * Math.cos(az) - v.n * Math.sin(az), dep = v.e * Math.sin(az) + v.n * Math.cos(az), up = -v.d; return [C[0] + R * x, C[1] - R * (up * Math.cos(el) + dep * Math.sin(el))]; }
    var borde = [], bajo = [];
    for (var i = 0; i <= 96; i++) { var t = 2 * Math.PI * i / 96; borde.push(pr({ e: Math.sin(t), n: Math.cos(t), d: 0 })); }
    for (i = 0; i <= 60; i++) { var u = Math.PI * i / 60; bajo.push([C[0] + R * Math.cos(u), C[1] + R * Math.sin(u)]); }
    P.rayado(bajo, { c: "gris", a: .12, sep: 7 }); P.poly(bajo, { c: "negro", w: 1.5 }); P.poly(borde, { c: "negro", w: 1.4 });
    [["N", 0], ["E", 90], ["S", 180], ["W", 270]].forEach(function (q) { var p = pr({ e: 1.14 * Math.sin(rad(q[1])), n: 1.14 * Math.cos(rad(q[1])), d: 0 }); P.texto(q[0], p[0], p[1], { t: 15, c: "rojo", b: true }); });
    (d.planos || []).map(geo.plano).forEach(function (s, i) {
      if (!s) return; var c = FAM[i % FAM.length], arco = geo.circuloMax(s.dd, s.dip).map(pr);
      if (s.dip > .5) { P.rayado([C].concat(arco), { c: c, a: .3, sep: 5 }); P.poly(arco, { c: c, w: 1.7 }); } else P.rayado(borde, { c: c, a: .18, sep: 6 });
      var pp = pr(geo.polo(s.dd, s.dip)); P.recta(C[0], C[1], pp[0], pp[1], { c: c, w: 1.1, dash: [5, 4] }); P.punto(pp[0], pp[1], 4.5, { c: c });
      P.texto("P" + (i + 1), pp[0] + (pp[0] >= C[0] ? 15 : -15), pp[1] + 12, { t: 14, c: c, b: true });
    });
    P.punto(C[0], C[1], 2.5, { c: "negro" });
  };

  /** Bloque diagrama con rumbo, dirección de buzamiento y buzamiento. d = {plano: "N40E/35SE", rotulo} */
  F.bloque = function (P, W, H, d) {
    var s = geo.plano(d.plano || "N40E/35SE"), C = [W * .42, H * .38], k = Math.min(W * .26, H * .3);
    var pr = function (v) { return [C[0] + k * (v.e + .5 * v.n), C[1] + k * (v.d - .38 * v.n)]; };  // perspectiva caballera: el norte se aleja hacia arriba y a la derecha
    var top = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (q) { return pr({ e: q[0], n: q[1], d: 0 }); });
    var fondo = function (q) { return pr({ e: q[0], n: q[1], d: 1.25 }); }, frente = [[-1, -1], [1, -1], [1, 1]];
    P.sombra([top[0], top[1], fondo([1, -1]), fondo([-1, -1])], "gris", .08); P.sombra([top[1], top[2], fondo([1, 1]), fondo([1, -1])], "gris", .14);
    frente.forEach(function (q) { var t = pr({ e: q[0], n: q[1], d: 0 }), f = fondo(q); P.recta(t[0], t[1], f[0], f[1], { c: "gris", w: 1 }); });
    P.poly(frente.map(fondo), { c: "gris", w: 1 });
    P.poly(top, { cerrado: true, c: "negro", w: 1.2 });
    var sv = geo.dir(s.dd - 90, 0), bv = geo.dir(s.dd, s.dip), pl = [[-1, 0], [1, 0], [1, 1.2], [-1, 1.2]].map(function (q) { return pr({ e: sv.e * q[0] + bv.e * q[1], n: sv.n * q[0] + bv.n * q[1], d: sv.d * q[0] + bv.d * q[1] }); });
    P.rayado(pl, { c: FAM[0], a: .35, sep: 5 }); P.poly(pl, { cerrado: true, c: FAM[0], w: 1.4 });
    var a = pr({ e: -sv.e * 1.25, n: -sv.n * 1.25, d: 0 }), b = pr({ e: sv.e * 1.25, n: sv.n * 1.25, d: 0 });
    P.recta(a[0], a[1], b[0], b[1], { c: "azul", w: 2 }); P.texto("rumbo", b[0] + (b[0] > a[0] ? 8 : -8), b[1] - 14, { al: b[0] > a[0] ? "left" : "right", t: 14, c: "azul" });
    var o = pr({ e: 0, n: 0, d: 0 }), h = geo.dir(s.dd, 0), ph = pr({ e: h.e, n: h.n, d: 0 }), pb = pr({ e: bv.e, n: bv.n, d: bv.d });
    P.flecha(o[0], o[1], ph[0], ph[1], { c: "verde", w: 1.5, dash: [6, 4] }); P.texto("DB " + String(Math.round(s.dd)).padStart(3, "0") + "°", ph[0] + 8, ph[1] - 4, { al: "left", t: 14, c: "verde", b: true });
    P.flecha(o[0], o[1], pb[0], pb[1], { c: "rojo", w: 1.6 }); P.texto("buz. " + s.dip + "°", pb[0] + 8, pb[1] + 12, { al: "left", t: 14, c: "rojo", b: true });
    P.norte(W - 30, 40, 18);
    if (d.rotulo) P.texto(d.rotulo, W / 2, H - 14, { t: 14 });
  };

  /** Elemento a profundidad con σv y σH. d = {z, sv, sh, u} */
  F.insitu = function (P, W, H, d) {
    var sup = []; for (var i = 0; i <= 30; i++) sup.push([10 + (W - 20) * i / 30, 26 + 5 * Math.sin(i * .7) + P.j(1.5)]); P.poly(sup, { c: "verde", w: 1.6 });
    var cx = W * .55, cy = H * .62, h = Math.min(W, H) * .12;
    P.flecha(40, (32 + cy - h) / 2, 40, 32, { c: "negro", w: 1, h: 7 }); P.flecha(40, (32 + cy - h) / 2, 40, cy - h, { c: "negro", w: 1, h: 7 }); P.texto((d.z || 300) + " m", 54, (32 + cy - h) / 2, { al: "left", t: 14, c: "negro" });
    P.rect(cx - h, cy - h, 2 * h, 2 * h, { w: 1.5 });
    P.flecha(cx, cy - h - 42, cx, cy - h - 3, { c: "rojo", w: 1.6 }); P.flecha(cx, cy + h + 40, cx, cy + h + 3, { c: "rojo", w: 1.6 });
    P.flecha(cx - h - 30, cy, cx - h - 3, cy, { c: "azul", w: 1.6 }); P.flecha(cx + h + 30, cy, cx + h + 3, cy, { c: "azul", w: 1.6 });
    P.texto("σv = " + d.sv + " " + (d.u || "MPa"), cx + 12, cy - h - 30, { al: "left", t: 14, c: "rojo" });
    P.texto("σH = " + d.sh + "\n" + (d.u || "MPa"), cx + h + 36, cy, { al: "left", t: 14, c: "azul", b: true });
  };

  /** Columna estratigráfica. d = {capas: [{lit: "arenisca"|"lutita"|"caliza"|"conglomerado"|"ignea"|"carbon"|"suelo", e: espesor, nombre}], unidad: "m"} */
  var LIT = {
    arenisca: function (P, poly) { P.punteado(poly, { dens: .05, c: "ocre" }); },
    lutita: function (P, poly) { P.patron(poly, 16, 7, function (x, y) { P.recta(x - 5, y, x + 5, y, { c: "gris", w: .9, exacta: true, amp: .1 }); }, true); },
    caliza: function (P, poly) { P.patron(poly, 26, 12, function (x, y) { P.recta(x - 13, y + 6, x + 13, y + 6, { c: "azul", w: .8, exacta: true, amp: .1 }); P.recta(x, y - 6, x, y + 6, { c: "azul", w: .8, exacta: true, amp: .1 }); }, true); },
    conglomerado: function (P, poly) { P.patron(poly, 14, 12, function (x, y) { P.circulo(x, y, 2.5 + P.r() * 2.5, { c: "marron", w: .8 }); }, true); },
    ignea: function (P, poly) { P.patron(poly, 14, 12, function (x, y) { P.recta(x - 3, y, x + 3, y, { c: "rojo", w: .9, exacta: true }); P.recta(x, y - 3, x, y + 3, { c: "rojo", w: .9, exacta: true }); }, true); },
    carbon: function (P, poly) { P.sombra(poly, "negro", .5); },
    suelo: function (P, poly) { P.patron(poly, 12, 9, function (x, y) { P.punto(x, y, 1, { c: "marron" }); P.recta(x + 2, y + 2, x + 6, y - 2, { c: "verde", w: .8, exacta: true }); }, true); }
  };
  F.columna = function (P, W, H, d) {
    var tot = (d.capas || []).reduce(function (a, c) { return a + (+c.e || 1); }, 0), x = W * .22, w = W * .28, y0 = 18, alto = H - 36, y = y0;
    (d.capas || []).forEach(function (c) {
      var h = (+c.e || 1) / tot * alto, poly = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      (LIT[c.lit] || function () {})(P, poly); P.poly(poly, { cerrado: true, c: "negro", w: 1.2 });
      P.texto(c.nombre || c.lit, x + w + 14, y + h / 2, { al: "left", t: 14 });
      P.texto(c.e + " " + (d.unidad || "m"), x - 12, y + h / 2, { al: "right", t: 13, c: "gris" });
      y += h;
    });
    P.flecha(x - 50, y0 + alto, x - 50, y0, { c: "negro", w: 1 }); P.texto("más joven", x - 50, y0 - 8, { t: 12, c: "gris" });
  };

  /** Corte geológico con falla o pliegue. d = {tipo: "normal"|"inversa"|"anticlinal"|"sinclinal", capas: ["arenisca","lutita",…]} */
  F.corte = function (P, W, H, d) {
    var capas = d.capas || ["arenisca", "lutita", "caliza", "lutita", "arenisca"], n = capas.length, top = 30, alto = H - 60, e = alto / n, x0 = 20, x1 = W - 20;
    if (d.tipo === "anticlinal" || d.tipo === "sinclinal") {
      var sg = d.tipo === "anticlinal" ? -1 : 1, amp = alto * .2; e = (alto - 2 * amp) / n;
      var yb = function (x, k) { return top + amp + k * e + sg * amp * Math.cos((x - W / 2) / (W / 2) * Math.PI); };
      for (var k = 0; k < n; k++) {
        var arr = [], abj = []; for (var i = 0; i <= 40; i++) { var x = x0 + (x1 - x0) * i / 40; arr.push([x, yb(x, k)]); abj.push([x, yb(x, k + 1)]); }
        var poly = arr.concat(abj.reverse()); (LIT[capas[k]] || function () {})(P, poly); P.poly(arr, { c: "negro", w: 1.1 });
      }
      P.recta(W / 2, top - 10, W / 2, top + alto + 10, { c: "rojo", w: 1.2, dash: [8, 5] }); P.texto("plano axial", W / 2 + 8, top - 6, { al: "left", t: 13, c: "rojo" });
      P.texto(d.tipo === "anticlinal" ? "Anticlinal" : "Sinclinal", 70, H - 12, { t: 15, b: true });
      return;
    }
    var buz = rad(60), salto = e * 1.2 * (d.tipo === "inversa" ? -1 : 1), xf = function (y) { return W / 2 + (y - top) / Math.tan(buz) - alto / Math.tan(buz) / 2; };
    for (var c = 0; c < n; c++) {
      var ya = top + c * e, yb2 = ya + e;
      var izq = [[x0, ya], [xf(ya), ya], [xf(yb2), yb2], [x0, yb2]], ys = function (y) { return Math.min(top + alto, Math.max(top, y + salto)); };
      var der = [[xf(ys(ya)), ys(ya)], [x1, ys(ya)], [x1, ys(yb2)], [xf(ys(yb2)), ys(yb2)]];
      [izq, der].forEach(function (poly) { (LIT[capas[c]] || function () {})(P, poly); P.recta(poly[0][0], poly[0][1], poly[1][0], poly[1][1], { c: "negro", w: 1.1 }); });
    }
    P.recta(xf(top - 6), top - 6, xf(top + alto + 6), top + alto + 6, { c: "rojo", w: 2.2 });
    var ym = top + alto / 2, mx = xf(ym), ux = Math.cos(buz), uy = Math.sin(buz), sg2 = salto > 0 ? 1 : -1;
    P.flecha(mx + 16 - 11 * ux * sg2, ym - 11 * uy * sg2, mx + 16 + 11 * ux * sg2, ym + 11 * uy * sg2, { c: "rojo", w: 1.4, h: 6 });
    P.flecha(mx - 16 + 11 * ux * sg2, ym + 11 * uy * sg2, mx - 16 - 11 * ux * sg2, ym - 11 * uy * sg2, { c: "rojo", w: 1.4, h: 6 });
    P.texto(d.tipo === "inversa" ? "Falla inversa" : "Falla normal", 80, H - 12, { t: 15, b: true });
  };

  /** Perfil de talud de bancos. d = {bancos: 3, hb: 15, berma: 8, cara: 70, u: "m"} */
  F.talud = function (P, W, H, d) {
    var n = +d.bancos || 3, hb = +d.hb || 15, be = +d.berma || 8, cara = rad(+d.cara || 70), dx = hb / Math.tan(cara), anchoT = n * dx + (n - 1) * be, altoT = n * hb;
    var k = Math.min((W - 220) / anchoT, (H - 60) / altoT), x0 = (W - anchoT * k) / 2 - 30, y0 = H - 28, pts = [[10, y0], [x0, y0]], x = x0, y = y0;
    for (var i = 0; i < n; i++) { x += dx * k; y -= hb * k; pts.push([x, y]); if (i < n - 1) { x += be * k; pts.push([x, y]); } }
    pts.push([W - 10, y]);
    P.sombra(pts.concat([[W - 10, y0 + 20], [10, y0 + 20]]), "ocre", .12); P.poly(pts, { c: "negro", w: 1.6 });
    P.recta(x0, y0, pts[pts.length - 2][0], y, { c: "rojo", w: 1.2, dash: [7, 5] });
    var inter = Math.atan2(altoT, anchoT); P.arco(x0, y0, 60, -inter, 0, { c: "rojo", w: 1.1 }); P.texto("θ interrampa = " + Math.round(geo.deg(inter)) + "°", x0 + 66, y0 - 10, { al: "left", t: 13, c: "rojo" });
    P.arco(pts[1][0], pts[1][1], 24, -cara, 0, { c: "azul", w: 1.1 }); P.texto("cara " + (+d.cara || 70) + "°", pts[1][0] - 6, pts[1][1] - 34, { al: "right", t: 13, c: "azul" });
    var cs = pts[pts.length - 2]; P.cota(cs[0] + 10, cs[1] + hb * k, cs[0] + 10, cs[1], "", { c: "verde" }); P.texto("H banco " + hb + " " + (d.u || "m"), cs[0] + 18, cs[1] + hb * k / 2, { al: "left", t: 13, c: "verde" });
    if (n > 1) { P.cota(pts[2][0], pts[2][1] - 10, pts[3][0], pts[3][1] - 10, "", { c: "verde" }); P.texto("berma " + be + " " + (d.u || "m"), pts[2][0] - 8, pts[2][1] - 12, { al: "right", t: 13, c: "verde" }); }
  };

  /** Sección de labor en herradura con pernos y shotcrete. d = {ancho: 4, alto: 4, pernos: 7, L: 1.8, shotcrete: true, u: "m"} */
  F.labor = function (P, W, H, d) {
    var A = +d.ancho || 4, Al = +d.alto || 4, k = Math.min((W - 170) / A, (H - 70) / Al) * .72, cx = W / 2, yb = H - 30, rr = A / 2 * k, hp = (Al - A / 2) * k;
    var cont = [[cx - rr, yb], [cx - rr, yb - hp]]; for (var i = 0; i <= 30; i++) { var a = Math.PI + Math.PI * i / 30; cont.push([cx + rr * Math.cos(a), yb - hp + rr * Math.sin(a)]); } cont.push([cx + rr, yb]);
    var fuera = cont.map(function (q) { var v = [q[0] - cx, q[1] - (yb - hp)], l = Math.hypot(v[0], Math.min(0, v[1])) || 1; return q[1] > yb - hp ? [q[0] + Math.sign(v[0]) * 40, q[1]] : [q[0] + v[0] / l * 40, q[1] + v[1] / l * 40]; });
    P.sombra(fuera.concat(cont.slice().reverse()), "gris", .1);
    if (d.shotcrete !== false) { var dentro = cont.map(function (q) { var v = [q[0] - cx, q[1] - (yb - hp)], l = Math.hypot(v[0], Math.min(0, v[1])) || 1; return q[1] > yb - hp ? [q[0] - Math.sign(v[0]) * 6, q[1]] : [q[0] - v[0] / l * 6, q[1] - v[1] / l * 6]; }); P.rayado(cont.concat(dentro.slice().reverse()), { c: "gris", a: .7, sep: 2.5 }); P.texto("shotcrete", cx + rr + 8, yb - hp + 26, { al: "left", t: 13, c: "gris" }); }
    P.poly(cont, { c: "negro", w: 1.8 }); P.recta(cx - rr - 30, yb, cx + rr + 30, yb, { c: "negro", w: 1.4 });
    var np = +d.pernos || 7, L = (+d.L || 1.8) * k;
    for (i = 0; i < np; i++) { var t = Math.PI + Math.PI * (i + .5) / np, px = cx + rr * Math.cos(t), py = yb - hp + rr * Math.sin(t); P.recta(px, py, px + L * Math.cos(t), py + L * Math.sin(t), { c: "rojo", w: 1.8 }); P.recta(px - 4 * Math.sin(t), py + 4 * Math.cos(t), px + 4 * Math.sin(t), py - 4 * Math.cos(t), { c: "rojo", w: 1.6, exacta: true }); }
    P.texto("pernos L = " + (d.L || 1.8) + " " + (d.u || "m"), 12, 14, { al: "left", t: 13, c: "rojo" });
    P.cota(cx - rr, yb + 14, cx + rr, yb + 14, A + " " + (d.u || "m"), { off: 12, c: "verde" });
    P.cota(cx + rr + 56, yb, cx + rr + 56, yb - hp - rr, "", { c: "verde" }); P.texto(Al + " " + (d.u || "m"), cx + rr + 64, yb - (hp + rr) / 2, { al: "left", t: 13, c: "verde" });
  };

  /** Malla de perforación de un frente. d = {ancho: 4, alto: 4} */
  F.malla = function (P, W, H, d) {
    var A = +d.ancho || 4, Al = +d.alto || 4, k = Math.min((W - 60) / A, (H - 40) / Al) * .9, cx = W / 2, yb = H - 18, rr = A / 2 * k, hp = (Al - A / 2) * k, cy = yb - hp * .55;
    var cont = [[cx - rr, yb], [cx - rr, yb - hp]]; for (var i = 0; i <= 30; i++) { var a = Math.PI + Math.PI * i / 30; cont.push([cx + rr * Math.cos(a), yb - hp + rr * Math.sin(a)]); } cont.push([cx + rr, yb]);
    P.poly(cont.concat([cont[0]]), { c: "negro", w: 1.6 });
    P.circulo(cx, cy, 7, { c: "negro", w: 1.4 }); P.texto("alivio", cx + 10, cy - 16, { al: "left", t: 12, c: "gris" });
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (q) { P.punto(cx + q[0] * 16, cy + q[1] * 16, 3.2, { c: "rojo" }); });
    for (i = 0; i < 8; i++) { var t = i / 8 * 2 * Math.PI + .3; P.punto(cx + 46 * Math.cos(t), cy + 40 * Math.sin(t), 3, { c: "naranja" }); }
    var m = 14; for (i = 1; i < m; i++) { var q = cont[Math.round(i / m * (cont.length - 1))], v = [cx - q[0], (yb - hp * .5) - q[1]], l = Math.hypot(v[0], v[1]); if (q[1] < yb - 8) P.punto(q[0] + v[0] / l * 10, q[1] + v[1] / l * 10, 3, { c: "azul" }); }
    for (i = 0; i <= 5; i++) P.punto(cx - rr + 10 + (2 * rr - 20) * i / 5, yb - 9, 3, { c: "verde" });
    P.texto("arranque", cx - 30, cy + 28, { al: "right", t: 12, c: "rojo" }); P.texto("ayudas", cx + 60, cy + 30, { al: "left", t: 12, c: "naranja" });
    P.texto("contorno", cx + rr - 8, yb - hp - rr * .7, { al: "right", t: 12, c: "azul" }); P.texto("arrastre", cx, yb + 10, { t: 12, c: "verde" });
  };

  /** Diagrama de flujo (metalurgia, procesos). d = {nodos: [{id, t, col, fila, c}], flechas: [{de, a, t}]} */
  F.flujo = function (P, W, H, d) {
    var nodos = d.nodos || [], nc = Math.max.apply(0, nodos.map(function (n) { return n.col; }).concat([0])) + 1, nf = Math.max.apply(0, nodos.map(function (n) { return n.fila || 0; }).concat([0])) + 1;
    var cw = W / nc, ch = H / nf, bw = Math.min(cw * .78, 150), bh = Math.min(ch * .55, 54), pos = {};
    nodos.forEach(function (n) { var x = cw * (n.col + .5), y = ch * ((n.fila || 0) + .5); pos[n.id] = [x, y]; if (n.c) P.sombra([[x - bw / 2, y - bh / 2], [x + bw / 2, y - bh / 2], [x + bw / 2, y + bh / 2], [x - bw / 2, y + bh / 2]], n.c, .12); P.rect(x - bw / 2, y - bh / 2, bw, bh, { w: 1.4 }); P.texto(n.t, x, y, { t: 14, b: true }); });
    (d.flechas || []).forEach(function (f) {
      var a = pos[f.de], b = pos[f.a]; if (!a || !b) return;
      var dx = b[0] - a[0], dy = b[1] - a[1], s = function (p, sg) { var tx = Math.abs(dx) > 1e-6 ? (bw / 2 + 4) / Math.abs(dx) : 1e9, ty = Math.abs(dy) > 1e-6 ? (bh / 2 + 4) / Math.abs(dy) : 1e9, t = Math.min(tx, ty); return [p[0] + sg * dx * t, p[1] + sg * dy * t]; };
      var p1 = s(a, 1), p2 = s(b, -1); P.flecha(p1[0], p1[1], p2[0], p2[1], { c: f.c || "rojo", w: 1.4 });
      if (f.t) P.texto(f.t, (p1[0] + p2[0]) / 2 + (Math.abs(dy) > Math.abs(dx) ? 8 : 0), (p1[1] + p2[1]) / 2 - (Math.abs(dy) > Math.abs(dx) ? 0 : 12), { t: 12, c: "verde", al: Math.abs(dy) > Math.abs(dx) ? "left" : "center" });
    });
  };

  /** Curva x-y (granulometría, ensayos, leyes). d = {series: [{x:[], y:[], nombre, c}], x0, x1, y0, y1, logx, marcasX, marcasY, xlab, ylab} */
  F.curva = function (P, W, H, d) {
    var A = ejes(P, [64, 18, W - 100, H - 76], Object.assign({ rejilla: true }, d));
    (d.series || []).forEach(function (s, i) { var c = s.c || FAM[i % FAM.length], pts = s.x.map(function (x, k) { return [A.X(x), A.Y(s.y[k])]; });
      P.poly(pts, { c: c, w: 1.7 }); pts.forEach(function (q) { P.punto(q[0], q[1], 3, { c: c }); });
      if (s.nombre) { var u = pts[pts.length - 1]; P.texto(s.nombre, u[0] + 6, u[1] - 12, { al: "left", t: 13, c: c, b: true }); } });
  };

  /** Barras o histograma. d = {cats: [], vals: [], y1, marcasY, xlab, ylab} */
  F.barras = function (P, W, H, d) {
    var n = d.cats.length, y1 = d.y1 || Math.max.apply(0, d.vals) * 1.15, A = ejes(P, [64, 18, W - 100, H - 76], { x0: 0, x1: n, y0: 0, y1: y1, marcasY: d.marcasY, xlab: d.xlab, ylab: d.ylab, rejilla: true });
    d.cats.forEach(function (c, i) { var x0 = A.X(i + .15), x1 = A.X(i + .85), y = A.Y(d.vals[i]), base = A.Y(0), poly = [[x0, base], [x0, y], [x1, y], [x1, base]], col = (d.colores || [])[i] || FAM[i % FAM.length];
      P.rayado(poly, { c: col, a: .55, sep: 4 }); P.poly(poly, { c: col, w: 1.3 }); P.texto(c, (x0 + x1) / 2, base + 16, { t: 12, c: "negro" }); P.texto(String(d.vals[i]), (x0 + x1) / 2, y - 10, { t: 12, c: col, b: true }); });
  };

  /** Túnel en planta con una familia: avance con o contra el buzamiento. */
  F.avance = function (P, W, H, d) {
    var w2 = W / 2;
    [[0, "Con el buzamiento", "Muy favorable / Favorable"], [w2, "Contra el buzamiento", "Regular / Desfavorable"]].forEach(function (q, k) {
      var x0 = q[0] + 15, y = H / 2, L = w2 - 70;
      P.poly([[x0, y - 22], [x0 + L, y - 22]], { c: "negro", w: 1.4 }); P.poly([[x0, y + 22], [x0 + L, y + 22]], { c: "negro", w: 1.4 });
      P.flecha(x0 + L * .6, y, x0 + L + 40, y, { c: "rojo", w: 1.8 }); P.texto("avance", x0 + L + 14, y - 14, { t: 13, c: "rojo" });
      for (var i = 0; i < 4; i++) { var x = x0 + 30 + i * (L - 40) / 3; P.recta(x, y - 52, x, y + 52, { c: "azul", w: 1.3 }); P.recta(x, y + 40, x + (k ? -9 : 9), y + 40, { c: "azul", w: 1.3, exacta: true }); }
      P.texto(q[1], x0 + L / 2, 18, { t: 15, b: true }); P.texto(q[2], x0 + L / 2, H - 14, { t: 14, c: "verde" });
    });
  };

  // ── montaje en la página ────────────────────────────────────────────────────
  function registrar(nombre, fn) { F[nombre] = fn; }
  function dibujarUna(el) {
    var fn = F[el.dataset.fig]; if (!fn) { el.textContent = "¿" + el.dataset.fig + "?"; return; }
    var W = +el.dataset.w || 600, H = +el.dataset.h || 300, ancho = Math.min(el.clientWidth || W, W), s = ancho / W, dpr = Math.max(2, window.devicePixelRatio || 1);
    var cv = el.querySelector("canvas") || el.appendChild(document.createElement("canvas"));
    cv.width = Math.round(ancho * dpr); cv.height = Math.round(H * s * dpr); cv.style.width = ancho + "px"; cv.style.height = H * s + "px";
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0); ctx.clearRect(0, 0, W, H);
    var cs = getComputedStyle(el), datos = {};
    try { datos = JSON.parse(el.dataset.datos || "{}"); } catch (e) { console.error("data-datos inválido en", el.dataset.fig, e); }
    var P = lapiz(ctx, hash(el.dataset.fig + (el.dataset.semilla || el.id || "")), { tinta: cs.getPropertyValue("--tinta").trim() || INK.azul, fuente: cs.getPropertyValue("--mano").trim() || undefined });
    try { fn(P, W, H, datos); } catch (e) { console.error(el.dataset.fig, e); }
  }
  function dibujar(raiz) { (raiz || document).querySelectorAll(".fig[data-fig]").forEach(dibujarUna); }
  /** Palabras con pulso: cada palabra levemente desalineada (opcional, data-pulso en <body>). */
  function pulso(raiz) {
    var r = mul(hash(location.pathname)), tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var el = n.parentElement; return n.nodeValue.trim() && el && !el.closest(".fig, script, style, table, .calc, .no-mano, .w") ? 1 : 2; } }), ns = [];
    while (tw.nextNode()) ns.push(tw.currentNode);
    ns.forEach(function (n) { var fr = document.createDocumentFragment(); n.nodeValue.split(/(\s+)/).forEach(function (t) { if (!t) return; if (/^\s+$/.test(t)) { fr.appendChild(document.createTextNode(t)); return; } var s = document.createElement("span"); s.className = "w"; s.textContent = t; s.style.transform = "translateY(" + ((r() * 2 - 1) * .6).toFixed(2) + "px) rotate(" + ((r() * 2 - 1) * .6).toFixed(2) + "deg)"; fr.appendChild(s); }); n.parentNode.replaceChild(fr, n); });
  }
  /** Hojas que no caben en un A4 (297 mm): les pone la clase .desborda y deja la lista en <html data-desbordes>. */
  function medir() {
    var lim = 297 * 96 / 25.4 + 1, malas = [];
    document.querySelectorAll(".hoja").forEach(function (h, i) { h.classList.remove("desborda"); if (h.offsetWidth >= 790 && h.scrollHeight > lim) { malas.push(i + 1); h.classList.add("desborda"); } });
    document.documentElement.setAttribute("data-desbordes", malas.join(",")); document.documentElement.setAttribute("data-hojas", document.querySelectorAll(".hoja").length);
    if (malas.length) console.warn("Grafia: no caben en A4 las hojas " + malas.join(", "));
    return malas;
  }
  if (typeof document !== "undefined") {
    var arrancar = function () {
      var fam = getComputedStyle(document.documentElement).getPropertyValue("--mano").split(",")[0].trim() || '"Kalam"';
      var listo = document.fonts && document.fonts.load ? Promise.all([document.fonts.load("16px " + fam), document.fonts.load("700 16px " + fam)]).catch(function () {}) : Promise.resolve();
      listo.then(function () { if (document.body.hasAttribute("data-pulso")) pulso(document.body); dibujar(); medir(); document.documentElement.classList.add("listo"); });
      var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(dibujar, 150); });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
  }
  return { lapiz: lapiz, geo: geo, ejes: ejes, F: F, registrar: registrar, dibujar: dibujar, medir: medir, pulso: pulso, INK: INK, FAM: FAM };
})();

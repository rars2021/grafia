"""Arma una hoja de Grafia en un solo archivo HTML (para publicar como Artifact o abrir sin servidor).

Uso:
    python -I armar.py <fuente.html> [salida.html]

La fuente enlaza el kit así (rutas relativas a la fuente o al kit de la skill):
    <link rel="stylesheet" href="kit/grafia.css">
    <script src="kit/grafia.js"></script>
armar.py reemplaza esos dos enlaces por el contenido del kit y agrega la fuente de Google Fonts de la letra elegida
(<body data-letra="…">, Kalam por defecto). Sin salida, escribe <fuente>-armado.html junto a la fuente.
"""
import os
import re
import sys

KIT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "kit")
FUENTES = {
    "kalam": "Kalam:wght@300;400;700",
    "caveat": "Caveat:wght@400;700",
    "patrick": "Patrick+Hand",
    "architects": "Architects+Daughter",
    "gochi": "Gochi+Hand",
    "shadows": "Shadows+Into+Light+Two",
}


def leer(nombre):
    with open(os.path.join(KIT, nombre), encoding="utf-8") as f:
        return f.read()


def armar(html):
    m = re.search(r'<body[^>]*data-letra="([a-z]+)"', html)
    letra = m.group(1) if m else "kalam"
    familia = FUENTES.get(letra, FUENTES["kalam"])
    css = leer("grafia.css")
    js = leer("grafia.js")
    html, n1 = re.subn(r'<link[^>]+href="[^"]*grafia\.css"[^>]*>', lambda _: "<style>\n" + css + "\n</style>", html)
    html, n2 = re.subn(r'<script[^>]+src="[^"]*grafia\.js"[^>]*>\s*</script>', lambda _: "<script>\n" + js + "\n</script>", html)
    if not (n1 and n2):
        raise SystemExit("La fuente debe enlazar kit/grafia.css y kit/grafia.js (faltan %s)." % ", ".join(
            x for x, n in (("grafia.css", n1), ("grafia.js", n2)) if not n))
    if "fonts.googleapis.com" not in html:
        enlace = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
                  f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={familia}&display=swap">\n')
        html = re.sub(r"(<title>.*?</title>\s*)", lambda m: m.group(1) + enlace, html, count=1, flags=re.S) if "<title>" in html else enlace + html
    return html


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    fuente = sys.argv[1]
    salida = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(fuente)[0] + "-armado.html"
    with open(fuente, encoding="utf-8") as f:
        html = armar(f.read())
    with open(salida, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"{salida}  ({len(html) // 1024} KB)")


if __name__ == "__main__":
    main()

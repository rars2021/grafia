"""PDF paginado A4 de una hoja de Grafia: una .hoja = una página, con el papel (cuadriculado, rayado…).

Uso:
    python -I pdf.py <pagina.html> [salida.pdf] [--vista carpeta]

1. Abre la página en Chrome (o Edge) sin interfaz, espera a las fuentes y a las figuras, y lee
   <html data-desbordes>: las hojas que no caben en 297 mm. Si hay alguna, se detiene y las nombra
   (con overflow:hidden se cortarían en silencio). Arréglalas partiendo la hoja o achicando una figura.
2. Imprime con @page A4 sin márgenes ni encabezados del navegador.
3. Comprueba con PyMuPDF que hay tantas páginas como hojas. Con --vista guarda un PNG por página.

Sin salida, el PDF va a la carpeta Descargas del usuario con el nombre del <title>.
Por qué no basta con Ctrl+P en el navegador: sin estas reglas las hojas se parten entre páginas y el
cuadriculado no se imprime (los navegadores omiten fondos si no se pide print-color-adjust: exact).
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

NAVEGADORES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]


def navegador():
    for n in NAVEGADORES:
        if os.path.exists(n):
            return n
    n = shutil.which("chrome") or shutil.which("msedge")
    if not n:
        raise SystemExit("No encontré Chrome ni Edge.")
    return n


def correr(nav, perfil, args, url):
    base = [nav, "--headless=new", "--disable-gpu", "--no-first-run", "--window-size=1000,1400",
            "--virtual-time-budget=15000", "--run-all-compositor-stages-before-draw", f"--user-data-dir={perfil}"]
    return subprocess.run(base + args + [url], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    a = [x for x in sys.argv[1:]]
    vista = None
    if "--vista" in a:
        i = a.index("--vista"); vista = a[i + 1]; del a[i:i + 2]
    if not a:
        raise SystemExit(__doc__)
    pagina = os.path.abspath(a[0])
    html = open(pagina, encoding="utf-8").read()
    titulo = re.search(r"<title>(.*?)</title>", html, re.S)
    nombre = re.sub(r'[<>:"/\\|?*]', "", (titulo.group(1).strip() if titulo else os.path.splitext(os.path.basename(pagina))[0]))
    salida = os.path.abspath(a[1]) if len(a) > 1 else os.path.join(os.path.expanduser("~"), "Downloads", nombre + ".pdf")
    url = "file:///" + pagina.replace("\\", "/")
    nav = navegador()
    with tempfile.TemporaryDirectory() as perfil:
        dom = correr(nav, perfil, ["--dump-dom"], url).stdout
        m = re.search(r'data-desbordes="([^"]*)"', dom)
        if m is None:
            print("Aviso: la página no trae grafia.js o no terminó de cargar; no pude medir las hojas.")
        elif m.group(1):
            raise SystemExit(f"No caben en A4 las hojas {m.group(1)}. Pártelas o achica sus figuras antes de imprimir.")
        h = re.search(r'data-hojas="(\d+)"', dom)
        hojas = int(h.group(1)) if h else 0
        correr(nav, perfil, ["--no-pdf-header-footer", f"--print-to-pdf={salida}"], url)
    if not os.path.exists(salida):
        raise SystemExit("Chrome no escribió el PDF.")
    try:
        import pymupdf
        d = pymupdf.open(salida)
        paginas = len(d)
        if vista:
            os.makedirs(vista, exist_ok=True)
            for i, pg in enumerate(d):
                pg.get_pixmap(dpi=60).save(os.path.join(vista, f"pagina-{i + 1}.png"))
        estado = "ok" if not hojas or paginas == hojas else f"ATENCIÓN: {hojas} hojas y {paginas} páginas"
        print(f"{salida}\n{paginas} páginas A4 · {estado}")
    except ImportError:
        print(f"{salida}\n(instala pymupdf para contar las páginas)")


if __name__ == "__main__":
    main()

# Grafia

Skill de Claude Code para hojas «hechas a mano» —exámenes resueltos, apuntes, informes— en cualquier materia
(geología, minas, metalurgia, mecánica de rocas y otras). Sale del motor a mano de GeoStrike. Complemento de
Geotechnic (3D casi real) y de sstutor-anatomia (isométricos de laboratorio).

| Ruta | Contenido |
|---|---|
| `.claude/skills/grafia/` | La skill: `SKILL.md`, kit (`grafia.css`, `grafia.js`), plantilla, ejemplos, scripts y referencias |
| `.claude/skills/grafia/ejemplos/muestrario.html` | Las 15 figuras por materia |
| `.claude/skills/grafia/ejemplos/solucionario-cordova.html` | Caso real: solucionario de Mecánica de Rocas |

Instalada para todas las sesiones con una junction: `%USERPROFILE%\.claude\skills\grafia` → `.claude\skills\grafia`.

```powershell
python -I .claude\skills\grafia\scripts\armar.py <fuente.html> <salida.html>
python -I .claude\skills\grafia\scripts\pdf.py <salida.html>        # PDF A4 en Descargas
```

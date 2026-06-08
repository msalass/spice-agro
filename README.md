# SPICe Agro — agro.spicelab.cl

Home de **SPICe Agro**, la submarca agrícola de SPICe Lab (South Pacific
Isotope Centre SpA). Sitio estático hecho a mano, sin generador, desplegado en
Netlify desde este repositorio (`msalass/spice-agro`).

> Concepto de marca: *del laboratorio al surco*. El isotipo es un brote cuyo
> tallo no se detiene en la superficie: continúa como raíz a través de los
> estratos del suelo. La línea del horizonte es donde se encuentran los dos
> mundos (agricultura arriba, geociencia abajo); los estratos curvos evocan el
> valle de Los Ríos.

## Estructura

```
spice-agro/
├── index.html                  # Homepage de SPICe Agro
├── seminario-suelo-vivo.html   # ← coloca aquí tu landing existente
├── 404.html
├── netlify.toml                # publish=".", headers, caché, 404
├── robots.txt
├── sitemap.xml
├── .gitignore
└── assets/
    ├── css/styles.css          # hoja única (sin cadena de @import)
    ├── js/main.js              # menú móvil, reveal, header, año
    └── images/                 # og-cover.jpg y fotos (logo va inline)
```

## Decisiones técnicas

- **CSS en un solo archivo** (`styles.css`): se evita la cadena de `@import`
  que penaliza el LCP en spicelab.cl. Una sola petición que bloquea el render.
- **Fuentes vía `<link>`** en el `<head>` con `preconnect` y `display=swap`
  (Fraunces / Hanken Grotesk / IBM Plex Mono), no por `@import`.
- **Logo y favicon inline (SVG)**: cero peticiones de imagen, nada que rompa el LCP.
- **Sin CSP estricta** en `netlify.toml`: para no bloquear GTM, Google Ads,
  Doppler ni Flow cuando los integres.
- Paleta: navy `#191f39`, teal `#317286`, sage `#a8a894`, cream `#fffbdc`
  + acento ocre `#c8862b` (claro `#d9a24e`, profundo `#7a5326`).

## Pendientes por completar (busca `TODO` en el código)

- Número de **WhatsApp** real (`wa.me/56...`) en hero, footer y botón flotante.
- **URL real de Huerto Rentable** (hoy el programa vive en spicelab.cl).
- **Fecha, duración, precio** y **botón/enlace de pago Flow** de Suelo Vivo.
- **Correo de contacto** del footer.
- `assets/images/og-cover.jpg` (1200 × 630) para compartir en redes.
- Colocar tu archivo **`seminario-suelo-vivo.html`** en la raíz.

## Desarrollo local

Es estático: basta servir la carpeta.

```bash
# opción 1
python3 -m http.server 8080
# opción 2 (si tienes Netlify CLI)
netlify dev
```

## Despliegue

`main` se publica automáticamente en Netlify a cada `git push`. Ver
`netlify.toml`. Patrón de trabajo: editar → `git add` → `git commit` → `git push`.

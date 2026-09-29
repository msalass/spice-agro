# QR de corredoras — El plano de tu parcela

Cada lámina apunta al formulario de `analisis-de-suelo.html` con `?ref=<slug>`.
Esa es la página que ya tiene el formulario de solicitud. No se publica
`plano-de-tu-parcela.html` (se retiró a propósito).

Sin `ref`, el formulario guarda **web directa**. Con `ref`, guarda el slug y
deja seleccionado «El plano de tu parcela».

Los PNG están en este folder del repositorio. El sitio no los sirve: en
`netlify.toml`, `/qr/*` responde 404. Se entregan desde el repo (o desde este
PR), no desde agro.spicelab.cl.

| Nombre en la lámina | Slug | Prioridad | Archivo | URL |
| --- | --- | --- | --- | --- |
| Río Cruces | `riocruces` | sí | `riocruces.png` | https://agro.spicelab.cl/analisis-de-suelo.html?ref=riocruces&utm_source=corredora&utm_medium=qr&utm_campaign=plano |
| Ramón | `ramon` | | `ramon.png` | https://agro.spicelab.cl/analisis-de-suelo.html?ref=ramon&utm_source=corredora&utm_medium=qr&utm_campaign=plano |
| César | `cesar` | | `cesar.png` | https://agro.spicelab.cl/analisis-de-suelo.html?ref=cesar&utm_source=corredora&utm_medium=qr&utm_campaign=plano |
| Patricio | `patricio` | | `patricio.png` | https://agro.spicelab.cl/analisis-de-suelo.html?ref=patricio&utm_source=corredora&utm_medium=qr&utm_campaign=plano |
| Campos Chile | `camposchile` | | `camposchile.png` | https://agro.spicelab.cl/analisis-de-suelo.html?ref=camposchile&utm_source=corredora&utm_medium=qr&utm_campaign=plano |
| Godben | `godben` | | `godben.png` | https://agro.spicelab.cl/analisis-de-suelo.html?ref=godben&utm_source=corredora&utm_medium=qr&utm_campaign=plano |
| Carolina | `carolina` | | `carolina.png` | https://agro.spicelab.cl/analisis-de-suelo.html?ref=carolina&utm_source=corredora&utm_medium=qr&utm_campaign=plano |

El mismo listado está en `corredoras.csv`.

Para regenerar las láminas: `python3 qr/generar_qr.py` (hace falta `qrcode` y `pillow`).

# Landing — Inspección Pre-Compra RRMotors

Landing page de una sola página para el servicio de inspección pre-compra de
vehículos usados de **RRMotors**. Sitio estático: un `index.html` autocontenido,
sin build, sin dependencias, sin JavaScript externo.

## Contenido

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La landing completa (HTML + CSS + JS en un solo archivo) |
| `404.html` | Página de error, servida automáticamente por Cloudflare Pages |
| `_headers` | Cabeceras de seguridad y caché para Cloudflare Pages |
| `robots.txt` / `sitemap.xml` | SEO — apuntar al dominio real antes de publicar |
| `PROMPT-LANDING-RRMOTORS.md` | El prompt con el que se generó, para regenerar o iterar |

## Qué hace la página

- **Captador de leads en 3 pasos** — vehículo, ubicación y urgencia, nombre y
  teléfono. Al enviar arma un mensaje de WhatsApp ya redactado con todos los datos.
- **Calculadora de costo real** — el visitante pone el precio que le piden y marca
  las reparaciones que sospecha (17 ítems con valores de mercado editables).
  Calcula el costo real, el precio justo a ofrecer y el retorno de la inspección.
  También se envía por WhatsApp con el detalle ítem por ítem.
- **Botones de WhatsApp en 8 puntos**, cada uno con mensaje distinto y etiquetado
  para saber cuál convierte.
- Check-list de 50 puntos, veredicto con semáforo, desabolladura y pintura,
  preguntas frecuentes y barra fija de contacto en móvil.

## Antes de publicar

1. **WhatsApp** — variable `WHATSAPP` al inicio del `<script>` en `index.html`.
2. **Píxeles** — descomenta el bloque `TRACKING` del `<head>` y pega el ID de
   Google Analytics 4 y el de Meta Pixel.
3. **Dominio** — reemplaza `https://EJEMPLO.cl` en `index.html` (canonical y
   Open Graph), `robots.txt` y `sitemap.xml`.
4. **Imagen social** — sube `og-rrmotors.jpg` (1200x630) y apunta `og:image`.
5. **Testimonios** — la sección está retirada a propósito. Se agrega cuando haya
   reseñas reales y verificables (hay un comentario marcando el lugar).
6. **Ciudad y horario** — actualiza `Santiago y alrededores` y el horario en el
   cierre, el pie y el JSON-LD.

## Desplegar en Cloudflare Pages

### Opción A — conectado a este repositorio (recomendado)

1. Entra a **Cloudflare Dashboard → Workers & Pages → Create → Pages →
   Connect to Git**.
2. Autoriza GitHub y elige este repositorio.
3. Configuración de build:
   - **Framework preset:** `None`
   - **Build command:** *(vacío)*
   - **Build output directory:** `/`
4. **Save and Deploy**. Cada `git push` a `main` publica una nueva versión.

### Opción B — subida directa con Wrangler

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=rrmotors-landing
```

### Dominio propio

En el proyecto de Pages: **Custom domains → Set up a domain**. Si el dominio ya
está en Cloudflare, el registro DNS se crea solo; si no, apunta un `CNAME` al
subdominio `*.pages.dev` que entrega Cloudflare. El certificado HTTPS es automático.

## Eventos que envía la página

`lead_formulario` · `contacto_whatsapp` (con el origen del botón) · `form_paso` ·
`uso_calculadora` · `scroll_50` · `scroll_90`

Llegan a Google Analytics 4, Meta Pixel y `dataLayer` de Google Tag Manager, y no
fallan si esos scripts no están cargados.

## UTM sugeridos

| Canal | Parámetros |
|---|---|
| Bio de Instagram | `?utm_source=instagram&utm_medium=bio&utm_campaign=inspeccion` |
| Meta Ads | `?utm_source=facebook&utm_medium=cpc&utm_campaign=inspeccion&utm_content=ANUNCIO` |
| Estados de WhatsApp | `?utm_source=whatsapp&utm_medium=estado&utm_campaign=inspeccion` |
| Marketplace | `?utm_source=marketplace&utm_medium=organico&utm_campaign=inspeccion` |

## Desarrollo local

No necesita servidor: abre `index.html` con doble clic. Si prefieres servirlo:

```bash
npx http-server . -p 8080
```

---

Los valores de reparación de la calculadora y de desabolladura son referenciales
de mercado y están pensados para editarse: viven en el objeto `ITEMS` del script
y en la sección de desabolladura del HTML.

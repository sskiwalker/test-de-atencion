# Prompt maestro — Landing Page "Inspección Pre-Compra" RRMotors

> Cómo usarlo: copia TODO el bloque de abajo (desde `ROL` hasta el final) y pégalo en Claude,
> ChatGPT, Lovable, v0, Bolt o cualquier generador de sitios. Reemplaza lo que está entre
> `[corchetes]` por tus datos reales antes de enviar.

---

## BLOQUE PARA COPIAR Y PEGAR

**ROL**
Actúa como diseñador web senior + copywriter de conversión especializado en servicios
automotrices en Chile. Tu trabajo es entregar una landing page de una sola página,
100% funcional y lista para publicar.

**ENTREGABLE**
Un único archivo `index.html` autocontenido (HTML + CSS + JS inline, sin librerías externas
ni CDN). Debe verse perfecto en móvil primero (la mayoría del tráfico viene de Instagram y
WhatsApp) y adaptarse a desktop. Sin frameworks, sin dependencias, que funcione con solo
abrir el archivo.

**NEGOCIO**
- Marca: RRMotors — "Confianza que te mueve"
- Servicio: Inspección Pre-Compra de vehículos usados + escáner profesional
- Promesa central: "No compres a ciegas. Revisamos, analizamos y te decimos la verdad
  para que compres seguro."
- Precio oferta: $40.000 CLP — check-list de 50 puntos
- Ciudad / cobertura: [ej. Santiago y alrededores]
- WhatsApp: +56 9 3770 5280
- Instagram: [@tuusuario]
- Idioma: español de Chile, tuteo, cercano, directo, sin tecnicismos innecesarios.

**PÚBLICO OBJETIVO**
Persona que está a punto de comprar un auto usado (particular o automotora) y tiene miedo
de que le "pasen gato por liebre". No sabe de mecánica. Su dolor real: perder millones en
un auto con fallas ocultas. Su deseo: seguridad, claridad y poder negociar el precio.

**TONO Y ESTILO VISUAL**
- Estilo automotriz premium: fondo oscuro (negro / carbono con textura sutil), acentos en
  rojo (#E10600) y blanco, tipografía condensada en negrita para títulos, alto contraste.
- Sensación: taller profesional, serio, tecnológico y confiable. NADA de estética barata,
  NADA de emojis en los títulos, NADA de degradados morados genéricos.
- Tarjetas con bordes finos rojos, íconos SVG simples en línea (motor, escudo, cámara,
  batería, ruta, documento). Nada de imágenes externas: usa SVG dibujados por ti,
  con `<img>` solo donde yo pondré fotos reales (usa placeholders con la medida indicada).
- Animaciones mínimas: fade-in al hacer scroll y hover en botones. Nada que distraiga.

**ESTRUCTURA DE LA PÁGINA (en este orden exacto)**

1. **Barra superior fija (sticky):** logo RRMotors + botón "Agendar por WhatsApp"
   siempre visible.

2. **Hero:** título "INSPECCIÓN PRE-COMPRA + SCANNER PROFESIONAL".
   Bajada: "Revisamos, analizamos y te decimos la verdad para que compres seguro."
   Badge: "NO COMPRES A CIEGAS · PROTEGE TU INVERSIÓN".
   Precio destacado $40.000 con la etiqueta "Check-list de 50 puntos".
   CTA principal: "Agendar mi inspección por WhatsApp".
   CTA secundario: "Ver qué revisamos" (ancla a la sección 4).
   Espacio para foto del auto/scanner (1200x800).

3. **Barra de confianza:** 6 íconos con texto corto — Inspección completa · Scanner
   profesional · Reporte con fotos · Prueba de ruta* · Medición de pintura · Presupuesto
   de reparaciones. Nota al pie: "*Sujeto a autorización y condiciones del vehículo."

4. **"Los 10 puntos más importantes":** lista numerada del 1 al 10 con ícono cada una:
   Estado del motor y fugas · Frenos delanteros y traseros · Transmisión y cambios ·
   Suspensión y amortiguadores · Neumáticos y desgaste · Sistema eléctrico y batería ·
   Fluidos y posibles fugas · Escaneo de códigos de avería · Carrocería y estructura ·
   Pintura y repintados.

5. **"Informe para negociar":** explica que detectamos fallas y desgastes, estimamos
   costos de reparación y entregamos cifras reales. Frase destacada:
   "Úsalo para negociar y ahorrar miles de pesos."
   Incluye una mini-tabla de ejemplo de informe (ítem / semáforo verde-amarillo-rojo /
   costo estimado) con un TOTAL ESTIMADO al final. Deja claro que es un ejemplo referencial.

6. **"Veredicto RRMotors":** 3 tarjetas con semáforo —
   ✅ COMPRA RECOMENDADA (vehículo en buen estado general) ·
   ⚠️ COMPRA CON OBSERVACIONES (requiere mantenimiento o reparaciones menores) ·
   ❌ NO RECOMENDAMOS LA COMPRA (riesgos altos o fallas importantes detectadas).
   Usa borde verde / ámbar / rojo respectivamente.

7. **"Costo real de compra":** calculadora interactiva en JavaScript.
   El usuario ingresa el precio del vehículo y la landing muestra:
   Precio del vehículo + Reparaciones detectadas (campo editable, valor de ejemplo
   $1.250.000) = Inversión estimada total. Formatea en pesos chilenos con puntos.
   Mensaje de apoyo: "Saber hoy te ahorra mañana. Evita sorpresas, pérdidas y malas
   decisiones."

8. **Antes / Después:** comparador de dos fotos (desabolladura y pintura) con etiquetas
   ANTES y DESPUÉS. Menciona que el presupuesto de desabolladura y pintura va incluido.
   Placeholders 800x600.

9. **Oferta cruzada:** "10% de descuento en mantención preventiva o trabajo de
   desabolladura y pintura al comprar tu vehículo con nuestra inspección."

10. **"¿Por qué elegir RRMotors?":** 5 bloques — Experiencia y profesionalismo · Equipos de
    alta gama · Informe claro, completo y honesto · 100% confidencial y transparente ·
    Atención rápida y flexible.

11. **Testimonios:** 3 tarjetas con nombre, auto inspeccionado y resultado concreto
    (ej. "Me ahorré $900.000 en la negociación"). Márcalas con un comentario HTML
    `<!-- REEMPLAZAR CON TESTIMONIOS REALES -->` para que yo los cambie.

12. **Cómo funciona en 3 pasos:** 1) Escribes por WhatsApp con los datos del auto ·
    2) Coordinamos y hacemos la inspección donde está el vehículo ·
    3) Recibes tu informe con fotos y veredicto el mismo día.

13. **Preguntas frecuentes (acordeón HTML nativo con `<details>`):**
    ¿Cuánto demora? · ¿Van hasta donde está el auto? · ¿Qué pasa si el vendedor no deja
    revisarlo? · ¿El informe sirve para negociar? · ¿Qué incluye el escáner? ·
    ¿Formas de pago? · ¿Revisan autos eléctricos e híbridos?
    (Responde tú con respuestas cortas y realistas; márcalas para que yo las valide.)

14. **CTA final + contacto:** repetir precio $40.000, botón grande de WhatsApp,
    horario de atención y cobertura. Frase de cierre:
    "Pagar $40.000 hoy puede ahorrarte millones mañana."

15. **Botón flotante de WhatsApp** en la esquina inferior derecha, visible en todo momento.

16. **Footer:** logo, redes, y una línea legal: "La inspección es un diagnóstico visual y
    electrónico del estado del vehículo al momento de la revisión; no constituye garantía
    sobre fallas futuras."

**MARKETING DIGITAL — REQUISITOS TÉCNICOS OBLIGATORIOS**
- Todos los enlaces de WhatsApp deben usar el formato:
  `https://wa.me/56937705280?text=Hola%20RRMotors%2C%20quiero%20agendar%20una%20inspecci%C3%B3n%20pre-compra`
  y cada botón debe llevar un texto distinto según su sección (para saber cuál convierte).
- Agrega `data-cta="hero"`, `data-cta="precio"`, `data-cta="final"`, etc. a cada botón, y
  una función JS `trackCTA()` que dispare `gtag('event','contacto_whatsapp',{...})` y
  `fbq('track','Contact',{...})` si existen, sin romper la página si no están cargados.
- Deja preparados —comentados y listos para pegar el ID— los bloques de
  Google Analytics 4, Google Tag Manager y Meta Pixel en el `<head>`.
- SEO: `<title>` y `<meta name="description">` optimizados para
  "inspección pre compra autos usados [ciudad]"; Open Graph y Twitter Card completos;
  JSON-LD de tipo `AutoRepair` / `LocalBusiness` con nombre, teléfono, área de servicio,
  rango de precio y horario; `<html lang="es-CL">`; un solo `<h1>`; alt descriptivo en
  todas las imágenes.
- Rendimiento: sin fuentes externas (usa system font stack), imágenes con `loading="lazy"`,
  CSS crítico inline, peso total del HTML bajo 100 KB.
- Accesibilidad: contraste AA, `aria-label` en botones de ícono, foco visible en teclado.
- Al final del archivo, incluye un comentario HTML con un checklist de
  "QUÉ EDITAR ANTES DE PUBLICAR" (teléfono, IDs de píxeles, fotos, testimonios, horario).

**REGLAS DE COPY**
- Titulares cortos, en mayúsculas, orientados al beneficio, no a la técnica.
- Habla del miedo a perder plata y de la tranquilidad de decidir informado.
- Nunca prometas garantía mecánica ni resultados imposibles.
- Cero relleno: cada sección debe caber en una pantalla de celular sin scroll infinito.

**ENTREGA**
Devuelve primero el archivo `index.html` completo dentro de un solo bloque de código.
Después, fuera del código, entrega en texto plano:
1. 3 variantes de titular para testear A/B.
2. 5 textos de anuncio para Instagram/Facebook Ads (máx. 125 caracteres el cuerpo,
   40 el titular), con enfoque en dolor, prueba social, oferta, urgencia y educación.
3. 3 ideas de reel/story de 15 segundos que lleven a esta landing.
4. Los parámetros UTM sugeridos para cada canal (Instagram bio, Ads, WhatsApp, Marketplace).

---

## Notas de uso rápido

- **Si usas Lovable / v0 / Bolt:** pega el bloque tal cual; luego pide "hazlo responsive
  y revisa el móvil" como segundo mensaje.
- **Si usas Claude o ChatGPT:** pega el bloque y adjunta el flyer como imagen de referencia
  visual; el resultado quedará mucho más fiel a la marca.
- **Para iterar:** no rehagas el prompt completo, pide cambios puntuales
  ("cambia la sección 7 por X", "haz el hero más corto en móvil").
- **Antes de publicar:** reemplaza teléfono, IDs de píxel, fotos reales y testimonios
  verificables. No publiques testimonios inventados.

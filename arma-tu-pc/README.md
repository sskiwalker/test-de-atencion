# Arma tu PC — rendimiento y precio estimados (sept-2026)

Cambias un componente y ves al instante qué rinde y cuánto cuesta, juego por juego y por
resolución. Construido sobre el informe **“Componentes de PC: mercado actual y próximos
lanzamientos”** (corte 21-sep-2026).

Abre `arma-tu-pc/index.html` en cualquier navegador. No necesita servidor ni dependencias.

**Una sola página y todo en vivo.** No hay pestañas ni botón de “calcular”: componentes, precio,
FPS por juego, rankings y recomendaciones viven en la misma página y se actualizan con cada cambio
(unos 10 ms en total). Una franja fija arriba mantiene a la vista el precio, la mediana de FPS y
dónde está el cuello de botella mientras cambias cosas más abajo, y marca sola en qué sección vas.

Los rankings son interactivos: **un clic en cualquier fila monta esa GPU o esa CPU en tu equipo**
(si la CPU es de otra plataforma, la placa y la RAM se ajustan solas) y el efecto se ve al tiro en
la franja de arriba. La fila del componente que tienes puesto va marcada.

## Abrirlo desde el teléfono / mandarlo por WhatsApp

La página es estática y no pide nada a ningún servidor externo, así que funciona igual en el
navegador integrado de WhatsApp. Lo único que hace falta es que esté publicada en una dirección.

**Publicar con GitHub Pages** (gratis, en el mismo repositorio):

1. La rama con estos archivos tiene que estar en `main` (o elegir esa rama en el paso 2).
2. En GitHub: **Settings → Pages → Source: “Deploy from a branch”**, rama `main`, carpeta `/ (root)`.
3. A los dos o tres minutos queda en:
   `https://sskiwalker.github.io/test-de-atencion/arma-tu-pc/`

Ese es el enlace que se manda por WhatsApp.

**El enlace se ve como tarjeta, no como texto pelado.** Hay etiquetas Open Graph y una imagen de
previsualización (`img/preview.jpg`, 1200x630) generada con cifras reales del propio modelo, así que
WhatsApp, Telegram, Discord y redes muestran título, descripción e imagen.

> Si lo publicas en otro dominio hay que cambiar las cuatro direcciones absolutas del `<head>`
> (`canonical`, `og:url`, `og:image`, `twitter:image`). Están juntas y marcadas con un comentario.
> Open Graph no admite rutas relativas.

**El enlace lleva tu equipo dentro.** El botón *Compartir este equipo* manda una línea con el
resumen (CPU, GPU, precio en USD y CLP, FPS de mediana) más una dirección que reconstruye
exactamente esa configuración al abrirla: componentes, resolución, preset, ray tracing, reescalado
y los juegos marcados. En el teléfono abre el menú de compartir del sistema; en el computador copia
el enlace al portapapeles. Un enlace mal copiado no rompe nada: cada valor se valida contra el
catálogo y lo que no cuadre se ignora.

**Se puede instalar como app.** Hay un `manifest.webmanifest` e iconos, así que “Añadir a pantalla
de inicio” la deja con su icono y abriéndose a pantalla completa, sin barra de navegador.

Un detalle de compatibilidad: el CSS evita funciones modernas de mezcla de color, que faltan en los
navegadores integrados de apps en móviles algo antiguos y dejarían fondos en negro.

## La regla del proyecto: no hay FPS guardados

No existe ninguna tabla del tipo *“RTX 5070 + Cyberpunk 1440p = 80 FPS”*. Lo que se guarda es:

| Se guarda | No se guarda |
|---|---|
| Specs de cada componente (shaders, reloj, bus, VRAM, caché L3, TDP) | Resultados de benchmark por combinación |
| Precios publicados, con su fecha y su fuente | Precios inventados para rellenar huecos |
| El **coste de frame** de cada juego (ms de GPU y de CPU a 1080p) | Los FPS de ese juego en ningún hardware concreto |

Todo lo demás se calcula. Cambiar una spec cambia el resultado, como debe ser.

## Cómo se calcula

```
ms_GPU = coste_GPU x preset x ray_tracing x (píxeles/1080p)^exp x (100/índice_GPU) / sesgo_motor
ms_CPU = coste_CPU x (100/índice_CPU)
frame  = (ms_GPU^6 + ms_CPU^6)^(1/6)     mezcla suave: el cuello de botella manda, pero no del todo
FPS    = 1000 / frame, y después VRAM, PCIe, RAM del sistema y tope del juego
```

**Índice de GPU** — modelo roofline: `1 / ((1-w)/cómputo + w/ancho_de_banda)`, donde el peso `w`
del ancho de banda sube con la resolución (0,25 a 1080p; 0,45 a 4K). El cómputo son los TFLOPs
nominales corregidos por eficiencia real de la arquitectura y por la ocupación que pierden los
chips muy anchos. El ancho de banda efectivo incluye el multiplicador de caché (L2 grande de
Ada/Blackwell, Infinity Cache de RDNA). Referencia: **RTX 5070 a 1440p = 100**.

**Índice de CPU** — IPC por arquitectura × reloj real del CCD^0,75 × caché L3 por núcleo ×
núcleos útiles × calidad de la RAM × penalización de scheduler. Referencia: **Ryzen 7 9800X3D = 100**.
Modela cosas que suelen ignorarse y que el informe menciona expresamente:

- **Single channel** cuesta ~20-25% en juegos (el caso del equipo del informe).
- Los **X3D de doble CCD** (9950X3D, 9900X3D) pierden si el juego cae en el CCD sin V-Cache; se
  muestra el caso esperado y se avisa del peor caso documentado (TechRadar, TW: Warhammer III).
- La **caché 3D** rinde distinto según el juego: un simulador la aprovecha mucho más que un shooter.

**Penalizaciones físicas** — VRAM insuficiente (baja poco el promedio y hunde el 1% low, igual
que en la comparativa RTX 5060 vs RX 9060 XT del informe), PCIe 3.0 con tarjetas de bus x8,
RAM total corta y topes de FPS del propio juego.

## Precios

- **GPUs**: precio mínimo real de EE.UU. al 19-sep-2026. Sin precio publicado → MSRP × sobreprecio
  medio actual del mercado, calculado en caliente desde las GPUs que sí lo tienen.
- **CPUs**: las que el informe lista como “Varía” se predicen con una regresión log-log sobre
  índice de juego, núcleos ponderados y si tiene V-Cache, ajustada con las CPUs que sí traen precio.
- **RAM**: US$7,77/GB en DDR4 y US$17,50/GB en DDR5 (16-sep-2026). Cuando el informe observó
  precios reales de kit se usan esos, porque el $/GB los sobrestima.
- **Placa, fuente y gabinete**: **no están en el informe**. Son estimaciones, van marcadas como
  tales y se pueden editar. La fuente se dimensiona por el consumo real de CPU + GPU.
- **CLP**: factor derivado del propio informe (9800X3D a US$479 y a CLP $514.990 en abr-2026),
  ≈1.075 CLP por dólar con impuestos y margen local incluidos. Editable.

Todo precio calculado en vez de publicado lleva la etiqueta `est.`

## Calibración honesta

La sección **Metodología** contrasta el modelo contra cada cifra medida que cita el informe y
muestra también **las que no cuadran**, con su explicación. De 18 anclas, 15 caen dentro de la
tolerancia. Las tres que no:

1. **Total War: Warhammer III, 506 FPS (TechRadar)** — el modelo da bastante menos. Esa cifra
   parece de una escena muy liviana; lo que el modelo sí reproduce es la caída relativa del
   9950X3D por el scheduler (0,65x, clavado).
2. **5800X3D al nivel del 9600X (Notebookcheck)** — el modelo lo deja ~11% por debajo, que es la
   diferencia esperable entre Zen 3 y Zen 5 a igual caché.
3. **270K Plus por detrás del i7-14700K en Dragon’s Dogma 2 (GamersNexus)** — el modelo lo pone
   delante. Un modelo de specs no captura las rarezas de latencia de Arrow Lake en motores
   concretos; ahí hay que creerle a la medición.

## Límites

Estimaciones con un margen declarado de **±15%**, y ese margen se muestra en pantalla. El modelo
da rendimiento medio: una escena cargada puede quedar bastante por debajo. Los costes de frame por
juego son estimaciones propias apoyadas en las cifras del informe y en resultados públicos
conocidos, no en un banco de pruebas propio. La generación de frames se muestra siempre aparte,
porque sube el contador pero no la respuesta del juego.

## Archivos

```
arma-tu-pc/
├── index.html              estructura, textos y etiquetas para compartir
├── manifest.webmanifest    para instalarla en la pantalla de inicio
├── img/                    imagen de previsualización e iconos
├── css/styles.css          estilos (tema oscuro y claro)
└── js/
    ├── data.js         catálogo: specs, precios, juegos y anclas de calibración
    ├── model.js        motor: índices, estimación de FPS, precios, recomendador
    └── app.js          interfaz
```

Fuentes del catálogo y de las reseñas: Tom’s Hardware, TechSpot, GamersNexus, TechPowerUp,
TweakTown, Notebookcheck, DropReference, Capital & Compute, TechEpiphany, SoloTodo y el resto de
las citadas en el informe, consultadas entre el 19 y el 21 de septiembre de 2026.

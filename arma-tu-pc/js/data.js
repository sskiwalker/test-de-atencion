/* ===========================================================================
   data.js — Catálogo de componentes, precios y juegos.

   TODO lo de este archivo son ESPECIFICACIONES y PRECIOS publicados, no FPS.
   No hay ni una sola cifra de FPS guardada para una combinación GPU+juego:
   los FPS se calculan en model.js a partir de estas specs.

   Fuente de catálogo, precios y disponibilidad:
   "Componentes de PC: mercado actual y próximos lanzamientos",
   corte 21-sep-2026 (Tom's Hardware, GamersNexus, TechSpot, TechPowerUp,
   TweakTown, Notebookcheck, DropReference, Capital & Compute, TechEpiphany,
   SoloTodo, amdyes.cn, etc.).

   Las specs técnicas (shaders, buses, relojes) son datos públicos del
   fabricante: el informe da modelo/VRAM/bus/precio, y el resto de la ficha
   técnica es necesaria para poder calcular en vez de inventar.
   =========================================================================== */

window.DATA = (function () {
  'use strict';

  const meta = {
    corte: '21 de septiembre de 2026',
    fuente: 'Componentes de PC: mercado actual y próximos lanzamientos (informe sept-2026)',
    preciosGpuFecha: '19-sep-2026 (mínimos EE.UU., DropReference)',
    preciosRamFecha: '16-sep-2026 (Capital & Compute)',
    // Ancla de precio Chile: el informe lista el 9800X3D a US$479 y a CLP $514.990
    // (abr-2026). El factor NO es un tipo de cambio: incluye IVA, importación y
    // margen local. Se deriva, no se inventa.
    anclaChile: { usd: 479, clp: 514990, etiqueta: 'Ryzen 7 9800X3D (abr-2026)' }
  };

  /* ---------------------------------------------------------------- CPUs ---
     gameClock: reloj real del CCD donde corre el juego (en los X3D de doble
                CCD el CCD con V-Cache va más lento que el boost anunciado).
     l3Ccd:     caché L3 que ve UN núcleo (lo que importa en juegos).
     vcache:    'no' | 'uno' (asimétrico) | 'todos'
     memSens:   sensibilidad a la RAM (los X3D dependen menos de ella).
  --------------------------------------------------------------------------- */
  const cpus = [
    // ---- AM4 (DDR4) --------------------------------------------------------
    { id:'5800x3d', n:'Ryzen 7 5800X3D 10th Anniversary', pl:'AM4', arch:'zen3', c:8, smt:true, e:0,
      boost:4.5, l3:96, l3Ccd:96, ccds:1, vcache:'uno', tdp:105, precio:349, precioNota:'Lanz. 25-jun-2026',
      estado:'A la venta', memSens:0.5, nota:'Relanzamiento del mismo chip. Sin cooler, trae pad Carbice.' },
    { id:'5700x3d', n:'Ryzen 7 5700X3D', pl:'AM4', arch:'zen3', c:8, smt:true, e:0,
      boost:4.1, l3:96, l3Ccd:96, ccds:1, vcache:'uno', tdp:105, precio:null,
      estado:'Descontinuado (stock residual)', memSens:0.5 },
    { id:'5500x3d', n:'Ryzen 5 5500X3D', pl:'AM4', arch:'zen3', c:6, smt:true, e:0,
      boost:4.0, l3:96, l3Ccd:96, ccds:1, vcache:'uno', tdp:105, precio:null,
      estado:'Disponible (orientado a Latinoamérica)', memSens:0.5 },
    { id:'5950x', n:'Ryzen 9 5950X', pl:'AM4', arch:'zen3', c:16, smt:true, e:0,
      boost:4.9, l3:64, l3Ccd:32, ccds:2, vcache:'no', tdp:105, precio:null,
      estado:'Según stock', memSens:1.0 },
    { id:'5900xt', n:'Ryzen 9 5900XT', pl:'AM4', arch:'zen3', c:16, smt:true, e:0,
      boost:4.8, l3:64, l3Ccd:32, ccds:2, vcache:'no', tdp:105, precio:null, estado:'Disponible', memSens:1.0 },
    { id:'5900x', n:'Ryzen 9 5900X', pl:'AM4', arch:'zen3', c:12, smt:true, e:0,
      boost:4.8, l3:64, l3Ccd:32, ccds:2, vcache:'no', tdp:105, precio:null,
      estado:'Disponible', memSens:1.0 },
    { id:'5800xt', n:'Ryzen 7 5800XT', pl:'AM4', arch:'zen3', c:8, smt:true, e:0,
      boost:4.8, l3:32, l3Ccd:32, ccds:1, vcache:'no', tdp:105, precio:null, estado:'Disponible', memSens:1.0 },
    { id:'5700x', n:'Ryzen 7 5700X', pl:'AM4', arch:'zen3', c:8, smt:true, e:0,
      boost:4.6, l3:32, l3Ccd:32, ccds:1, vcache:'no', tdp:65, precio:null,
      estado:'Disponible, muy vendido', memSens:1.0 },
    { id:'5600x', n:'Ryzen 5 5600X', pl:'AM4', arch:'zen3', c:6, smt:true, e:0,
      boost:4.6, l3:32, l3Ccd:32, ccds:1, vcache:'no', tdp:65, precio:null, estado:'Disponible', memSens:1.0 },
    { id:'5600', n:'Ryzen 5 5600', pl:'AM4', arch:'zen3', c:6, smt:true, e:0,
      boost:4.4, l3:32, l3Ccd:32, ccds:1, vcache:'no', tdp:65, precio:null, estado:'Disponible', memSens:1.0 },
    { id:'5600gt', n:'Ryzen 5 5600GT (APU)', pl:'AM4', arch:'zen3apu', c:6, smt:true, e:0,
      boost:4.6, l3:16, l3Ccd:16, ccds:1, vcache:'no', tdp:65, precio:null,
      estado:'Disponible', memSens:1.15, igpu:'vega7', nota:'Base de builds sin GPU dedicada.' },
    { id:'5500', n:'Ryzen 5 5500', pl:'AM4', arch:'zen3apu', c:6, smt:true, e:0,
      boost:4.2, l3:16, l3Ccd:16, ccds:1, vcache:'no', tdp:65, precio:null, pcie:3,
      estado:'Top ventas Amazon (~4.000 u. ago-2026)', memSens:1.15,
      nota:'Solo PCIe 3.0, aunque la placa sea B550.' },

    // ---- AM5 (DDR5) --------------------------------------------------------
    { id:'9950x3d2', n:'Ryzen 9 9950X3D2', pl:'AM5', arch:'zen5', c:16, smt:true, e:0,
      boost:5.6, gameClock:5.5, l3:192, l3Ccd:96, ccds:2, vcache:'todos', tdp:170, precio:null,
      precioDesde:{ ref:'9950x3d', mult:1.33, nota:'~33% sobre el 9950X3D (GamersNexus)' },
      estado:'Nuevo 2026, tope de gama', memSens:0.5,
      nota:'GN: "no lo compres" para jugar; solo si además haces trabajo pesado.' },
    { id:'9950x3d', n:'Ryzen 9 9950X3D', pl:'AM5', arch:'zen5', c:16, smt:true, e:0,
      boost:5.7, gameClock:5.2, l3:128, l3Ccd:96, ccds:2, vcache:'uno', tdp:170, precio:699,
      precioNota:'MSRP', estado:'Disponible', memSens:0.5,
      nota:'Riesgo de scheduler: si el juego cae en el CCD sin V-Cache pierde mucho.' },
    { id:'9900x3d', n:'Ryzen 9 9900X3D', pl:'AM5', arch:'zen5', c:12, smt:true, e:0,
      boost:5.5, gameClock:5.0, l3:128, l3Ccd:96, ccds:2, vcache:'uno', tdp:120, precio:599,
      precioNota:'MSRP', estado:'Disponible', memSens:0.5 },
    { id:'9850x3d', n:'Ryzen 7 9850X3D', pl:'AM5', arch:'zen5', c:8, smt:true, e:0,
      boost:5.6, l3:96, l3Ccd:96, ccds:1, vcache:'uno', tdp:120, precio:499,
      precioNota:'MSRP', estado:'Nuevo ene-2026', memSens:0.5 },
    { id:'9800x3d', n:'Ryzen 7 9800X3D', pl:'AM5', arch:'zen5', c:8, smt:true, e:0,
      boost:5.2, l3:96, l3Ccd:96, ccds:1, vcache:'uno', tdp:120, precio:479,
      precioNota:'MSRP (CLP $514.990 en abr-2026)', estado:'CPU más vendida en Amazon US', memSens:0.5 },
    { id:'9950x', n:'Ryzen 9 9950X', pl:'AM5', arch:'zen5', c:16, smt:true, e:0,
      boost:5.7, l3:64, l3Ccd:32, ccds:2, vcache:'no', tdp:170, precio:null,
      estado:'Disponible (productividad)', memSens:1.0 },
    { id:'9900x', n:'Ryzen 9 9900X', pl:'AM5', arch:'zen5', c:12, smt:true, e:0,
      boost:5.6, l3:64, l3Ccd:32, ccds:2, vcache:'no', tdp:120, precio:null,
      estado:'Disponible (productividad)', memSens:1.0 },
    { id:'9700x', n:'Ryzen 7 9700X', pl:'AM5', arch:'zen5', c:8, smt:true, e:0,
      boost:5.5, l3:32, l3Ccd:32, ccds:1, vcache:'no', tdp:65, precio:null,
      estado:'Muy recomendado en China (618)', memSens:1.0 },
    { id:'9600x', n:'Ryzen 5 9600X', pl:'AM5', arch:'zen5', c:6, smt:true, e:0,
      boost:5.4, l3:32, l3Ccd:32, ccds:1, vcache:'no', tdp:65, precio:null,
      estado:'Top 3 Amazon nov-2025', memSens:1.0 },
    { id:'7700x3d', n:'Ryzen 7 7700X3D', pl:'AM5', arch:'zen4', c:8, smt:true, e:0,
      boost:4.5, l3:96, l3Ccd:96, ccds:1, vcache:'uno', tdp:120, precio:329,
      precioNota:'Lanz. 16-jul-2026', estado:'Nuevo', memSens:0.5,
      nota:'Bin más bajo del 7800X3D. AMD no publicó benchmarks propios.' },
    { id:'7800x3d', n:'Ryzen 7 7800X3D', pl:'AM5', arch:'zen4', c:8, smt:true, e:0,
      boost:5.0, l3:96, l3Ccd:96, ccds:1, vcache:'uno', tdp:120, precio:null,
      estado:'Descontinuado (stock residual)', memSens:0.5 },
    { id:'7600x3d', n:'Ryzen 5 7600X3D', pl:'AM5', arch:'zen4', c:6, smt:true, e:0,
      boost:4.7, l3:96, l3Ccd:96, ccds:1, vcache:'uno', tdp:65, precio:null,
      estado:'Disponibilidad limitada', memSens:0.5 },
    { id:'7600x', n:'Ryzen 5 7600X', pl:'AM5', arch:'zen4', c:6, smt:true, e:0,
      boost:5.3, l3:32, l3Ccd:32, ccds:1, vcache:'no', tdp:105, precio:null, estado:'Disponible', memSens:1.0 },
    { id:'7600', n:'Ryzen 5 7600', pl:'AM5', arch:'zen4', c:6, smt:true, e:0,
      boost:5.1, l3:32, l3Ccd:32, ccds:1, vcache:'no', tdp:65, precio:null, estado:'Disponible', memSens:1.0 },
    { id:'7500f', n:'Ryzen 5 7500F', pl:'AM5', arch:'zen4', c:6, smt:true, e:0,
      boost:5.0, l3:32, l3Ccd:32, ccds:1, vcache:'no', tdp:65, precio:null,
      estado:'Entrada a AM5 (sin gráfica integrada)', memSens:1.0 },
    { id:'8700g', n:'Ryzen 7 8700G (APU)', pl:'AM5', arch:'zen4', c:8, smt:true, e:0,
      boost:5.1, l3:16, l3Ccd:16, ccds:1, vcache:'no', tdp:65, precio:null,
      estado:'Disponible', memSens:1.15, igpu:'780m' },
    { id:'8600g', n:'Ryzen 5 8600G (APU)', pl:'AM5', arch:'zen4', c:6, smt:true, e:0,
      boost:5.0, l3:16, l3Ccd:16, ccds:1, vcache:'no', tdp:65, precio:null,
      estado:'Disponible', memSens:1.15, igpu:'760m' },
    { id:'8500g', n:'Ryzen 5 8500G (APU)', pl:'AM5', arch:'zen4', c:6, smt:true, e:0,
      boost:5.0, l3:16, l3Ccd:16, ccds:1, vcache:'no', tdp:65, precio:null,
      estado:'Disponible', memSens:1.15, igpu:'740m' },

    // ---- Intel -------------------------------------------------------------
    { id:'u7-270kp', n:'Core Ultra 7 270K Plus', pl:'LGA1851', arch:'arrowlake_r', c:8, smt:false, e:16,
      boost:5.5, l3:36, l3Ccd:36, ccds:1, vcache:'no', tdp:125, precio:299,
      precioNota:'Lanz. 26-mar-2026', estado:'Arrow Lake Refresh, DDR5-7200', memSens:0.9,
      nota:'LGA1851 es plataforma sin futuro (Nova Lake cambia a LGA1954).' },
    { id:'u5-250kp', n:'Core Ultra 5 250K Plus', pl:'LGA1851', arch:'arrowlake_r', c:6, smt:false, e:12,
      boost:5.3, boostEst:true, l3:30, l3Ccd:30, ccds:1, vcache:'no', tdp:125, precio:199,
      estado:'Arrow Lake Refresh', memSens:0.9 },
    { id:'u9-285k', n:'Core Ultra 9 285K', pl:'LGA1851', arch:'arrowlake', c:8, smt:false, e:16,
      boost:5.7, l3:36, l3Ccd:36, ccds:1, vcache:'no', tdp:125, precio:null, estado:'Arrow Lake original', memSens:0.9 },
    { id:'u7-265k', n:'Core Ultra 7 265K', pl:'LGA1851', arch:'arrowlake', c:8, smt:false, e:12,
      boost:5.5, l3:30, l3Ccd:30, ccds:1, vcache:'no', tdp:125, precio:null, estado:'Arrow Lake original', memSens:0.9 },
    { id:'u5-245k', n:'Core Ultra 5 245K', pl:'LGA1851', arch:'arrowlake', c:6, smt:false, e:8,
      boost:5.2, l3:24, l3Ccd:24, ccds:1, vcache:'no', tdp:125, precio:null, estado:'Arrow Lake original', memSens:0.9 },
    { id:'i9-14900k', n:'Core i9-14900K', pl:'LGA1700', arch:'raptorlake', c:8, smt:true, e:16,
      boost:6.0, l3:36, l3Ccd:36, ccds:1, vcache:'no', tdp:125, precio:null,
      estado:'Disponible (actualizar BIOS)', memSens:0.9 },
    { id:'i7-14700k', n:'Core i7-14700K', pl:'LGA1700', arch:'raptorlake', c:8, smt:true, e:12,
      boost:5.6, l3:33, l3Ccd:33, ccds:1, vcache:'no', tdp:125, precio:null, estado:'Disponible', memSens:0.9 },
    { id:'i5-14600k', n:'Core i5-14600K', pl:'LGA1700', arch:'raptorlake', c:6, smt:true, e:8,
      boost:5.3, l3:24, l3Ccd:24, ccds:1, vcache:'no', tdp:125, precio:null, estado:'Disponible', memSens:0.9 },
    { id:'i5-12600kf', n:'Core i5-12600KF', pl:'LGA1700', arch:'alderlake', c:6, smt:true, e:4,
      boost:4.9, l3:20, l3Ccd:20, ccds:1, vcache:'no', tdp:125, precio:null,
      estado:'El Intel más vendido en Amazon a fines de 2025', memSens:0.9 },
    { id:'i5-12400f', n:'Core i5-12400F', pl:'LGA1700', arch:'alderlake', c:6, smt:true, e:0,
      boost:4.4, l3:18, l3Ccd:18, ccds:1, vcache:'no', tdp:65, precio:null, estado:'Disponible', memSens:0.9 }
  ];

  /* ---------------------------------------------------------------- GPUs ---
     sp    = shaders / stream processors
     clk   = boost en GHz (referencia)
     bus   = ancho de bus en bits
     mem   = velocidad efectiva de memoria en Gbps por pin
     lanes = líneas PCIe (importa en placas PCIe 3.0: ver informe)
     calle = precio mínimo real EE.UU. al 19-sep-2026 (DropReference)
  --------------------------------------------------------------------------- */
  const gpus = [
    // ---- NVIDIA Blackwell (RTX 50) ----------------------------------------
    { id:'5090', n:'GeForce RTX 5090', v:'nvidia', arch:'blackwell', gen:'actual', sp:21760, clk:2.41,
      vram:32, bus:512, mem:28, memTipo:'GDDR7', tbp:575, lanes:16, msrp:1999, calle:4300,
      calleMax:6100, fg:true, uso:'4K extremo / IA', nota:'+120-200% sobre MSRP; el rango varía mucho por fuente.' },
    { id:'5080', n:'GeForce RTX 5080', v:'nvidia', arch:'blackwell', gen:'actual', sp:10752, clk:2.62,
      vram:16, bus:256, mem:30, memTipo:'GDDR7', tbp:360, lanes:16, msrp:999, calle:1000, fg:true,
      uso:'4K / 1440p alto refresco' },
    { id:'5070ti', n:'GeForce RTX 5070 Ti', v:'nvidia', arch:'blackwell', gen:'actual', sp:8960, clk:2.45,
      vram:16, bus:256, mem:28, memTipo:'GDDR7', tbp:300, lanes:16, msrp:749, calle:1009, fg:true,
      uso:'1440p ultra / 4K' },
    { id:'5070', n:'GeForce RTX 5070', v:'nvidia', arch:'blackwell', gen:'actual', sp:6144, clk:2.51,
      vram:12, bus:192, mem:28, memTipo:'GDDR7', tbp:250, lanes:16, msrp:549, calle:670, fg:true,
      uso:'1440p', nota:'Subió ~36% en Newegg entre junio y septiembre 2026.' },
    { id:'5060ti16', n:'GeForce RTX 5060 Ti 16GB', v:'nvidia', arch:'blackwell', gen:'actual', sp:4608, clk:2.57,
      vram:16, bus:128, mem:28, memTipo:'GDDR7', tbp:180, lanes:8, msrp:429, calle:740, fg:true,
      uso:'1080p-1440p' },
    { id:'5060ti8', n:'GeForce RTX 5060 Ti 8GB', v:'nvidia', arch:'blackwell', gen:'actual', sp:4608, clk:2.57,
      vram:8, bus:128, mem:28, memTipo:'GDDR7', tbp:180, lanes:8, msrp:379, calle:470, fg:true,
      uso:'1080p', nota:'Las versiones de 8GB son la compra más arriesgada para 1440p.' },
    { id:'5060', n:'GeForce RTX 5060', v:'nvidia', arch:'blackwell', gen:'actual', sp:3840, clk:2.50,
      vram:8, bus:128, mem:28, memTipo:'GDDR7', tbp:145, lanes:8, msrp:299, calle:370, fg:true,
      uso:'1080p' },
    { id:'5050', n:'GeForce RTX 5050', v:'nvidia', arch:'blackwell', gen:'actual', sp:2560, clk:2.57,
      vram:8, bus:128, mem:20, memTipo:'GDDR6', tbp:130, lanes:8, msrp:249, calle:300, fg:true,
      uso:'1080p entrada / eSports' },

    // ---- AMD RDNA 4 (RX 9000) ---------------------------------------------
    { id:'9070xt', n:'Radeon RX 9070 XT', v:'amd', arch:'rdna4', gen:'actual', sp:4096, clk:2.97,
      vram:16, bus:256, mem:20, memTipo:'GDDR6', tbp:304, lanes:16, msrp:599, calle:780, fg:true,
      uso:'1440p-4K', nota:'La GPU individual más vendida en Amazon (Prime Day 2026).' },
    { id:'9070', n:'Radeon RX 9070', v:'amd', arch:'rdna4', gen:'actual', sp:3584, clk:2.52,
      vram:16, bus:256, mem:20, memTipo:'GDDR6', tbp:220, lanes:16, msrp:549, calle:650, fg:true,
      uso:'1440p', nota:'De las GPUs más eficientes del mercado (GamersNexus).' },
    { id:'9070gre', n:'Radeon RX 9070 GRE', v:'amd', arch:'rdna4', gen:'actual', sp:3072, clk:2.79,
      vram:12, bus:192, mem:20, memTipo:'GDDR6', tbp:220, lanes:16, msrp:549, calle:null, fg:true,
      uso:'1440p', nota:'Ex exclusiva de China, global desde jun-2026. Sin precio de calle en la fuente.' },
    { id:'9060xt16', n:'Radeon RX 9060 XT 16GB', v:'amd', arch:'rdna4', gen:'actual', sp:2048, clk:3.13,
      vram:16, bus:128, mem:20, memTipo:'GDDR6', tbp:160, lanes:8, msrp:349, calle:500, fg:true,
      uso:'1080p-1440p' },
    { id:'9060xt8', n:'Radeon RX 9060 XT 8GB', v:'amd', arch:'rdna4', gen:'actual', sp:2048, clk:3.13,
      vram:8, bus:128, mem:20, memTipo:'GDDR6', tbp:150, lanes:8, msrp:299, calle:430, fg:true,
      uso:'1080p' },

    // ---- Intel Battlemage ---------------------------------------------------
    { id:'b580', n:'Intel Arc B580', v:'intel', arch:'xe2', gen:'actual', sp:2560, clk:2.67,
      vram:12, bus:192, mem:19, memTipo:'GDDR6', tbp:190, lanes:8, msrp:249, calle:null, fg:true,
      uso:'1080p económico', nota:'Intel duplicó su participación en GPUs en ago-2026.' },
    { id:'b570', n:'Intel Arc B570', v:'intel', arch:'xe2', gen:'actual', sp:2304, clk:2.50,
      vram:10, bus:160, mem:19, memTipo:'GDDR6', tbp:150, lanes:8, msrp:219, calle:null, fg:true,
      uso:'1080p económico' },

    // ---- Generaciones anteriores (stock residual / usado, según informe) ----
    { id:'4070', n:'GeForce RTX 4070', v:'nvidia', arch:'ada', gen:'anterior', sp:5888, clk:2.48,
      vram:12, bus:192, mem:21, memTipo:'GDDR6X', tbp:200, lanes:16, msrp:599, calle:null, fg:true, uso:'1440p' },
    { id:'4060ti16', n:'GeForce RTX 4060 Ti 16GB', v:'nvidia', arch:'ada', gen:'anterior', sp:4352, clk:2.54,
      vram:16, bus:128, mem:18, memTipo:'GDDR6', tbp:165, lanes:8, msrp:499, calle:null, fg:true, uso:'1080p-1440p' },
    { id:'4060', n:'GeForce RTX 4060', v:'nvidia', arch:'ada', gen:'anterior', sp:3072, clk:2.46,
      vram:8, bus:128, mem:17, memTipo:'GDDR6', tbp:115, lanes:8, msrp:299, calle:null, fg:true, uso:'1080p' },
    { id:'3060', n:'GeForce RTX 3060 12GB', v:'nvidia', arch:'ampere', gen:'anterior', sp:3584, clk:1.78,
      vram:12, bus:192, mem:15, memTipo:'GDDR6', tbp:170, lanes:16, msrp:329, calle:null, fg:false,
      uso:'1080p', nota:'De las más extendidas todavía; el punto de partida típico de una actualización.' },
    { id:'3050', n:'GeForce RTX 3050 8GB', v:'nvidia', arch:'ampere', gen:'anterior', sp:2560, clk:1.78,
      vram:8, bus:128, mem:14, memTipo:'GDDR6', tbp:130, lanes:8, msrp:249, calle:null, fg:false,
      uso:'1080p entrada', nota:'Base de los builds económicos chilenos y chinos.' },
    { id:'7600', n:'Radeon RX 7600', v:'amd', arch:'rdna3', gen:'anterior', sp:2048, clk:2.66,
      vram:8, bus:128, mem:18, memTipo:'GDDR6', tbp:165, lanes:8, msrp:269, calle:null, fg:true, uso:'1080p' },
    { id:'6600', n:'Radeon RX 6600', v:'amd', arch:'rdna2', gen:'anterior', sp:1792, clk:2.49,
      vram:8, bus:128, mem:14, memTipo:'GDDR6', tbp:132, lanes:8, msrp:229, calle:null, fg:false, uso:'1080p' },
    { id:'6500xt', n:'Radeon RX 6500 XT', v:'amd', arch:'rdna2', gen:'anterior', sp:1024, clk:2.82,
      vram:4, bus:64, mem:18, memTipo:'GDDR6', tbp:107, lanes:4, msrp:199, calle:null, fg:false,
      uso:'1080p entrada', nota:'Citada en builds económicos de China junto al R5 5500.' },
    { id:'a380', n:'Intel Arc A380', v:'intel', arch:'xe1', gen:'anterior', sp:1024, clk:2.45,
      vram:6, bus:96, mem:15.5, memTipo:'GDDR6', tbp:75, lanes:8, msrp:139, calle:null, fg:false, uso:'1080p entrada' },

    // ---- Gráficas integradas (builds "sin GPU" del informe) ----------------
    { id:'780m', n:'Radeon 780M (integrada, 8700G)', v:'amd', arch:'rdna3', gen:'igpu', sp:768, clk:2.90,
      vram:0, bus:0, mem:0, memTipo:'compartida', tbp:0, lanes:0, msrp:0, calle:0, fg:true, igpu:true, uso:'eSports 1080p bajo' },
    { id:'760m', n:'Radeon 760M (integrada, 8600G)', v:'amd', arch:'rdna3', gen:'igpu', sp:512, clk:2.80,
      vram:0, bus:0, mem:0, memTipo:'compartida', tbp:0, lanes:0, msrp:0, calle:0, fg:true, igpu:true, uso:'eSports 1080p bajo' },
    { id:'740m', n:'Radeon 740M (integrada, 8500G)', v:'amd', arch:'rdna3', gen:'igpu', sp:256, clk:2.60,
      vram:0, bus:0, mem:0, memTipo:'compartida', tbp:0, lanes:0, msrp:0, calle:0, fg:true, igpu:true, uso:'eSports 720p-1080p bajo' },
    { id:'vega7', n:'Radeon Vega 7 (integrada, 5600GT)', v:'amd', arch:'vega', gen:'igpu', sp:448, clk:1.90,
      vram:0, bus:0, mem:0, memTipo:'compartida', tbp:0, lanes:0, msrp:0, calle:0, fg:false, igpu:true,
      uso:'eSports 720p-1080p bajo', nota:'El "eSports sin GPU" de ~CLP $500.000 del informe.' }
  ];

  /* ------------------------------------------------------- Placas base -----
     ADVERTENCIA: el informe NO trae precios de placas, fuentes ni gabinetes.
     Estos valores son estimaciones de mercado y están marcados como tales en
     la interfaz; todos se pueden editar a mano.
  --------------------------------------------------------------------------- */
  const placas = [
    { id:'a520', n:'A520 (AM4)', pl:'AM4', mem:'DDR4', pcie:3, m2:3, oc:false, vrm:'básico', precio:70, est:true,
      nota:'M.2 a PCIe 3.0 (~3.500 MB/s máx.). Un SSD Gen4/Gen5 no rinde aquí.' },
    { id:'b550', n:'B550 (AM4)', pl:'AM4', mem:'DDR4', pcie:4, m2:4, oc:true, vrm:'medio', precio:100, est:true },
    { id:'x570', n:'X570 (AM4)', pl:'AM4', mem:'DDR4', pcie:4, m2:4, oc:true, vrm:'alto', precio:150, est:true },
    { id:'a620', n:'A620 (AM5)', pl:'AM5', mem:'DDR5', pcie:4, m2:4, oc:false, vrm:'básico', precio:95, est:true },
    { id:'b650', n:'B650 (AM5)', pl:'AM5', mem:'DDR5', pcie:4, m2:4, oc:true, vrm:'medio', precio:130, est:true },
    { id:'b650e', n:'B650E (AM5)', pl:'AM5', mem:'DDR5', pcie:5, m2:5, oc:true, vrm:'medio', precio:170, est:true },
    { id:'b850', n:'B850 (AM5)', pl:'AM5', mem:'DDR5', pcie:5, m2:5, oc:true, vrm:'alto', precio:180, est:true },
    { id:'x870e', n:'X870E (AM5)', pl:'AM5', mem:'DDR5', pcie:5, m2:5, oc:true, vrm:'alto', precio:300, est:true },
    { id:'b760', n:'B760 (LGA1700)', pl:'LGA1700', mem:'DDR5', pcie:4, m2:4, oc:false, vrm:'medio', precio:120, est:true },
    { id:'b760d4', n:'B760 DDR4 (LGA1700)', pl:'LGA1700', mem:'DDR4', pcie:4, m2:4, oc:false, vrm:'medio', precio:110, est:true },
    { id:'z790', n:'Z790 (LGA1700)', pl:'LGA1700', mem:'DDR5', pcie:5, m2:4, oc:true, vrm:'alto', precio:200, est:true },
    { id:'b860', n:'B860 (LGA1851)', pl:'LGA1851', mem:'DDR5', pcie:5, m2:5, oc:false, vrm:'medio', precio:150, est:true },
    { id:'z890', n:'Z890 (LGA1851)', pl:'LGA1851', mem:'DDR5', pcie:5, m2:5, oc:true, vrm:'alto', precio:250, est:true }
  ];

  /* ----------------------------------------------------------- Memoria ----
     Precios del informe (16-sep-2026): DDR4 US$7,77/GB y DDR5 US$17,50/GB en
     kit retail. Además el informe observó kits de 32GB DDR5-6000 a US$400-490
     en sept-2026: cuando hay rango observado se usa ese (más real que el $/GB).
  --------------------------------------------------------------------------- */
  const memoria = {
    precioGB: { DDR4: 7.77, DDR5: 17.50 },
    observado: { 'DDR5-32': [400, 490] },
    kits: [
      { id:'d4-16x1', tipo:'DDR4', gb:16, mods:1, mt:3200, cl:16, n:'1x16GB DDR4-3200 CL16 (single channel)' },
      { id:'d4-8x2',  tipo:'DDR4', gb:16, mods:2, mt:3200, cl:16, n:'2x8GB DDR4-3200 CL16' },
      { id:'d4-16x2', tipo:'DDR4', gb:32, mods:2, mt:3200, cl:16, n:'2x16GB DDR4-3200 CL16' },
      { id:'d4-16x2-3600', tipo:'DDR4', gb:32, mods:2, mt:3600, cl:18, n:'2x16GB DDR4-3600 CL18 (punto dulce AM4)' },
      { id:'d4-32x2', tipo:'DDR4', gb:64, mods:2, mt:3600, cl:18, n:'2x32GB DDR4-3600 CL18' },
      { id:'d5-16x2-5600', tipo:'DDR5', gb:32, mods:2, mt:5600, cl:36, n:'2x16GB DDR5-5600 CL36' },
      { id:'d5-16x2', tipo:'DDR5', gb:32, mods:2, mt:6000, cl:30, n:'2x16GB DDR5-6000 CL30 EXPO (punto dulce AM5)' },
      { id:'d5-16x2-7200', tipo:'DDR5', gb:32, mods:2, mt:7200, cl:34, n:'2x16GB DDR5-7200 CL34 (Intel 200S Plus)' },
      { id:'d5-32x2', tipo:'DDR5', gb:64, mods:2, mt:6000, cl:30, n:'2x32GB DDR5-6000 CL30' },
      { id:'d5-16x1', tipo:'DDR5', gb:16, mods:1, mt:5600, cl:36, n:'1x16GB DDR5-5600 (single channel)' }
    ],
    nota:'Crisis de memoria: un kit 32GB DDR4 pasó de US$60-90 (oct-2025) a US$150-180 (ene-2026) y sigue subiendo. Micron cerró Crucial en feb-2026.'
  };

  /* ------------------------------------------------------ Almacenamiento --- */
  const ssds = [
    { id:'sn8100', n:'WD_Black SN8100 (SanDisk)', gen:5, lect:14900, esc:14000, precios:{2048:280, 4096:450},
      nota:'Considerado el Gen5 más rápido y eficiente.' },
    { id:'9100pro', n:'Samsung 9100 Pro', gen:5, lect:14800, esc:13400, precios:{2048:679.99},
      nota:'El más fresco en temperatura; muy caro hoy por la crisis NAND.' },
    { id:'t710', n:'Crucial T710', gen:5, lect:14900, esc:13700, precios:{4096:379.99},
      nota:'Buena eficiencia; en una prueba rindió menos que el T705 viejo.' },
    { id:'990pro', n:'Samsung 990 Pro', gen:4, lect:7450, esc:6900, precios:{1024:199},
      nota:'Referente Gen4; en juegos rinde igual que un Gen5. Subió 252-268% desde 2023.' },
    { id:'sn850x', n:'WD_Black SN850X', gen:4, lect:7300, esc:6600, precios:{},
      nota:'Sin precio en la fuente; se estima desde el $/GB Gen4.' },
    { id:'sn7100', n:'WD_Black SN7100', gen:4, lect:7250, esc:6900, precios:{},
      nota:'Favorito para laptops/PS5. Sin precio en la fuente.' },
    { id:'nv3', n:'Kingston NV3', gen:4, lect:6000, esc:5000, precios:{}, barato:true,
      nota:'Sin DRAM; para juegos rinde bien igual.' }
  ];
  const capacidades = [500, 1024, 2048, 4096];

  /* --------------------------------------------------------------- Coolers */
  const coolers = [
    { id:'asp120', n:'Thermalright Assassin Spirit 120 EVO', tipo:'Aire 1 torre', w:125, precio:25,
      nota:'Opción mínima decente.' },
    { id:'freezer36', n:'Arctic Freezer 36', tipo:'Aire 1 torre, 2 fans', w:200, precio:29,
      nota:'El más barato para ~200W sin throttling.' },
    { id:'pa120se', n:'Thermalright Peerless Assassin 120 SE', tipo:'Aire doble torre', w:250, precio:35,
      nota:'El mejor valor según casi todas las guías. 34,5 dBA a máximo (Tom’s).' },
    { id:'ps120se', n:'Thermalright Phantom Spirit 120 SE', tipo:'Aire doble torre', w:265, precio:40,
      nota:'Asimétrico, mejor espacio para RAM; algo más fresco que el PA120 SE.' },
    { id:'frozna620', n:'ID-Cooling Frozn A620', tipo:'Aire doble torre', w:265, precio:40,
      nota:'Algo mejor térmicamente que el PA120 SE.' },
    { id:'mugen6', n:'Scythe Mugen 6 / be quiet! Dark Rock 5 / Fuma 3 / AK620 Digital', tipo:'Aire alta gama', w:260, precio:70,
      precioRango:[50,90], nota:'Mugen 6 y Fuma 3 destacan por espacio para RAM alta.' },
    { id:'nhd15g2', n:'Noctua NH-D15 G2', tipo:'Aire premium', w:300, precio:165, precioRango:[150,180],
      nota:'Líder en aire; iguala un AIO de 360 en carga real. 6 años de garantía.' },
    { id:'lf3-240', n:'Arctic Liquid Freezer III 240', tipo:'AIO 240', w:280, precio:65,
      nota:'Mejor relación precio/rendimiento en líquida.' },
    { id:'lf3-360', n:'Arctic Liquid Freezer III 360', tipo:'AIO 360', w:330, precio:105 },
    { id:'lf3pro360', n:'Arctic Liquid Freezer III Pro 360 A-RGB', tipo:'AIO 360', w:350, precio:140,
      precioRango:[94,190], nota:'Considerado el mejor AIO general; 6 años de garantía.' },
    { id:'fx360', n:'ID-Cooling FX360 INF', tipo:'AIO 360', w:320, precio:80,
      nota:'El 360mm más barato recomendado.' },
    { id:'stock', n:'Cooler incluido / de caja', tipo:'Aire stock', w:95, precio:0,
      nota:'Solo para CPUs de 65W. El 5800X3D 10th Anniversary NO trae cooler.' }
  ];

  /* ----------------------------------------------------------------- Juegos
     Los juegos NO guardan FPS. Guardan el COSTE del frame:

       gpuMs  = milisegundos de trabajo de GPU por frame a 1080p, preset Alto,
                sobre la GPU de referencia (índice 100 = RTX 5070 a 1440p).
       cpuMs  = milisegundos de trabajo de CPU por frame sobre la CPU de
                referencia (índice 100 = Ryzen 7 9800X3D con RAM del punto dulce).

     De ahí salen los FPS: 1000 / (ms escalados por resolución, preset, RT,
     reescalado, VRAM, PCIe y cuello de botella CPU-GPU).

     Los juegos marcados con `ancla` tienen una cifra medida citada en el
     informe y se usan para calibrar (pestaña Metodología).

     cacheSens = cuánto responde el juego a la caché 3D (V-Cache).
     hilos     = "unidades de CPU" que pide para no perder rendimiento.
     ccdSens   = riesgo de que el scheduler lo mande al CCD sin V-Cache.
     sesgo     = arquitectura favorecida por el motor (medido en reseñas).
  --------------------------------------------------------------------------- */
  const juegos = [
    // ---- eSports / competitivos -------------------------------------------
    { id:'cs2', n:'Counter-Strike 2', cat:'eSports', motor:'Source 2',
      gpuMs:1.25, cpuMs:1.45, cacheSens:1.3, hilos:6, resExp:0.93, vram:3.5, low:0.72,
      spread:1.0, ccdSens:0.6, up:['DLSS','FSR','XeSS'],
      ancla:{ texto:'R5 5500 + RTX 3050, 1080p alto: "100+ FPS" (amdyes.cn)', tipo:'min', valor:100,
              build:{ cpu:'5500', gpu:'3050', res:'1080p', preset:'alto' } } },
    { id:'valorant', n:'VALORANT', cat:'eSports', motor:'Unreal 4',
      gpuMs:0.95, cpuMs:1.3, cacheSens:0.8, hilos:5, resExp:0.94, vram:3.0, low:0.80, spread:0.85, ccdSens:0.4, up:false },
    { id:'lol', n:'League of Legends', cat:'eSports', motor:'propio',
      gpuMs:0.85, cpuMs:1.6, cacheSens:0.6, hilos:5, resExp:0.94, vram:2.5, low:0.82, spread:0.8, ccdSens:0.3, up:false },
    { id:'dota2', n:'Dota 2', cat:'eSports', motor:'Source 2',
      gpuMs:1.8, cpuMs:2.6, cacheSens:1.0, hilos:6, resExp:0.92, vram:3.2, low:0.75, spread:0.95, ccdSens:0.5, up:false },
    { id:'ow2', n:'Overwatch 2', cat:'eSports', motor:'propio',
      gpuMs:1.7, cpuMs:2.2, cacheSens:0.9, hilos:6, resExp:0.92, vram:4.5, low:0.76, spread:1.0, ccdSens:0.4, up:['FSR'] },
    { id:'apex', n:'Apex Legends', cat:'eSports', motor:'Source mod',
      gpuMs:2.0, cpuMs:2.4, cacheSens:1.0, hilos:7, resExp:0.92, vram:5.5, low:0.72, spread:0.95, ccdSens:0.5, up:['FSR'] },
    { id:'fortnite', n:'Fortnite', cat:'eSports', motor:'Unreal 5',
      gpuMs:5.0, cpuMs:4.0, cacheSens:1.1, hilos:9, resExp:0.89, vram:5.0, low:0.70, spread:1.15, ccdSens:0.6,
      up:['DLSS','FSR','XeSS'], sesgo:{ nvidia:1.02, intel:0.93 },
      rt:{ n:'Lumen por hardware', mult:1.60, bias:{ amd:0.92 }, vram:1.15 } },
    { id:'pubg', n:'PUBG: Battlegrounds', cat:'eSports', motor:'Unreal 4',
      gpuMs:3.4, cpuMs:3.6, cacheSens:1.4, hilos:9, resExp:0.90, vram:6.0, low:0.62, spread:1.05, ccdSens:0.8, up:['DLSS','FSR'] },
    { id:'rust', n:'Rust', cat:'Superviv.', motor:'Unity',
      gpuMs:6.5, cpuMs:6.5, cacheSens:1.6, hilos:10, resExp:0.88, vram:8.5, low:0.55, spread:1.1, ccdSens:0.9, up:['DLSS','FSR'] },
    { id:'tarkov', n:'Escape from Tarkov (Streets)', cat:'Superviv.', motor:'Unity',
      gpuMs:7.0, cpuMs:9.5, cacheSens:2.0, hilos:10.4, resExp:0.88, vram:9.0, low:0.50, spread:1.05, ccdSens:1.0, up:['DLSS','FSR'] },
    { id:'naraka', n:'Naraka: Bladepoint', cat:'Acción', motor:'Unity',
      gpuMs:5.2, cpuMs:3.8, cacheSens:1.0, hilos:8, resExp:0.90, vram:6.5, low:0.65, spread:1.1, ccdSens:0.5, up:['DLSS','FSR'],
      ancla:{ texto:'R5 5500 + GPU de entrada, 1080p medio: "~60 FPS estables" (amdyes.cn)', tipo:'aprox', valor:60,
              build:{ cpu:'5500', gpu:'3050', res:'1080p', preset:'medio' } } },
    { id:'deltaforce', n:'Delta Force', cat:'eSports', motor:'Unreal 4',
      gpuMs:4.2, cpuMs:3.4, cacheSens:1.0, hilos:8, resExp:0.90, vram:6.0, low:0.68, spread:1.05, ccdSens:0.5, up:['DLSS','FSR'] },
    { id:'bo6', n:'CoD: Black Ops 6 / Warzone', cat:'Shooter', motor:'IW 9.0',
      gpuMs:5.2, cpuMs:4.2, cacheSens:1.3, hilos:9, resExp:0.89, vram:8.0, low:0.66, spread:1.15, ccdSens:0.7,
      up:['DLSS','FSR','XeSS'], sesgo:{ amd:1.15 },
      rt:{ n:'RT sombras', mult:1.25, vram:1.1 },
      ancla:{ texto:'RX 9070 XT ~22% sobre RTX 5070 Ti a 1440p (informe)', tipo:'ratio', valor:1.22,
              comparar:['9070xt','5070ti'], res:'1440p' } },
    { id:'marvelrivals', n:'Marvel Rivals', cat:'Shooter', motor:'Unreal 5',
      gpuMs:5.6, cpuMs:4.6, cacheSens:1.2, hilos:9, resExp:0.89, vram:7.0, low:0.66, spread:1.15, ccdSens:0.6,
      up:['DLSS','FSR','XeSS'], sesgo:{ nvidia:1.02, intel:0.92 },
      rt:{ n:'Lumen por hardware', mult:1.35, bias:{ amd:0.93 }, vram:1.12 } },
    { id:'roblox', n:'Roblox', cat:'eSports', motor:'propio',
      gpuMs:1.2, cpuMs:2.2, cacheSens:0.7, hilos:5, resExp:0.93, vram:2.5, low:0.78, spread:0.85, ccdSens:0.3, up:false },
    { id:'minecraft', n:'Minecraft Java (render lejano)', cat:'Superviv.', motor:'Java',
      gpuMs:2.4, cpuMs:3.2, cacheSens:1.8, hilos:5, resExp:0.92, vram:4.0, low:0.62, spread:0.9, ccdSens:0.7, up:false },
    { id:'minecraft-sh', n:'Minecraft + shaders (BSL/Complementary)', cat:'Superviv.', motor:'Java',
      gpuMs:9.5, cpuMs:3.2, cacheSens:1.8, hilos:5, resExp:0.88, vram:6.0, low:0.62, spread:1.3, ccdSens:0.7, up:false },
    { id:'fc26', n:'EA Sports FC 26', cat:'Deportes', motor:'Frostbite',
      gpuMs:3.0, cpuMs:2.4, cacheSens:0.8, hilos:7, resExp:0.91, vram:5.0, low:0.74, spread:1.0, ccdSens:0.4, up:['DLSS','FSR'] },

    // ---- AAA / campaña -----------------------------------------------------
    { id:'cyberpunk', n:'Cyberpunk 2077', cat:'AAA', motor:'RED Engine 4',
      gpuMs:5.9, cpuMs:4.4, cacheSens:1.2, hilos:9, resExp:0.88, vram:7.0, low:0.70, spread:1.2, ccdSens:0.6,
      up:['DLSS','FSR','XeSS'], sesgo:{ nvidia:1.02 },
      rt:{ n:'Ray tracing medio', mult:1.55, bias:{ amd:0.85, intel:0.85 }, vram:1.20 },
      pt:{ n:'Path tracing', mult:3.10, bias:{ amd:0.63, intel:0.60 }, vram:1.35 },
      ancla:{ texto:'GN: 9850X3D lideró a ~230 FPS promedio en calidad media (prueba de CPU)', tipo:'cpu', valor:230,
              build:{ cpu:'9850x3d', gpu:'5090', res:'1080p', preset:'medio' } } },
    { id:'bg3', n:'Baldur’s Gate 3 (Acto 3)', cat:'AAA', motor:'Divinity 4.0',
      gpuMs:4.6, cpuMs:5.6, cacheSens:1.5, hilos:9, resExp:0.90, vram:6.0, low:0.68, spread:1.05, ccdSens:0.7,
      up:['DLSS','FSR'],
      ancla:{ texto:'GN: 9950X3D2 hizo 178 FPS, ~5% sobre el 9950X3D', tipo:'cpu', valor:178,
              build:{ cpu:'9950x3d2', gpu:'5090', res:'1080p', preset:'alto' } } },
    { id:'eldenring', n:'Elden Ring', cat:'AAA', motor:'FromSoft',
      gpuMs:5.0, cpuMs:6.6, cacheSens:1.3, hilos:8, resExp:0.90, vram:6.0, low:0.66, spread:1.0, ccdSens:0.6,
      up:false, cap:60, capNota:'El juego tiene tope de 60 FPS.' },
    { id:'rdr2', n:'Red Dead Redemption 2', cat:'AAA', motor:'RAGE',
      gpuMs:5.5, cpuMs:4.0, cacheSens:1.0, hilos:9, resExp:0.88, vram:6.5, low:0.70, spread:1.2, ccdSens:0.5, up:['DLSS','FSR'] },
    { id:'gta5e', n:'GTA V Enhanced', cat:'AAA', motor:'RAGE',
      gpuMs:3.6, cpuMs:3.2, cacheSens:1.1, hilos:8, resExp:0.90, vram:5.0, low:0.70, spread:1.1, ccdSens:0.5,
      up:['DLSS','FSR'], rt:{ n:'RT reflejos+sombras', mult:1.40, bias:{ amd:0.90 }, vram:1.15 } },
    { id:'helldivers2', n:'Helldivers 2', cat:'Shooter', motor:'Stingray',
      gpuMs:5.5, cpuMs:5.0, cacheSens:1.2, hilos:9, resExp:0.89, vram:6.5, low:0.62, spread:1.1, ccdSens:0.6, up:['DLSS','FSR'] },
    { id:'mhwilds', n:'Monster Hunter Wilds', cat:'AAA', motor:'RE Engine',
      gpuMs:8.5, cpuMs:6.2, cacheSens:1.3, hilos:10, resExp:0.88, vram:9.0, low:0.60, spread:1.15, ccdSens:0.7,
      up:['DLSS','FSR'], rt:{ n:'RT medio', mult:1.30, vram:1.15 } },
    { id:'doomtda', n:'Doom: The Dark Ages', cat:'Shooter', motor:'id Tech 8',
      gpuMs:6.0, cpuMs:3.0, cacheSens:0.9, hilos:9, resExp:0.90, vram:8.5, low:0.76, spread:1.15, ccdSens:0.4,
      up:['DLSS','FSR','XeSS'], sesgo:{ amd:1.05 }, rtSiempre:true,
      nota:'Usa ray tracing obligatorio: ya está dentro del coste base.',
      ancla:{ texto:'Notebookcheck: la RTX 5060 Ti no llega a 60 FPS a 1440p en calidad máxima', tipo:'max', valor:60,
              build:{ cpu:'9800x3d', gpu:'5060ti16', res:'1440p', preset:'ultra' } } },
    { id:'f125', n:'F1 25', cat:'Carreras', motor:'EGO 5.0',
      gpuMs:3.2, cpuMs:2.7, cacheSens:1.0, hilos:8, resExp:0.90, vram:5.5, low:0.78, spread:1.1, ccdSens:0.5,
      up:['DLSS','FSR'], rt:{ n:'RT reflejos', mult:1.45, bias:{ amd:0.90 }, vram:1.15 },
      ancla:{ texto:'GN: 9950X3D2 y 9950X3D empatados a ~364 FPS', tipo:'cpu', valor:364,
              build:{ cpu:'9950x3d2', gpu:'5090', res:'1080p', preset:'alto' } } },
    { id:'twwh3', n:'Total War: Warhammer III (batalla)', cat:'Estrategia', motor:'TW Engine',
      gpuMs:5.4, cpuMs:6.5, cacheSens:1.7, hilos:9, resExp:0.90, vram:6.5, low:0.58, spread:1.1, ccdSens:1.0,
      up:['DLSS','FSR'],
      ancla:{ texto:'TechRadar: 9800X3D 506 FPS vs 331 del 9950X3D (juego en el CCD sin V-Cache)', tipo:'cpu', valor:506,
              build:{ cpu:'9800x3d', gpu:'5090', res:'1080p', preset:'alto' },
              revisar:'La cifra citada parece de una escena muy liviana. El modelo usa una batalla representativa, así que da bastante menos. Lo que sí reproduce es la caída relativa del 9950X3D.' } },
    { id:'starfield', n:'Starfield', cat:'AAA', motor:'Creation 2',
      gpuMs:7.2, cpuMs:6.0, cacheSens:1.4, hilos:9, resExp:0.89, vram:7.5, low:0.62, spread:1.1, ccdSens:0.7,
      up:['DLSS','FSR','XeSS'], sesgo:{ amd:1.08 } },
    { id:'re4', n:'Resident Evil 4 Remake', cat:'AAA', motor:'RE Engine',
      gpuMs:3.8, cpuMs:3.0, cacheSens:1.0, hilos:8, resExp:0.90, vram:7.5, low:0.72, spread:1.25, ccdSens:0.5,
      up:['FSR'], rt:{ n:'RT medio', mult:1.30, vram:1.20 },
      nota:'Las texturas altas disparan la VRAM: es el caso típico donde 8GB se queda corto.' },
    { id:'dd2', n:'Dragon’s Dogma 2 (ciudad)', cat:'AAA', motor:'RE Engine',
      gpuMs:7.5, cpuMs:10.5, cacheSens:1.3, hilos:10, resExp:0.89, vram:8.0, low:0.58, spread:1.05, ccdSens:0.7,
      up:['DLSS','FSR'],
      ancla:{ texto:'GN midió el Core Ultra 7 270K Plus por detrás del i7-14700K', tipo:'ratio', valor:0.97,
              compararCpu:['u7-270kp','i7-14700k'],
              revisar:'El modelo pone al 270K Plus por delante. Un modelo de specs no captura las rarezas de latencia de Arrow Lake en motores concretos: en este juego puntual hay que creerle a la medición, no al modelo.' } },
    { id:'msfs2024', n:'Microsoft Flight Simulator 2024', cat:'Simulación', motor:'propio',
      gpuMs:8.0, cpuMs:13.0, cacheSens:2.0, hilos:10, resExp:0.87, vram:9.5, low:0.55, spread:1.1, ccdSens:0.9, up:['DLSS','FSR'] },
    // ---- Rol, MMO, gestión y vida (perfiles de carga muy distintos) -------
    { id:'wukong', n:'Black Myth: Wukong', cat:'AAA', motor:'Unreal 5',
      gpuMs:9.8, cpuMs:6.5, cacheSens:1.0, hilos:9, resExp:0.88, vram:8.5, low:0.66, spread:1.2, ccdSens:0.5,
      up:['DLSS','FSR','XeSS'], sesgo:{ nvidia:1.03, intel:0.92 },
      rt:{ n:'Ray tracing completo', mult:1.90, bias:{ amd:0.80, intel:0.78 }, vram:1.20 } },
    { id:'poe2', n:'Path of Exile 2', cat:'Rol', motor:'propio',
      gpuMs:4.2, cpuMs:7.0, cacheSens:1.5, hilos:9, resExp:0.90, vram:6.5, low:0.55, spread:1.05, ccdSens:0.8,
      up:['DLSS','FSR'], nota:'Las pantallas con muchos enemigos son cosa del procesador, no de la gráfica.' },
    { id:'diablo4', n:'Diablo IV', cat:'Rol', motor:'propio',
      gpuMs:3.6, cpuMs:3.4, cacheSens:1.0, hilos:8, resExp:0.91, vram:7.0, low:0.72, spread:1.1, ccdSens:0.5,
      up:['DLSS','FSR','XeSS'], rt:{ n:'RT sombras y reflejos', mult:1.35, vram:1.15 } },
    { id:'genshin', n:'Genshin Impact', cat:'Rol', motor:'Unity',
      gpuMs:2.6, cpuMs:3.0, cacheSens:0.9, hilos:6, resExp:0.92, vram:4.5, low:0.78, spread:0.95, ccdSens:0.4,
      up:false, cap:60, capNota:'El juego está limitado a 60 FPS.' },
    { id:'hsr', n:'Honkai: Star Rail', cat:'Rol', motor:'Unity',
      gpuMs:2.2, cpuMs:2.8, cacheSens:0.8, hilos:6, resExp:0.92, vram:4.0, low:0.80, spread:0.9, ccdSens:0.4,
      up:false, cap:120, capNota:'El juego está limitado a 120 FPS.' },
    { id:'wow', n:'World of Warcraft (banda)', cat:'MMO', motor:'propio',
      gpuMs:3.2, cpuMs:8.0, cacheSens:1.6, hilos:8, resExp:0.91, vram:5.0, low:0.60, spread:1.1, ccdSens:0.8,
      up:['DLSS','FSR'], rt:{ n:'RT sombras', mult:1.30, vram:1.10 },
      nota:'En banda de 20 personas manda el procesador; la caché 3D se nota mucho.' },
    { id:'ffxiv', n:'Final Fantasy XIV', cat:'MMO', motor:'Crystal Tools',
      gpuMs:2.8, cpuMs:4.2, cacheSens:1.2, hilos:7, resExp:0.91, vram:4.5, low:0.68, spread:1.0, ccdSens:0.6, up:['DLSS','FSR'] },
    { id:'destiny2', n:'Destiny 2', cat:'Shooter', motor:'Tiger',
      gpuMs:3.4, cpuMs:3.8, cacheSens:1.1, hilos:8, resExp:0.91, vram:6.0, low:0.70, spread:1.05, ccdSens:0.5, up:['DLSS','FSR','XeSS'] },
    { id:'bf6', n:'Battlefield 6', cat:'Shooter', motor:'Frostbite',
      gpuMs:5.6, cpuMs:5.0, cacheSens:1.3, hilos:10, resExp:0.89, vram:8.0, low:0.62, spread:1.15, ccdSens:0.7,
      up:['DLSS','FSR','XeSS'], sesgo:{ amd:1.05 },
      nota:'Con 64 jugadores el procesador sufre bastante más que en una campaña.' },
    { id:'thefinals', n:'The Finals', cat:'Shooter', motor:'Unreal 5',
      gpuMs:4.4, cpuMs:5.2, cacheSens:1.3, hilos:10, resExp:0.90, vram:6.5, low:0.62, spread:1.1, ccdSens:0.7,
      up:['DLSS','FSR','XeSS'], nota:'La destrucción de escenarios se calcula en el procesador.' },
    { id:'acshadows', n:'Assassin\u2019s Creed Shadows', cat:'AAA', motor:'Anvil',
      gpuMs:8.8, cpuMs:6.5, cacheSens:1.2, hilos:10, resExp:0.88, vram:9.0, low:0.62, spread:1.2, ccdSens:0.6,
      up:['DLSS','FSR','XeSS'], sesgo:{ amd:1.03 },
      rt:{ n:'RT global', mult:1.55, bias:{ amd:0.88 }, vram:1.20 } },
    { id:'hogwarts', n:'Hogwarts Legacy', cat:'AAA', motor:'Unreal 4',
      gpuMs:6.2, cpuMs:5.5, cacheSens:1.2, hilos:9, resExp:0.89, vram:8.0, low:0.60, spread:1.15, ccdSens:0.6,
      up:['DLSS','FSR'], rt:{ n:'RT reflejos y sombras', mult:1.60, bias:{ amd:0.85 }, vram:1.20 },
      nota:'Famoso por los tirones al recorrer el castillo; ahí pesan la VRAM y el procesador.' },
    { id:'spacemarine2', n:'Warhammer 40.000: Space Marine 2', cat:'Acción', motor:'Swarm',
      gpuMs:6.4, cpuMs:5.0, cacheSens:1.2, hilos:9, resExp:0.89, vram:7.5, low:0.65, spread:1.1, ccdSens:0.6, up:['DLSS','FSR'] },
    { id:'ark', n:'ARK: Survival Ascended', cat:'Superviv.', motor:'Unreal 5',
      gpuMs:11.5, cpuMs:7.5, cacheSens:1.3, hilos:10, resExp:0.88, vram:9.5, low:0.55, spread:1.25, ccdSens:0.7,
      up:['DLSS','FSR'], nota:'De lo más pesado que hay: sin reescalado cuesta mucho incluso a 1080p.' },
    { id:'palworld', n:'Palworld', cat:'Superviv.', motor:'Unreal 5',
      gpuMs:5.5, cpuMs:5.5, cacheSens:1.2, hilos:9, resExp:0.89, vram:6.5, low:0.60, spread:1.1, ccdSens:0.6, up:['DLSS','FSR'] },
    { id:'valheim', n:'Valheim', cat:'Superviv.', motor:'Unity',
      gpuMs:3.4, cpuMs:4.4, cacheSens:1.2, hilos:7, resExp:0.91, vram:5.0, low:0.65, spread:1.05, ccdSens:0.6, up:false },
    { id:'seaofthieves', n:'Sea of Thieves', cat:'Acción', motor:'Unreal 4',
      gpuMs:3.0, cpuMs:3.2, cacheSens:1.0, hilos:8, resExp:0.91, vram:5.5, low:0.72, spread:1.05, ccdSens:0.5, up:['DLSS','FSR'] },
    { id:'satisfactory', n:'Satisfactory (fábrica grande)', cat:'Gestión', motor:'Unreal 5',
      gpuMs:6.0, cpuMs:7.0, cacheSens:1.5, hilos:9, resExp:0.89, vram:7.0, low:0.60, spread:1.1, ccdSens:0.8,
      up:['DLSS','FSR'], rt:{ n:'Lumen por hardware', mult:1.40, bias:{ amd:0.92 }, vram:1.12 } },
    { id:'factorio', n:'Factorio (fábrica grande)', cat:'Gestión', motor:'propio',
      gpuMs:0.8, cpuMs:12.0, cacheSens:2.0, hilos:5, resExp:0.95, vram:2.0, low:0.80, spread:0.8, ccdSens:0.9,
      up:false, nota:'Aquí la gráfica no pinta nada: manda la caché del procesador. Es el caso donde más se nota un X3D.' },
    { id:'cs2skylines', n:'Cities: Skylines II', cat:'Gestión', motor:'Unity',
      gpuMs:8.0, cpuMs:15.0, cacheSens:1.6, hilos:10, resExp:0.89, vram:8.0, low:0.55, spread:1.1, ccdSens:0.8,
      up:['DLSS','FSR'], nota:'Una ciudad grande hunde a cualquier procesador; es más problema de optimización que de hardware.' },
    { id:'sims4', n:'Los Sims 4', cat:'Simulación', motor:'propio',
      gpuMs:1.8, cpuMs:4.0, cacheSens:1.2, hilos:5, resExp:0.93, vram:3.5, low:0.70, spread:0.9, ccdSens:0.6, up:false },
    { id:'warthunder', n:'War Thunder', cat:'Simulación', motor:'Dagor',
      gpuMs:2.8, cpuMs:3.2, cacheSens:1.0, hilos:7, resExp:0.91, vram:5.0, low:0.72, spread:1.05, ccdSens:0.5, up:['DLSS','FSR'] },
    { id:'wot', n:'World of Tanks', cat:'Acción', motor:'Core',
      gpuMs:1.8, cpuMs:2.4, cacheSens:0.9, hilos:6, resExp:0.92, vram:4.0, low:0.78, spread:1.0, ccdSens:0.4, up:false },
    { id:'stardew', n:'Stardew Valley', cat:'Indie', motor:'MonoGame',
      gpuMs:0.8, cpuMs:2.2, cacheSens:0.5, hilos:4, resExp:0.95, vram:1.5, low:0.85, spread:0.7, ccdSens:0.2, up:false,
      nota:'Corre en cualquier cosa, incluso con gráfica integrada.' },
    { id:'terraria', n:'Terraria', cat:'Indie', motor:'XNA',
      gpuMs:0.7, cpuMs:2.6, cacheSens:0.6, hilos:4, resExp:0.95, vram:1.5, low:0.85, spread:0.7, ccdSens:0.2,
      up:false, cap:60, capNota:'El juego viene limitado a 60 FPS.' },
    { id:'fh5', n:'Forza Horizon 5', cat:'Carreras', motor:'ForzaTech',
      gpuMs:3.4, cpuMs:2.8, cacheSens:0.9, hilos:8, resExp:0.91, vram:6.0, low:0.76, spread:1.1, ccdSens:0.4,
      up:['DLSS','FSR'], rt:{ n:'RT en pista', mult:1.30, vram:1.10 } }
  ];

  /* ------------------------------------------------- Codificadores de video
     Dato de hardware, no de rendimiento: qué motor de codificación trae cada
     arquitectura y si sabe hacer AV1. Importa al exportar video y al grabar o
     transmitir partidas, porque el trabajo no se lo lleva el procesador.
  --------------------------------------------------------------------------- */
  const codificadores = {
    blackwell:{ n:'NVENC', av1:true,  nota:'El codificador con mejor fama para grabar y transmitir.' },
    ada:      { n:'NVENC', av1:true,  nota:'El codificador con mejor fama para grabar y transmitir.' },
    ampere:   { n:'NVENC', av1:false, nota:'Codifica H.264 y HEVC, pero no AV1.' },
    rdna4:    { n:'AMF',   av1:true,  nota:'Mejoró mucho; ya sirve bien para grabar.' },
    rdna3:    { n:'AMF',   av1:true,  nota:'Correcto para grabar, algo por detrás de NVENC.' },
    rdna2:    { n:'AMF',   av1:false, nota:'Sin AV1 y por detrás de NVENC.' },
    vega:     { n:'VCE',   av1:false, nota:'Codificador antiguo, solo para salir del paso.' },
    xe2:      { n:'QuickSync', av1:true, nota:'QuickSync es de lo mejor para exportar video, sobre todo en AV1.' },
    xe1:      { n:'QuickSync', av1:true, nota:'QuickSync exporta video muy rápido para lo que cuesta.' }
  };

  /* ------------------------------------------------------------- Fuentes --- */
  const fuentes = [
    'Tom’s Hardware', 'TechSpot', 'GamersNexus', 'TechPowerUp', 'TweakTown', 'Notebookcheck',
    'PCWorld', 'Engadget', 'XDA', 'PC Guide', 'Wccftech', 'VideoCardz/Club386', 'DropReference',
    'Tech Insider', 'Capital & Compute', 'TechEpiphany (Amazon US y Mindfactory)', 'HowManyFPS',
    'CPUtronic', 'cpuranklist / Zhihu / amdyes / mydrivers (China)', 'hwland.cl', 'factorynew.cl',
    'SoloTodo (Chile)', 'El Mostrador'
  ];

  /* --------------------------------------- Builds de referencia del informe */
  const presets = [
    { id:'am4-viejo', n:'AM4 de hace unos años (Ryzen 5000 + RTX 3060)', cpu:'5900x', gpu:'3060', placa:'a520',
      ram:'d4-16x1', ssd:'nv3', ssdCap:1024, cooler:'pa120se',
      ref:'Equipo típico a actualizar: sirve para ver cuánto cuesta el single channel y una placa PCIe 3.0.' },
    { id:'cl-esports', n:'Chile: eSports sin GPU (~CLP $500.000)', cpu:'5600gt', gpu:'vega7', placa:'a520',
      ram:'d4-16x2', ssd:'nv3', ssdCap:500, cooler:'stock', ref:'SoloTodo abr-2026' },
    { id:'cl-1080', n:'Chile: 1080p AAA alto (~CLP $800.000)', cpu:'5600', gpu:'5060', placa:'b550',
      ram:'d4-16x2', ssd:'nv3', ssdCap:1024, cooler:'asp120', ref:'SoloTodo abr-2026' },
    { id:'cl-1440', n:'Chile: 1440p 60-90 FPS (~CLP $1.500.000)', cpu:'7600', gpu:'5060ti16', placa:'b650',
      ram:'d5-16x2', ssd:'990pro', ssdCap:1024, cooler:'pa120se', ref:'SoloTodo abr-2026' },
    { id:'cl-ultra', n:'Chile: 1440p ultra / 4K medio (~CLP $2.500.000+)', cpu:'7800x3d', gpu:'5070ti', placa:'b650e',
      ram:'d5-16x2', ssd:'990pro', ssdCap:2048, cooler:'lf3-360', ref:'SoloTodo abr-2026' },
    { id:'am4-max', n:'AM4 máximo FPS (reusando placa y DDR4)', cpu:'5800x3d', gpu:'9060xt16', placa:'b550',
      ram:'d4-16x2-3600', ssd:'990pro', ssdCap:1024, cooler:'ps120se', ref:'Resumen del informe' },
    { id:'am5-max', n:'AM5 máximo FPS en juegos', cpu:'9800x3d', gpu:'9070xt', placa:'b650e',
      ram:'d5-16x2', ssd:'sn8100', ssdCap:2048, cooler:'lf3-360', ref:'Resumen del informe' },
    { id:'am5-valor', n:'AM5 valor gamer', cpu:'7700x3d', gpu:'9070', placa:'b650',
      ram:'d5-16x2', ssd:'990pro', ssdCap:1024, cooler:'pa120se', ref:'Resumen del informe' }
  ];

  return { meta, cpus, gpus, placas, memoria, ssds, capacidades, coolers, juegos, codificadores, fuentes, presets };
})();

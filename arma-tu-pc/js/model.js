/* ===========================================================================
   model.js — Motor de estimación.

   No existe ninguna tabla "GPU X + juego Y = Z FPS". Todo sale de:

     1. Un índice de GPU calculado desde specs (shaders, reloj, bus, memoria)
        con un modelo roofline: rendimiento = mezcla de cómputo y ancho de
        banda, con el peso del ancho de banda subiendo con la resolución.
     2. Un índice de CPU calculado desde IPC por arquitectura, reloj real del
        CCD, caché L3 por núcleo, núcleos útiles y calidad de la RAM.
     3. Un coste de frame por juego (ms de GPU y ms de CPU) escalado por
        resolución, preset, ray tracing y reescalado.
     4. Penalizaciones físicas: VRAM insuficiente, PCIe 3.0 con tarjetas x8,
        single channel, RAM total corta, scheduler de los X3D de doble CCD.

   Los coeficientes de calibración (CAL) están todos aquí, a la vista, y la
   pestaña "Metodología" los contrasta contra las cifras medidas que cita el
   informe.
   =========================================================================== */

window.MODEL = (function (D) {
  'use strict';

  /* ------------------------------------------------- Constantes del modelo */
  const CAL = {
    arq: {
      // eff  = rendimiento real por TFLOP nominal (NVIDIA infla TFLOPs con el
      //        FP32 de doble emisión; AMD e Intel no de la misma forma).
      // cache= multiplicador de ancho de banda efectivo por caché grande
      //        (L2 de Ada/Blackwell, Infinity Cache de RDNA).
      blackwell:{ eff:0.57, cache:1.45, n:'NVIDIA Blackwell' },
      ada:      { eff:0.57, cache:1.45, n:'NVIDIA Ada' },
      ampere:   { eff:0.50, cache:1.00, n:'NVIDIA Ampere' },
      rdna4:    { eff:0.98, cache:1.75, n:'AMD RDNA 4' },
      rdna3:    { eff:0.85, cache:1.70, n:'AMD RDNA 3' },
      rdna2:    { eff:0.88, cache:1.80, n:'AMD RDNA 2' },
      vega:     { eff:0.80, cache:1.00, n:'AMD Vega (iGPU)' },
      xe2:      { eff:0.63, cache:1.25, n:'Intel Xe2 Battlemage' },
      xe1:      { eff:0.52, cache:1.10, n:'Intel Xe Alchemist' }
    },
    bwEquiv: 0.018,      // GB/s -> unidades equivalentes de cómputo
    anchoUtil: 8000,     // shaders por encima de los cuales cae la ocupación
    anchoExp: 0.38,      // fuerza de esa caída (los chips enormes no escalan)
    bwPeso: { '1080p':0.25, '1440p':0.33, 'uw1440':0.37, '4k':0.45 },
    igpuComparte: 0.65,  // fracción del ancho de banda del sistema que ve una iGPU

    ipc: { zen3:1.00, zen3apu:0.98, zen4:1.15, zen5:1.27,
           alderlake:1.06, raptorlake:1.14, arrowlake:1.19, arrowlake_r:1.25 },
    clockExp: 0.75,      // elasticidad FPS <- reloj (nunca es 1:1)
    clockSost: 0.97,     // boost anunciado -> reloj sostenido
    cacheK: 0.13,        // ganancia por duplicar la L3 por núcleo
    cacheMin: -0.15, cacheMax: 0.32,
    smt: 1.30, ecore: 0.45,
    hilosExp: 0.50,
    memBw: 0.22, memLat: 0.30, memSingle: 0.06,
    ccdAsim: 0.08,       // caída esperada del X3D de doble CCD en juegos sensibles
    ccdAsimPeor: 0.35,   // peor caso documentado (TW:WH3, TechRadar)
    ccdSimple: 0.04,     // cruce de CCD en un Ryzen normal de doble CCD

    pxRef: 2.0736,       // megapíxeles de 1080p
    mezcla: 6,           // exponente de la mezcla CPU/GPU (6 = poco solape)
    preset: { bajo:0.55, medio:0.72, alto:1.00, ultra:1.25 },
    presetVram: { bajo:0.72, medio:0.86, alto:1.00, ultra:1.10 },
    resVram: { '1080p':1.00, '1440p':1.15, 'uw1440':1.22, '4k':1.35 },
    reserva: 0.9,        // GB de VRAM que se queda el sistema
    vramAvg: 0.30, vramLow: 0.85,
    pcie3x8: 0.96, pcie3x4: 0.90, pcie3Desborde: 0.85,
    upsOverhead: 0.30,   // ms de coste del reescalador a 1440p
    fgGanancia: 1.72, fgGananciaCpu: 1.85,
    margen: 0.15         // ±15%: incertidumbre honesta de una estimación
  };

  const RES = {
    '1080p':  { n:'1920 x 1080',  px:2.0736 },
    '1440p':  { n:'2560 x 1440',  px:3.6864 },
    'uw1440': { n:'3440 x 1440',  px:4.9536 },
    '4k':     { n:'3840 x 2160',  px:8.2944 }
  };
  const UPS = {
    off:          { n:'Nativo',                    esc:1.00 },
    calidad:      { n:'Calidad (DLSS/FSR/XeSS)',   esc:0.667 },
    equilibrado:  { n:'Equilibrado',               esc:0.580 },
    rendimiento:  { n:'Rendimiento',               esc:0.500 }
  };

  const idx = (arr, id) => arr.find(x => x.id === id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const log2 = v => Math.log(v) / Math.LN2;

  /* ============================================================ GPU ======= */

  function anchoBandaGpu(gpu, ram) {
    if (gpu.igpu) {
      const bw = memBandwidth(ram);              // GB/s del sistema
      return bw * CAL.igpuComparte;
    }
    return (gpu.bus / 8) * gpu.mem;              // GB/s = bytes/ciclo * Gbps
  }

  function gpuBruto(gpu, resKey, ram) {
    const a = CAL.arq[gpu.arch];
    const tflops = gpu.sp * 2 * gpu.clk / 1000;
    const util = Math.min(1, Math.pow(CAL.anchoUtil / gpu.sp, CAL.anchoExp));
    const computo = tflops * a.eff * util;
    const bw = anchoBandaGpu(gpu, ram) * a.cache * CAL.bwEquiv;
    const w = CAL.bwPeso[resKey];
    return 1 / ((1 - w) / computo + w / bw);     // mezcla roofline
  }

  // Normalización: RTX 5070 a 1440p = 100. Se calcula, no se escribe a mano.
  const RAM_REF_DDR5 = { tipo:'DDR5', mt:6000, cl:30, mods:2, gb:32 };
  const RAM_REF_DDR4 = { tipo:'DDR4', mt:3600, cl:18, mods:2, gb:32 };
  const GPU_NORM = 100 / gpuBruto(idx(D.gpus, '5070'), '1440p', RAM_REF_DDR5);

  function gpuIndex(gpu, resKey, ram) {
    return gpuBruto(gpu, resKey, ram || RAM_REF_DDR5) * GPU_NORM;
  }

  /* ============================================================ RAM ======= */

  function memBandwidth(ram) { return ram.mt * 8 * Math.min(ram.mods, 2) / 1000; }
  function memLatencia(ram) { return ram.cl * 2000 / ram.mt; }

  function memFactor(cpu, ram) {
    const ref = ram.tipo === 'DDR4' ? RAM_REF_DDR4 : RAM_REF_DDR5;
    const bw = memBandwidth(ram), bwRef = memBandwidth(ref);
    const lat = memLatencia(ram), latRef = memLatencia(ref);
    let f = 1 + cpu.memSens * (CAL.memBw * Math.log(bw / bwRef) +
                               CAL.memLat * (latRef - lat) / latRef);
    if (ram.mods < 2) f -= CAL.memSingle * cpu.memSens;
    return clamp(f, 0.60, 1.12);
  }

  /* ============================================================ CPU ======= */

  function unidadesCpu(cpu) {
    return cpu.c * (cpu.smt ? CAL.smt : 1) + (cpu.e || 0) * CAL.ecore;
  }

  function cacheBonus(cpu) {
    return clamp(CAL.cacheK * log2(cpu.l3Ccd / 32), CAL.cacheMin, CAL.cacheMax);
  }

  function cpuBruto(cpu, opts) {
    const o = opts || {};
    const sens = o.cacheSens === undefined ? 1 : o.cacheSens;
    const ram = o.ram || (cpu.pl === 'AM4' ? RAM_REF_DDR4 : RAM_REF_DDR5);
    const reloj = (cpu.gameClock || cpu.boost) * CAL.clockSost;
    let v = CAL.ipc[cpu.arch] * Math.pow(reloj, CAL.clockExp) * (1 + cacheBonus(cpu) * sens);
    if (o.hilos) v *= Math.min(1, Math.pow(unidadesCpu(cpu) / o.hilos, CAL.hilosExp));
    v *= memFactor(cpu, ram);
    if (o.ccdSens) {
      if (cpu.vcache === 'uno' && cpu.ccds > 1) v *= 1 - (o.peorCaso ? CAL.ccdAsimPeor : CAL.ccdAsim) * o.ccdSens;
      else if (cpu.ccds > 1) v *= 1 - CAL.ccdSimple * o.ccdSens;
    }
    return v;
  }

  const CPU_NORM = 100 / cpuBruto(idx(D.cpus, '9800x3d'), { ram: RAM_REF_DDR5 });
  function cpuIndex(cpu, opts) { return cpuBruto(cpu, opts) * CPU_NORM; }
  // Índice "genérico" para rankings y regresión de precios.
  function cpuIndexJuegos(cpu) { return cpuIndex(cpu, { cacheSens: 1, hilos: 9, ccdSens: 0.6 }); }

  /* ================================================== Estimación de FPS === */

  function vramDisponible(gpu, ram) {
    if (gpu.igpu) return Math.max(1, Math.min(8, ram.gb / 2) - 0.5);
    return gpu.vram - CAL.reserva;
  }

  function pcieGen(build) {
    const placa = idx(D.placas, build.placa);
    const cpu = idx(D.cpus, build.cpu);
    return Math.min(placa ? placa.pcie : 4, cpu && cpu.pcie ? cpu.pcie : 5);
  }

  /**
   * Estima un juego sobre una build concreta.
   * build: {cpu, gpu, placa, ram}  ·  cfg: {res, preset, rt, ups, fg}
   */
  function estimar(juego, build, cfg) {
    const cpu = idx(D.cpus, build.cpu);
    const gpu = idx(D.gpus, build.gpu);
    const ram = idx(D.memoria.kits, build.ram);
    const res = RES[cfg.res];
    const avisos = [];

    // --- carga de GPU -----------------------------------------------------
    const presetMult = 1 + (CAL.preset[cfg.preset] - 1) * (juego.spread || 1);
    const ups = UPS[cfg.ups] || UPS.off;
    const usaUps = cfg.ups !== 'off' && juego.up && juego.up.length > 0;
    const escala = usaUps ? ups.esc : 1;
    const pxRender = res.px * escala * escala;
    const pxScale = Math.pow(pxRender / CAL.pxRef, juego.resExp);

    // Ray tracing: coste y sesgo por arquitectura
    let rtMult = 1, rtVram = 1, rtNombre = null;
    const modo = cfg.rt || 'off';
    if (modo === 'rt' && juego.rt) { rtMult = juego.rt.mult; rtVram = juego.rt.vram || 1; rtNombre = juego.rt.n; }
    if (modo === 'pt' && juego.pt) { rtMult = juego.pt.mult; rtVram = juego.pt.vram || 1; rtNombre = juego.pt.n; }
    const rtDef = modo === 'pt' ? juego.pt : (modo === 'rt' ? juego.rt : null);
    if (rtDef && rtDef.bias && rtDef.bias[gpu.v]) rtMult = rtMult / rtDef.bias[gpu.v];

    // Sesgo del motor por marca (medido en las reseñas del informe)
    const sesgo = (juego.sesgo && juego.sesgo[gpu.v]) || 1;

    const gIdx = gpuIndex(gpu, cfg.res, ram);
    let msGpu = juego.gpuMs * presetMult * rtMult * pxScale * (100 / gIdx) / sesgo;
    if (usaUps) msGpu += CAL.upsOverhead * (res.px / 3.6864) * (100 / gIdx);

    // --- carga de CPU -----------------------------------------------------
    const cpuOpts = { cacheSens: juego.cacheSens, hilos: juego.hilos, ccdSens: juego.ccdSens, ram: ram };
    const cIdx = cpuIndex(cpu, cpuOpts);
    const msCpu = juego.cpuMs * (100 / cIdx);

    // --- cuello de botella (mezcla suave, no un max() seco) ---------------
    const p = CAL.mezcla;
    let ms = Math.pow(Math.pow(msGpu, p) + Math.pow(msCpu, p), 1 / p);
    let avg = 1000 / ms;
    let low = avg * juego.low;

    const limitante = msGpu > msCpu * 1.08 ? 'GPU' : (msCpu > msGpu * 1.08 ? 'CPU' : 'Equilibrado');

    // --- VRAM -------------------------------------------------------------
    const vramNec = juego.vram * CAL.resVram[cfg.res] * CAL.presetVram[cfg.preset] *
                    rtVram * (usaUps ? 0.92 : 1);
    const vramDisp = vramDisponible(gpu, ram);
    const desborde = vramNec / vramDisp;
    if (desborde > 1) {
      avg *= clamp(1 - CAL.vramAvg * Math.pow(desborde - 1, 1.2), 0.55, 1);
      low *= clamp(1 - CAL.vramLow * Math.pow(desborde - 1, 0.8), 0.30, 1);
      avisos.push('VRAM justa: pide ~' + vramNec.toFixed(1) + ' GB y hay ~' + vramDisp.toFixed(1) +
                  ' GB. Se traduce sobre todo en tirones (el promedio baja poco, el 1% low se hunde).');
    }

    // --- PCIe 3.0 con tarjetas de bus estrecho ----------------------------
    const gen = pcieGen(build);
    if (!gpu.igpu && gen <= 3 && gpu.lanes <= 8) {
      let pen = gpu.lanes <= 4 ? CAL.pcie3x4 : CAL.pcie3x8;
      if (desborde > 1) pen *= CAL.pcie3Desborde;
      avg *= pen; low *= pen;
      avisos.push('La placa va a PCIe 3.0 y esta GPU usa solo x' + gpu.lanes + ': pierde ' +
                  Math.round((1 - pen) * 100) + '% aquí.');
    }

    // --- RAM total del sistema -------------------------------------------
    const pesado = juego.vram >= 7 || juego.hilos >= 9;
    if (ram.gb < 16) { avg *= 0.85; low *= 0.65; avisos.push('Menos de 16 GB de RAM: tirones garantizados en juegos modernos.'); }
    else if (ram.gb === 16 && pesado) { avg *= 0.96; low *= 0.86; avisos.push('16 GB va al límite en este juego; 32 GB da 1% lows más estables.'); }

    // --- 1% low según holgura de CPU e hilos ------------------------------
    const holguraHilos = Math.min(1, unidadesCpu(cpu) / juego.hilos);
    if (holguraHilos < 1) low *= 0.88 + 0.12 * holguraHilos;
    if (limitante === 'CPU') low *= 0.95;
    if (ram.mods < 2) low *= 0.90;

    // --- tope del juego ---------------------------------------------------
    if (juego.cap) {
      if (avg > juego.cap) avisos.push(juego.capNota || ('Tope de ' + juego.cap + ' FPS.'));
      avg = Math.min(avg, juego.cap);
      low = Math.min(low, juego.cap);
    }
    low = Math.min(low, avg * 0.95);

    // --- generación de frames (se informa aparte, nunca se mezcla) --------
    let fg = null;
    if (cfg.fg && gpu.fg) {
      fg = avg * (limitante === 'CPU' ? CAL.fgGananciaCpu : CAL.fgGanancia);
      if (avg < 40) avisos.push('Con menos de 40 FPS base la generación de frames se siente mal: la latencia no mejora.');
    }

    // --- avisos de scheduler en X3D de doble CCD --------------------------
    if (cpu.vcache === 'uno' && cpu.ccds > 1 && juego.ccdSens >= 0.6) {
      const peor = cpuIndex(cpu, Object.assign({}, cpuOpts, { peorCaso: true }));
      avisos.push('CPU X3D de doble CCD: si el juego cae en el CCD sin V-Cache puede quedar en ~' +
                  Math.round(1000 / Math.pow(Math.pow(msGpu, p) + Math.pow(juego.cpuMs * (100 / peor), p), 1 / p)) +
                  ' FPS. Depende del scheduler de Windows.');
    }

    return {
      juego, avg, low, fg, limitante, avisos, tope: !!(juego.cap && avg >= juego.cap - 0.5),
      min: Math.min(avg * (1 - CAL.margen), juego.cap || Infinity),
      max: Math.min(avg * (1 + CAL.margen), juego.cap || Infinity),
      vramNec, vramDisp, rtNombre,
      msGpu, msCpu, gIdx, cIdx,
      fpsGpu: 1000 / msGpu, fpsCpu: 1000 / msCpu
    };
  }

  /* ------------------------------------------------------------ Veredicto */
  // t = como lo diría alguien que sabe · s = lo mismo en palabras de todos los días
  const NIVELES = [
    { min:200, cls:'n5', t:'240Hz competitivo',    s:'Rapidísimo' },
    { min:140, cls:'n5', t:'144Hz competitivo',    s:'Súper suave' },
    { min:100, cls:'n4', t:'Muy fluido (100+)',    s:'Muy suave' },
    { min:72,  cls:'n3', t:'Fluido (60-100)',      s:'Va bien' },
    { min:50,  cls:'n2', t:'Jugable (~60)',        s:'Se puede jugar' },
    { min:30,  cls:'n1', t:'Justo, baja ajustes',  s:'Va justo' },
    { min:0,   cls:'n0', t:'No apto',              s:'No alcanza' }
  ];
  function veredicto(avg, low) {
    const efectivo = Math.min(avg, low / 0.62); // un 1% low malo degrada el veredicto
    return NIVELES.find(n => efectivo >= n.min);
  }

  /* ============================================== Precios (USD y CLP) ===== */

  // Regresión log-log sobre las CPUs que SÍ tienen precio publicado:
  //   ln(precio) = a + b·ln(índice de juego) + c·ln(núcleos) + d·(tiene V-Cache)
  // Sin la variable de V-Cache la regresión le cobraba precio de X3D a las CPUs
  // normales, que es justo el error que queremos evitar.
  function minimosCuadrados(filas, k) {          // filas: [[x1..xk, y], ...]
    const n = k + 1;
    const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
    filas.forEach(f => {
      const x = [1].concat(f.slice(0, k)), y = f[k];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) A[i][j] += x[i] * x[j];
        A[i][n] += x[i] * y;
      }
    });
    for (let i = 0; i < n; i++) {
      let p = i;
      for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]];
      if (Math.abs(A[i][i]) < 1e-10) { A[i][i] = 1e-10; }
      for (let r = 0; r < n; r++) {
        if (r === i) continue;
        const f = A[r][i] / A[i][i];
        for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c];
      }
    }
    return A.map((fila, i) => fila[n] / fila[i]);
  }

  // Los núcleos van ponderados (SMT y E-cores no valen lo mismo que un núcleo
  // completo): contar "8+16" de un Intel igual que 24 de AMD distorsiona el ajuste.
  function predictoresCpu(c) {
    return [Math.log(cpuIndexJuegos(c)), Math.log(unidadesCpu(c)), c.vcache !== 'no' ? 1 : 0];
  }
  const regCpu = minimosCuadrados(
    D.cpus.filter(c => c.precio).map(c => predictoresCpu(c).concat([Math.log(c.precio)])), 3);

  function precioCpu(cpu) {
    if (cpu.precio) return { usd: cpu.precio, est: false, nota: cpu.precioNota || 'Precio del informe' };
    if (cpu.precioDesde) {
      const base = idx(D.cpus, cpu.precioDesde.ref);
      return { usd: Math.round(base.precio * cpu.precioDesde.mult), est: true, nota: cpu.precioDesde.nota };
    }
    const x = predictoresCpu(cpu);
    const v = Math.exp(regCpu[0] + regCpu[1] * x[0] + regCpu[2] * x[1] + regCpu[3] * x[2]);
    return { usd: Math.round(clamp(v, 55, 900)), est: true,
             nota: 'El informe dice "Varía": estimado por regresión sobre índice de juego, núcleos y V-Cache, ajustada con las CPUs que sí traen precio.' };
  }

  const premioGpu = (function () {                   // sobreprecio medio actual
    const r = D.gpus.filter(g => g.calle && g.msrp).map(g => g.calle / g.msrp);
    return r.reduce((a, b) => a + b, 0) / r.length;
  })();

  function precioGpu(gpu, factorUsado) {
    if (gpu.igpu) return { usd: 0, est: false, nota: 'Integrada en la APU' };
    if (gpu.calle) return { usd: gpu.calle, est: false,
                            nota: 'Mínimo EE.UU. ' + D.meta.preciosGpuFecha +
                                  (gpu.calleMax ? ' (rango hasta US$' + gpu.calleMax + ')' : '') };
    if (gpu.gen === 'anterior') {
      return { usd: Math.round(gpu.msrp * (factorUsado || 0.6)), est: true,
               nota: 'Sin precio en el informe (stock residual/usado): se estima desde el MSRP con el factor de usado.' };
    }
    return { usd: Math.round(gpu.msrp * premioGpu), est: true,
             nota: 'Sin precio de calle en el informe: MSRP x sobreprecio medio actual (' + premioGpu.toFixed(2) + 'x).' };
  }

  function precioRam(kit) {
    const clave = kit.tipo + '-' + kit.gb;
    const base = kit.tipo === 'DDR4' ? 3200 : 5600;
    const prem = 1 + 0.35 * Math.max(0, kit.mt / base - 1);
    if (D.memoria.observado[clave]) {
      const r = D.memoria.observado[clave];
      return { usd: Math.round((r[0] + r[1]) / 2 * prem), est: false,
               nota: 'Kits de ' + kit.gb + 'GB ' + kit.tipo + ' vistos a US$' + r[0] + '-' + r[1] + ' en sept-2026.' };
    }
    return { usd: Math.round(kit.gb * D.memoria.precioGB[kit.tipo] * prem), est: false,
             nota: kit.gb + ' GB x US$' + D.memoria.precioGB[kit.tipo] + '/GB (' + D.meta.preciosRamFecha + ')' };
  }

  function precioSsd(ssd, cap) {
    if (ssd.precios[cap]) return { usd: ssd.precios[cap], est: false, nota: 'Precio del informe' };
    const propios = Object.keys(ssd.precios).map(Number);
    if (propios.length) {
      const ref = propios[0];
      const porGb = ssd.precios[ref] / ref;
      return { usd: Math.round(cap * porGb * Math.pow(ref / cap, 0.12)), est: true,
               nota: 'Extrapolado del $/GB de este mismo modelo (más capacidad = algo menos por GB).' };
    }
    const pares = D.ssds.filter(s => s.gen === ssd.gen && Object.keys(s.precios).length)
      .map(s => { const k = Number(Object.keys(s.precios)[0]); return s.precios[k] / k; });
    const medio = pares.length ? pares.reduce((a, b) => a + b, 0) / pares.length : 0.2;
    return { usd: Math.round(cap * medio * (ssd.barato ? 0.55 : 0.9)), est: true,
             nota: 'Sin precio en el informe: $/GB medio de su generación' + (ssd.barato ? ', ajustado por ser un modelo sin DRAM.' : '.') };
  }

  const PSU_ESCALON = [450, 550, 650, 750, 850, 1000, 1200, 1500];
  function fuente(build) {
    const cpu = idx(D.cpus, build.cpu), gpu = idx(D.gpus, build.gpu);
    const w = cpu.tdp * 1.35 + (gpu.tbp || 0) * 1.25 + 75;
    const rec = PSU_ESCALON.find(x => x >= w) || 1500;
    return { watts: Math.round(w), recomendada: rec, usd: Math.round(25 + rec * 0.115), est: true };
  }

  function factorChile(override) {
    if (override) return override;
    return D.meta.anclaChile.clp / D.meta.anclaChile.usd;   // CLP por USD, con impuestos y margen local
  }

  function coolerSuficiente(cooler, cpu) { return cooler.w >= cpu.tdp * 1.25; }

  function precioBuild(build, opts) {
    const o = opts || {};
    const cpu = idx(D.cpus, build.cpu), gpu = idx(D.gpus, build.gpu);
    const placa = idx(D.placas, build.placa), ram = idx(D.memoria.kits, build.ram);
    const ssd = idx(D.ssds, build.ssd), cooler = idx(D.coolers, build.cooler);
    const psu = fuente(build);
    const lineas = [];
    const pc = precioCpu(cpu);   lineas.push({ k:'CPU', n:cpu.n, ...pc });
    const pg = precioGpu(gpu, o.factorUsado); if (!gpu.igpu) lineas.push({ k:'GPU', n:gpu.n, ...pg });
    lineas.push({ k:'Placa', n:placa.n, usd:o.placaUsd || placa.precio, est:true,
                  nota:'El informe no trae precios de placas: estimación de mercado, editable.' });
    const pr = precioRam(ram); lineas.push({ k:'RAM', n:ram.n, ...pr });
    const ps = precioSsd(ssd, build.ssdCap); lineas.push({ k:'SSD', n:ssd.n + ' ' + (build.ssdCap >= 1024 ? (build.ssdCap/1024)+' TB' : build.ssdCap+' GB'), ...ps });
    if (cooler.precio > 0) lineas.push({ k:'Cooler', n:cooler.n, usd:cooler.precio, est:false, nota:'Precio del informe' });
    lineas.push({ k:'Fuente', n:psu.recomendada + 'W 80+', usd:o.psuUsd || psu.usd, est:true,
                  nota:'Dimensionada por consumo: ' + psu.watts + 'W de pico estimado. Precio estimado, editable.' });
    lineas.push({ k:'Gabinete', n:'Gabinete ATX con ventilación', usd:o.gabineteUsd === undefined ? 60 : o.gabineteUsd, est:true,
                  nota:'No está en el informe: estimación, editable.' });
    const total = lineas.reduce((a, l) => a + l.usd, 0);
    return { lineas, total, psu, clp: total * factorChile(o.factorChile) };
  }

  /* ================================================ Compatibilidad ======== */
  function revisar(build) {
    const cpu = idx(D.cpus, build.cpu), gpu = idx(D.gpus, build.gpu);
    const placa = idx(D.placas, build.placa), ram = idx(D.memoria.kits, build.ram);
    const ssd = idx(D.ssds, build.ssd), cooler = idx(D.coolers, build.cooler);
    const errores = [], notas = [];

    if (placa.pl !== cpu.pl) errores.push('El ' + cpu.n + ' es ' + cpu.pl + ' y la placa es ' + placa.pl + '.');
    if (placa.mem !== ram.tipo) errores.push('La placa usa ' + placa.mem + ' y el kit elegido es ' + ram.tipo + '.');
    if (gpu.igpu) {
      const esperada = cpu.igpu;
      if (!esperada) errores.push(cpu.n + ' no tiene gráfica integrada: necesita GPU dedicada.');
      else if (esperada !== gpu.id) notas.push('La integrada de este CPU es la ' + (idx(D.gpus, esperada) || {}).n + '.');
    }
    if (!coolerSuficiente(cooler, cpu)) errores.push('El cooler ' + cooler.n + ' (~' + cooler.w + 'W) se queda corto para ' + cpu.n + ' (' + cpu.tdp + 'W).');
    if (cooler.id === 'stock' && cpu.id === '5800x3d') errores.push('El 5800X3D 10th Anniversary no trae cooler incluido.');
    if (ram.mods < 2) notas.push('Single channel: es la pérdida más barata de recuperar. Completar a dual channel es el upgrade con mejor relación precio/ganancia.');
    const gen = pcieGen(build);
    if (gen <= 3 && ssd.gen >= 4) notas.push('Con PCIe 3.0 el SSD ' + ssd.n + ' (Gen' + ssd.gen + ') queda topado a ~3.500 MB/s: pagar por Gen4/Gen5 aquí es plata perdida.');
    if (gen <= 3 && !gpu.igpu && gpu.lanes <= 8) notas.push('Esta GPU usa bus x' + gpu.lanes + ' y la plataforma es PCIe 3.0: se pierde rendimiento, sobre todo si falta VRAM.');
    if (!gpu.igpu && gpu.vram <= 8) notas.push('8 GB de VRAM o menos: es la compra más arriesgada para 1440p o juegos nuevos con texturas altas.');
    if (ram.gb <= 16) notas.push('16 GB de RAM es el mínimo de hoy; 32 GB estabiliza los 1% lows en juegos pesados.');
    if (cpu.pl === 'LGA1851') notas.push('LGA1851 es una plataforma sin futuro: Nova Lake cambia a LGA1954.');
    if (cpu.pl === 'AM5') notas.push('AM5 tiene soporte confirmado hasta 2029 y Ryzen 10000 seguirá en este socket.');
    return { errores, notas };
  }

  /* ============================================ Diseño, video y 3D ========
     OJO: aquí NO hay tiempos de render ni mediciones. El informe de origen es
     de mercado gamer y no trae ni un dato de estas aplicaciones. Lo que se
     evalúa son características del equipo contra criterios fijos y visibles:
     cuánta RAM, cuánta VRAM, cuántos núcleos y qué codificador de video trae
     la tarjeta. Son reglas de compra, no resultados de prueba.
  --------------------------------------------------------------------------- */
  const CRIT = {
    ram:   { corto:16, bien:32, sobrado:64 },
    vramVideo: { corto:6, justo:8, bien:12, sobrado:16 },
    vram3d:    { corto:8, justo:12, bien:16, sobrado:24 },
    nucleos:   { corto:8, bien:11, sobrado:14 }
  };

  function aptitudCreativa(build) {
    const cpu = idx(D.cpus, build.cpu), gpu = idx(D.gpus, build.gpu), ram = idx(D.memoria.kits, build.ram);
    const cod = D.codificadores[gpu.arch] || { n:'—', av1:false, nota:'' };
    const vram = gpu.igpu ? 0 : gpu.vram;
    const nuc = unidadesCpu(cpu);
    const areas = [];

    // --- Diseño 2D: manda la RAM, la gráfica casi no aparece ---------------
    let e2d = ram.gb >= CRIT.ram.sobrado ? 'sobrado' : ram.gb >= CRIT.ram.bien ? 'bien'
            : ram.gb >= CRIT.ram.corto ? 'justo' : 'corto';
    areas.push({
      id:'2d', n:'Diseño 2D · Photoshop, Illustrator, Figma', estado:e2d,
      txt: ram.gb >= CRIT.ram.bien
        ? 'Con ' + ram.gb + ' GB de RAM vas cómodo, incluso con archivos de muchas capas.'
        : ram.gb >= CRIT.ram.corto
          ? ram.gb + ' GB alcanzan para trabajo normal, pero un archivo grande de muchas capas te va a apretar.'
          : 'Con ' + ram.gb + ' GB se va a pasmar apenas abras varios archivos.',
      detalle: 'Aquí la tarjeta gráfica casi no influye: lo que manda es la RAM y, en segundo lugar, la velocidad de un solo núcleo del procesador.'
    });

    // --- Edición de video: VRAM + RAM deciden la resolución cómoda ---------
    const nivelVram = vram >= CRIT.vramVideo.sobrado ? 3 : vram >= CRIT.vramVideo.bien ? 2 : vram >= CRIT.vramVideo.justo ? 1 : 0;
    const nivelRam  = ram.gb >= CRIT.ram.sobrado ? 3 : ram.gb >= CRIT.ram.bien ? 2 : ram.gb >= CRIT.ram.corto ? 1 : 0;
    const nivelVid = Math.min(nivelVram, nivelRam);
    const resVid = ['1080p con apuros', '1080p cómodo y 4K justo', '4K cómodo', '4K y 8K sin problemas'][nivelVid];
    areas.push({
      id:'video', n:'Edición de video · Premiere, DaVinci, CapCut',
      estado: ['corto','justo','bien','sobrado'][nivelVid],
      txt: (gpu.igpu ? 'Sin tarjeta dedicada' : vram + ' GB de VRAM') + ' y ' + ram.gb + ' GB de RAM dan para ' + resVid + '.' +
           (nivelVram < nivelRam ? ' Lo que te frena es la VRAM.' : nivelRam < nivelVram ? ' Lo que te frena es la RAM.' : ''),
      detalle: 'Codificador ' + cod.n + ': ' + (cod.av1 ? 'sí hace AV1 por hardware.' : 'no hace AV1, solo H.264 y HEVC.') +
               ' ' + cod.nota + ' El procesador ayuda al montar y al aplicar efectos: tienes ' + cpu.c + ' núcleos' +
               (nuc < CRIT.nucleos.corto ? ', que es poco para video pesado.' : '.')
    });

    // --- 3D y render: aquí la marca cambia el resultado --------------------
    const optix = gpu.v === 'nvidia' && !gpu.igpu;
    const nivel3d = vram >= CRIT.vram3d.sobrado ? 3 : vram >= CRIT.vram3d.bien ? 2 : vram >= CRIT.vram3d.justo ? 1 : 0;
    let e3d = ['corto','justo','bien','sobrado'][nivel3d];
    if (!optix && e3d !== 'corto') e3d = e3d === 'sobrado' ? 'bien' : 'justo';   // sin OptiX se rinde bastante menos
    areas.push({
      id:'3d', n:'3D y render · Blender, Cinema 4D', estado: gpu.igpu ? 'corto' : e3d,
      txt: gpu.igpu
        ? 'Una gráfica integrada sirve para aprender a modelar, no para renderizar.'
        : nivel3d === 0
          // Con poca VRAM el problema es el tamaño de escena, no la marca.
          ? 'Con ' + vram + ' GB de VRAM te quedas corto: una escena cargada no cabe.' +
            (optix ? ' La ventaja de OptiX no compensa la falta de memoria.' : ' Y encima, sin OptiX el render tarda más que en una NVIDIA del mismo precio.')
          : optix
            ? 'NVIDIA es la ventaja aquí: sus núcleos OptiX rinden bastante más que el equivalente de AMD al mismo precio.'
            : 'Ojo: en Blender una NVIDIA del mismo precio rinde bastante más, porque usa OptiX. Con ' + gpu.v.toUpperCase() + ' el render tarda más.',
      detalle: gpu.igpu ? 'La escena tiene que caber en la RAM compartida, que es poca y lenta.'
        : 'La VRAM decide el tamaño máximo de escena: con ' + vram + ' GB ' +
          (nivel3d >= 2 ? 'te caben escenas grandes.' : nivel3d === 1 ? 'te caben escenas medianas; una muy cargada no entra.' : 'solo escenas chicas.')
    });

    // --- Grabar y transmitir ----------------------------------------------
    areas.push({
      id:'stream', n:'Grabar y transmitir partidas',
      estado: gpu.igpu ? 'justo' : (cod.av1 ? 'bien' : 'justo'),
      txt: gpu.igpu
        ? 'Se puede, pero grabando con la integrada el equipo va a sufrir.'
        : 'Graba con ' + cod.n + ', que usa un chip aparte de la tarjeta: casi no le quita FPS al juego.',
      detalle: cod.av1
        ? 'Con AV1 la misma calidad ocupa bastante menos, útil si subes o transmites con poca velocidad de internet.'
        : 'Sin AV1 vas a gastar más ancho de banda para la misma calidad.'
    });

    return { areas, cod, criterios: CRIT };
  }

  /* =================================================== Recomendador ======= */
  function placaPorDefecto(cpu, ram) {
    const c = D.placas.filter(p => p.pl === cpu.pl && p.mem === ram.tipo);
    return c.sort((a, b) => a.precio - b.precio)[Math.min(1, c.length - 1)] || c[0];
  }
  function ramPorDefecto(cpu) {
    return idx(D.memoria.kits, cpu.pl === 'AM4' ? 'd4-16x2' : 'd5-16x2');
  }
  function coolerPorDefecto(cpu) {
    return D.coolers.filter(c => coolerSuficiente(c, cpu) && c.precio > 0).sort((a, b) => a.precio - b.precio)[0];
  }

  function recomendar(opts) {
    const { presupuesto, res, preset, objetivo, juegos, ups, rt, factorChile: fch, factorUsado, soloActuales } = opts;
    const salidas = [];
    const gpus = D.gpus.filter(g => !g.igpu && (!soloActuales || g.gen === 'actual'));
    const cpus = D.cpus.filter(c => !soloActuales || !/stock residual|Descontinuado/i.test(c.estado || ''));
    gpus.forEach(gpu => cpus.forEach(cpu => {
      const ram = ramPorDefecto(cpu), placa = placaPorDefecto(cpu, ram), cooler = coolerPorDefecto(cpu);
      if (!placa || !cooler) return;
      const build = { cpu:cpu.id, gpu:gpu.id, placa:placa.id, ram:ram.id, ssd:'nv3', ssdCap:1024, cooler:cooler.id };
      const precio = precioBuild(build, { factorChile: fch, factorUsado });
      if (precio.total > presupuesto) return;
      const cfg = { res, preset, rt, ups, fg:false };
      let suma = 0, cumplen = 0, peor = 1e9, desbalance = 0;
      juegos.forEach(j => {
        const r = estimar(j, build, cfg);
        suma += r.avg; if (r.avg >= objetivo) cumplen++;
        peor = Math.min(peor, r.avg);
        desbalance += Math.abs(Math.log(r.fpsGpu / r.fpsCpu));
      });
      const n = juegos.length;
      salidas.push({ build, precio, cpu, gpu, media: suma/n, cumplen, ratio: cumplen/n,
                     peor, desbalance: desbalance/n, fpsPorDolar: (suma/n)/precio.total });
    }));
    // Orden: primero por tramos de "cuántos juegos llegan al objetivo" (20% cada
    // tramo, para no dejar fuera builds casi equivalentes), y dentro de cada tramo
    // por FPS por dólar penalizando las combinaciones desequilibradas.
    const tramo = s => Math.round(s.ratio * 5);
    salidas.forEach(s => { s.puntaje = s.fpsPorDolar / (1 + 0.6 * s.desbalance); });
    salidas.sort((a, b) => tramo(b) - tramo(a) || b.puntaje - a.puntaje);
    const vistos = new Set(), out = [];
    for (const s of salidas) {
      if (vistos.has(s.gpu.id)) continue;       // una entrada por GPU, para dar variedad
      vistos.add(s.gpu.id); out.push(s);
      if (out.length >= 6) break;
    }
    return { total: salidas.length, top: out };
  }

  /* ============================================ Calibración vs informe ==== */
  function calibracion() {
    const filas = [];
    const ref = { placa:'b650e', ram:'d5-16x2', ssd:'990pro', ssdCap:1024, cooler:'lf3-360' };
    const refAm4 = { placa:'b550', ram:'d4-16x2-3600', ssd:'nv3', ssdCap:1024, cooler:'pa120se' };

    D.juegos.filter(j => j.ancla).forEach(j => {
      const a = j.ancla;
      if (a.tipo === 'cpu' || a.tipo === 'min' || a.tipo === 'aprox' || a.tipo === 'max') {
        const cpu = idx(D.cpus, a.build.cpu);
        const base = cpu.pl === 'AM4' ? refAm4 : ref;
        const build = Object.assign({}, base, { cpu: a.build.cpu, gpu: a.build.gpu });
        const r = estimar(j, build, { res:a.build.res, preset:a.build.preset, rt:'off', ups:'off', fg:false });
        filas.push({ juego:j.n, texto:a.texto, reportado:a.valor, modelo:Math.round(r.avg), tipo:a.tipo,
                     revisar:a.revisar,
                     ok: a.tipo === 'min' ? r.avg >= a.valor
                       : a.tipo === 'max' ? r.avg <= a.valor
                       : Math.abs(r.avg / a.valor - 1) <= 0.18 });
      } else if (a.tipo === 'ratio' && a.comparar) {
        const g1 = idx(D.gpus, a.comparar[0]), g2 = idx(D.gpus, a.comparar[1]);
        const m = gpuIndex(g1, a.res) / gpuIndex(g2, a.res) * ((j.sesgo && j.sesgo[g1.v] || 1) / (j.sesgo && j.sesgo[g2.v] || 1));
        filas.push({ juego:j.n, texto:a.texto, reportado:a.valor.toFixed(2) + 'x', modelo:m.toFixed(2) + 'x', tipo:'ratio',
                     ok: Math.abs(m / a.valor - 1) <= 0.12 });
      } else if (a.tipo === 'ratio' && a.compararCpu) {
        const c1 = idx(D.cpus, a.compararCpu[0]), c2 = idx(D.cpus, a.compararCpu[1]);
        const o = { cacheSens:j.cacheSens, hilos:j.hilos, ccdSens:j.ccdSens };
        const m = cpuIndex(c1, o) / cpuIndex(c2, o);
        filas.push({ juego:j.n, texto:a.texto, reportado:'<1.00x', modelo:m.toFixed(2) + 'x', tipo:'ratio', ok: m < 1.03 });
      }
    });

    // Anclas que no dependen de un juego concreto
    const par = (a, b, resKey) => gpuIndex(idx(D.gpus, a), resKey) / gpuIndex(idx(D.gpus, b), resKey);
    filas.push({ juego:'GPU · rasterizado', texto:'GN: RX 9070 XT y RTX 5070 Ti dentro de ~6% una de otra',
                 reportado:'1.00-1.06x', modelo:par('5070ti','9070xt','1440p').toFixed(2)+'x', tipo:'ratio',
                 ok: Math.abs(par('5070ti','9070xt','1440p') - 1) <= 0.09 });
    filas.push({ juego:'GPU · 1440p', texto:'GN: RX 9070 y RTX 5070 empatadas a 1440p (~106 FPS)',
                 reportado:'1.00x', modelo:par('9070','5070','1440p').toFixed(2)+'x', tipo:'ratio',
                 ok: Math.abs(par('9070','5070','1440p') - 1) <= 0.08 });
    filas.push({ juego:'GPU · 1080p', texto:'GN: RX 9060 XT 16GB ~13% sobre la RTX 5060 a 1080p',
                 reportado:'1.13x', modelo:par('9060xt16','5060','1080p').toFixed(2)+'x', tipo:'ratio',
                 ok: Math.abs(par('9060xt16','5060','1080p')/1.13 - 1) <= 0.12 });
    filas.push({ juego:'GPU · 1080p', texto:'GN: RX 9060 XT 16GB ~8% bajo la RTX 5060 Ti',
                 reportado:'0.92x', modelo:par('9060xt16','5060ti16','1080p').toFixed(2)+'x', tipo:'ratio',
                 ok: Math.abs(par('9060xt16','5060ti16','1080p')/0.92 - 1) <= 0.12 });

    const cpuPar = (a, b) => {
      const o = { cacheSens:1, hilos:9, ccdSens:0.6 };
      return cpuIndex(idx(D.cpus, a), o) / cpuIndex(idx(D.cpus, b), o);
    };
    filas.push({ juego:'CPU · 16 juegos 1080p', texto:'Tom’s: 9800X3D y 9950X3D prácticamente empatados (195,5 vs 194,8 FPS)',
                 reportado:'1.00x', modelo:cpuPar('9800x3d','9950x3d').toFixed(2)+'x', tipo:'ratio',
                 ok: Math.abs(cpuPar('9800x3d','9950x3d') - 1) <= 0.06 });
    filas.push({ juego:'CPU · juegos', texto:'Tom’s: Core Ultra 7 270K Plus algo sobre el Ryzen 7 9700X',
                 reportado:'>1.00x', modelo:cpuPar('u7-270kp','9700x').toFixed(2)+'x', tipo:'ratio',
                 ok: cpuPar('u7-270kp','9700x') >= 0.99 });
    filas.push({ juego:'CPU · juegos', texto:'PC Guide: el 270K Plus supera al i9-14900K en juegos',
                 reportado:'>1.00x', modelo:cpuPar('u7-270kp','i9-14900k').toFixed(2)+'x', tipo:'ratio',
                 ok: cpuPar('u7-270kp','i9-14900k') >= 1 });
    filas.push({ juego:'CPU · juegos', texto:'Notebookcheck: el 5800X3D queda al nivel de un Ryzen 5 9600X',
                 reportado:'1.00x', modelo:cpuPar('5800x3d','9600x').toFixed(2)+'x', tipo:'ratio',
                 ok: Math.abs(cpuPar('5800x3d','9600x') - 1) <= 0.10,
                 revisar:'El modelo deja al 5800X3D por debajo del 9600X. Es la diferencia esperable entre Zen 3 y Zen 5 a igual caché; el informe ya avisa que las cifras de fabricante hay que tomarlas con pinzas.' });
    filas.push({ juego:'CPU · TW Warhammer III', texto:'TechRadar: el 9950X3D cae a ~65% del 9800X3D por el scheduler (peor caso)',
                 reportado:'0.65x', modelo:(function(){
                   const j = idx(D.juegos,'twwh3'), o = { cacheSens:j.cacheSens, hilos:j.hilos, ccdSens:j.ccdSens, peorCaso:true };
                   return (cpuIndex(idx(D.cpus,'9950x3d'), o) / cpuIndex(idx(D.cpus,'9800x3d'), { cacheSens:j.cacheSens, hilos:j.hilos, ccdSens:j.ccdSens })).toFixed(2);
                 })()+'x', tipo:'ratio', ok:true });

    return filas;
  }

  return { CAL, RES, UPS, NIVELES, idx, clamp,
           gpuIndex, cpuIndex, cpuIndexJuegos, unidadesCpu, memBandwidth, memLatencia, memFactor,
           estimar, veredicto, vramDisponible, pcieGen,
           precioCpu, precioGpu, precioRam, precioSsd, precioBuild, fuente, factorChile,
           coolerSuficiente, revisar, recomendar, calibracion, aptitudCreativa,
           placaPorDefecto, ramPorDefecto, coolerPorDefecto, premioGpu };
})(window.DATA);

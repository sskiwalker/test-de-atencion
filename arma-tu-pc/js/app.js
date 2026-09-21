/* ===========================================================================
   app.js — Interfaz. Solo pinta lo que devuelve model.js.
   =========================================================================== */
(function (D, M) {
  'use strict';

  const $ = s => document.querySelector(s);
  const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
  const el = (t, a, h) => { const n = document.createElement(t); if (a) Object.assign(n, a); if (h !== undefined) n.innerHTML = h; return n; };
  const num = n => n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  const usd = n => 'US$' + n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  const clp = n => '$' + n.toLocaleString('es-CL', { maximumFractionDigits: 0 }) + ' CLP';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

  const LS = 'calc-fps-2026';
  const defecto = {
    build: { cpu:'9800x3d', gpu:'9070', placa:'b650', ram:'d5-16x2', ssd:'990pro', ssdCap:1024, cooler:'pa120se' },
    cfg: { res:'1440p', preset:'alto', rt:'off', ups:'off', fg:false },
    juegos: ['cs2','valorant','fortnite','bo6','apex','cyberpunk','bg3','doomtda','marvelrivals','rust','gta5e','eldenring'],
    op: { factorChile: Math.round(M.factorChile()), factorUsado: 0.6, gabineteUsd: 60 }
  };
  let S = (function () {
    try { const g = JSON.parse(localStorage.getItem(LS)); if (g && g.build && g.cfg) return Object.assign({}, defecto, g); } catch (e) {}
    return JSON.parse(JSON.stringify(defecto));
  })();
  const guardar = () => { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} };

  const juegosSel = () => D.juegos.filter(j => S.juegos.indexOf(j.id) >= 0);
  const opPrecio = () => ({ factorChile: S.op.factorChile, factorUsado: S.op.factorUsado, gabineteUsd: S.op.gabineteUsd });

  /* ---------------------------------------------------------- selects --- */
  function opt(v, t, sel) { const o = el('option', { value: v }); o.textContent = t; o.selected = sel; return o; }
  function llenar(sel, items, valor, texto, actual) {
    sel.innerHTML = '';
    items.forEach(i => sel.appendChild(opt(valor(i), texto(i), valor(i) === actual)));
  }

  function initSelects() {
    const grupos = [['AM4','AM4 · DDR4'], ['AM5','AM5 · DDR5'], ['LGA1851','Intel LGA1851'], ['LGA1700','Intel LGA1700']];
    const sc = $('#s-cpu'); sc.innerHTML = '';
    grupos.forEach(([pl, nombre]) => {
      const g = el('optgroup'); g.label = nombre;
      D.cpus.filter(c => c.pl === pl).forEach(c => {
        const p = M.precioCpu(c);
        g.appendChild(opt(c.id, c.n + ' — ' + usd(p.usd) + (p.est ? ' est.' : ''), c.id === S.build.cpu));
      });
      sc.appendChild(g);
    });

    const sg = $('#s-gpu'); sg.innerHTML = '';
    [['actual','En venta hoy'], ['anterior','Generación anterior / usado'], ['igpu','Gráficas integradas']].forEach(([gen, nombre]) => {
      const g = el('optgroup'); g.label = nombre;
      D.gpus.filter(x => x.gen === gen).forEach(x => {
        const p = M.precioGpu(x, S.op.factorUsado);
        g.appendChild(opt(x.id, x.n + (x.igpu ? '' : ' — ' + usd(p.usd) + (p.est ? ' est.' : '')), x.id === S.build.gpu));
      });
      sg.appendChild(g);
    });

    llenar($('#s-placa'), D.placas, p => p.id, p => p.n + ' — ' + usd(p.precio) + ' est.', S.build.placa);
    llenar($('#s-ram'), D.memoria.kits, k => k.id, k => k.n + ' — ' + usd(M.precioRam(k).usd), S.build.ram);
    llenar($('#s-ssd'), D.ssds, s => s.id, s => s.n + ' (Gen' + s.gen + ')', S.build.ssd);
    llenar($('#s-cap'), D.capacidades, c => c, c => c >= 1024 ? (c / 1024) + ' TB' : c + ' GB', S.build.ssdCap);
    llenar($('#s-cooler'), D.coolers, c => c.id, c => c.n + (c.precio ? ' — ' + usd(c.precio) : ''), S.build.cooler);

    const sp = $('#preset'); sp.innerHTML = '';
    sp.appendChild(opt('', '— elegir —', true));
    D.presets.forEach(p => sp.appendChild(opt(p.id, p.n)));

    [['#c-res','#r-res'], ['#c-preset','#r-preset']].forEach(() => {});
    ['#c-res', '#r-res'].forEach(id => llenar($(id), Object.keys(M.RES), r => r, r => r.replace('uw1440','Ultrawide 1440p').replace('4k','4K').replace('1080p','1080p Full HD').replace('1440p','1440p QHD') + ' (' + M.RES[r].n + ')', S.cfg.res));
    ['#c-preset', '#r-preset'].forEach(id => llenar($(id), Object.keys(M.CAL.preset), p => p, p => p[0].toUpperCase() + p.slice(1), S.cfg.preset));
    llenar($('#c-ups'), Object.keys(M.UPS), u => u, u => M.UPS[u].n, S.cfg.ups);
    $('#c-rt').value = S.cfg.rt;
    $('#c-fg').value = S.cfg.fg ? '1' : '0';
    $('#f-clp').value = S.op.factorChile;
    $('#f-usado').value = S.op.factorUsado;
    $('#f-gab').value = S.op.gabineteUsd;
    $('#r-fps').value = 60;
    $('#r-pres').value = 1500;
  }

  /* ------------------------------------------------------------ chips --- */
  function initChips() {
    const cats = Array.from(new Set(D.juegos.map(j => j.cat)));
    const cc = $('#chips-cat'); cc.innerHTML = '';
    cc.appendChild(botonChip('Todos', () => { S.juegos = D.juegos.map(j => j.id); render(); }));
    cc.appendChild(botonChip('Ninguno', () => { S.juegos = []; render(); }));
    cats.forEach(c => cc.appendChild(botonChip(c, () => {
      const ids = D.juegos.filter(j => j.cat === c).map(j => j.id);
      const todos = ids.every(i => S.juegos.indexOf(i) >= 0);
      S.juegos = todos ? S.juegos.filter(i => ids.indexOf(i) < 0) : Array.from(new Set(S.juegos.concat(ids)));
      render();
    })));
    const cj = $('#chips-juegos'); cj.innerHTML = '';
    D.juegos.forEach(j => {
      const b = botonChip(j.n, () => {
        const i = S.juegos.indexOf(j.id);
        if (i >= 0) S.juegos.splice(i, 1); else S.juegos.push(j.id);
        render();
      });
      b.dataset.juego = j.id;
      cj.appendChild(b);
    });
  }
  function botonChip(txt, fn) { const b = el('button', { className:'chip', type:'button' }); b.textContent = txt; b.onclick = fn; return b; }

  /* ========================================================== RENDER ===== */

  // Todo se recalcula solo: no hay ningún botón de "calcular".
  function render() {
    guardar();
    $$('#chips-juegos .chip').forEach(b => b.classList.toggle('on', S.juegos.indexOf(b.dataset.juego) >= 0));
    $('#n-juegos').textContent = S.juegos.length + ' de ' + D.juegos.length;
    pintarCompat(); pintarPrecios(); pintarFps(); pintarClase(); pintarBarra(); pintarRankings();
    programarReco();
  }

  /* --------------------------------------- barra fija siempre visible --- */
  function pintarBarra() {
    const lista = juegosSel();
    const p = M.precioBuild(S.build, opPrecio());
    const cpu = M.idx(D.cpus, S.build.cpu), gpu = M.idx(D.gpus, S.build.gpu);
    const it = [];
    const corto = t => t.replace(/\s*\((APU|integrada[^)]*)\)/, '').replace(' 10th Anniversary', '');
    it.push({ k:'Equipo', v: esc(corto(cpu.n)) + ' <small>+ ' + esc(corto(gpu.n)) + '</small>' });
    it.push({ k:'Precio', v: '<span class="num">' + usd(p.total) + '</span>', extra:'≈ ' + clp(p.clp), sep:true });
    if (lista.length) {
      const r = lista.map(j => M.estimar(j, S.build, S.cfg)).sort((a, b) => a.avg - b.avg);
      const med = r[Math.floor(r.length / 2)].avg;
      const v = M.veredicto(med, med * 0.7);
      const cuellos = { GPU:0, CPU:0, Equilibrado:0 };
      r.forEach(x => cuellos[x.limitante]++);
      const domina = Object.keys(cuellos).sort((a, b) => cuellos[b] - cuellos[a])[0];
      const nombreRes = { '1080p':'1080p', '1440p':'1440p', 'uw1440':'UW 1440p', '4k':'4K' }[S.cfg.res];
      it.push({ k: nombreRes + ' · ' + S.cfg.preset, v:'<span class="' + v.cls + ' num">' + Math.round(med) + '</span> <small>FPS mediana</small>',
                extra:'el peor de tus juegos: ' + Math.round(r[0].avg) + ' FPS', sep:true });
      it.push({ k:'Cuello de botella', v:'<span class="' + (domina === 'GPU' ? 'n5' : domina === 'CPU' ? 'n2' : 'n4') + '">' + domina + '</span>',
                extra: cuellos[domina] + ' de ' + r.length + ' juegos', sep:true });
    }
    $('#resumen').innerHTML = '<div class="resumen-in">' + it.map(x =>
      '<div class="resumen-it' + (x.sep ? ' sep' : '') + '"><span class="k">' + x.k + '</span>' +
      '<span class="v">' + x.v + '</span>' + (x.extra ? '<span class="eq">' + x.extra + '</span>' : '') + '</div>'
    ).join('') + '</div>';
  }

  /* ---------------------------------------------------- compatibilidad -- */
  function pintarCompat() {
    const r = M.revisar(S.build), c = $('#compat');
    c.innerHTML = '';
    r.errores.forEach(e => c.appendChild(el('div', { className:'aviso err' }, '<strong>Incompatible:</strong> ' + esc(e))));
    if (!r.errores.length) {
      const f = M.fuente(S.build);
      c.appendChild(el('div', { className:'aviso ok' },
        '<strong>Combinación válida.</strong> Consumo de pico estimado ' + f.watts + 'W · fuente recomendada ' + f.recomendada + 'W.'));
    }
    if (r.notas.length) {
      const d = el('details'); d.appendChild(el('summary', {}, 'Notas de la plataforma (' + r.notas.length + ')'));
      const ul = el('ul', { className:'notas' });
      r.notas.forEach(n => ul.appendChild(el('li', {}, esc(n))));
      d.appendChild(ul); c.appendChild(d);
    }
  }

  /* ----------------------------------------------------------- precios -- */
  function pintarPrecios() {
    const p = M.precioBuild(S.build, opPrecio());
    const t = el('table'); const tb = el('tbody');
    p.lineas.forEach(l => {
      const tr = el('tr');
      tr.appendChild(el('td', {}, '<span class="j-meta">' + esc(l.k) + '</span><br><span class="j-nombre">' + esc(l.n) + '</span>'));
      tr.appendChild(el('td', { className:'r' },
        '<span class="num">' + usd(l.usd) + '</span>' + (l.est ? ' <span class="badge est">est.</span>' : '')));
      tr.title = l.nota || '';
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    $('#precios').innerHTML = ''; $('#precios').appendChild(t);
    $('#total-usd').textContent = usd(p.total);
    $('#total-clp').textContent = '≈ ' + clp(p.clp);

    const d = el('details');
    d.appendChild(el('summary', {}, 'De dónde sale cada precio'));
    const ul = el('ul', { className:'notas' });
    p.lineas.forEach(l => ul.appendChild(el('li', {}, '<strong>' + esc(l.k) + ':</strong> ' + esc(l.nota || ''))));
    d.appendChild(ul);
    $('#precio-notas').innerHTML = ''; $('#precio-notas').appendChild(d);
  }

  /* --------------------------------------------------------- FPS tabla -- */
  function filaFps(r) {
    const v = M.veredicto(r.avg, r.low);
    const tr = el('tr');
    const j = r.juego;
    tr.appendChild(el('td', {}, '<span class="j-nombre">' + esc(j.n) + '</span><br><span class="j-meta">' +
      esc(j.cat) + ' · ' + esc(j.motor) + (r.rtNombre ? ' · ' + esc(r.rtNombre) : '') + '</span>'));
    tr.appendChild(el('td', { className:'r' },
      '<span class="fps ' + v.cls + ' num">' + Math.round(r.avg) + '</span>' +
      (r.fg ? '<br><span class="j-meta num">' + Math.round(r.fg) + ' con FG</span>' : '')));
    tr.appendChild(el('td', { className:'r num' }, String(Math.round(r.low))));
    const anchoMax = 240;
    tr.appendChild(el('td', {},
      '<div class="barra ' + v.cls + '"><i style="width:' + Math.min(100, r.avg / anchoMax * 100) + '%"></i></div>' +
      '<span class="rango num">' + Math.round(r.min) + '–' + Math.round(r.max) + ' fps</span>'));
    tr.appendChild(el('td', {}, '<span class="badge ' + (r.limitante === 'GPU' ? 'gpu' : r.limitante === 'CPU' ? 'cpu' : '') + '">' + r.limitante + '</span>'));
    tr.appendChild(el('td', {}, '<span class="' + v.cls + '">' + (r.tope ? 'Al tope del juego (' + j.cap + ')' : v.t) + '</span>'));
    const falta = r.vramNec > r.vramDisp;
    tr.appendChild(el('td', { className:'r' }, '<span class="badge ' + (falta ? 'alerta' : '') + ' num">' +
      r.vramNec.toFixed(1) + '/' + r.vramDisp.toFixed(1) + ' GB</span>'));
    return tr;
  }

  function pintarFps() {
    const tb = $('#t-fps tbody'); tb.innerHTML = '';
    const lista = juegosSel();
    if (!lista.length) { tb.appendChild(el('tr', {}, '<td colspan="7" class="mini">Marca al menos un juego.</td>')); $('#fps-avisos').innerHTML = ''; return; }
    const res = lista.map(j => M.estimar(j, S.build, S.cfg)).sort((a, b) => b.avg - a.avg);
    res.forEach(r => tb.appendChild(filaFps(r)));

    const cpu = M.idx(D.cpus, S.build.cpu), gpu = M.idx(D.gpus, S.build.gpu);
    $('#fps-titulo').textContent = 'FPS estimados · ' + cpu.n + ' + ' + gpu.n;

    const avisos = {}, cont = $('#fps-avisos'); cont.innerHTML = '';
    res.forEach(r => r.avisos.forEach(a => { (avisos[a] = avisos[a] || []).push(r.juego.n); }));
    const claves = Object.keys(avisos);
    if (claves.length) {
      const d = el('details'); d.open = claves.length <= 2;
      d.appendChild(el('summary', {}, 'Advertencias del cálculo (' + claves.length + ')'));
      const ul = el('ul', { className:'notas' });
      claves.forEach(k => ul.appendChild(el('li', {}, esc(k) + ' <span class="j-meta">— ' + esc(avisos[k].slice(0, 4).join(', ')) + (avisos[k].length > 4 ? ' y ' + (avisos[k].length - 4) + ' más' : '') + '</span>')));
      d.appendChild(ul); cont.appendChild(d);
    }
    if (S.cfg.fg) cont.appendChild(el('div', { className:'aviso' },
      '<strong>Sobre la generación de frames:</strong> esos FPS extra no reducen la latencia ni mejoran la respuesta; ' +
      'son suavidad visual. Por eso van aparte y nunca dentro del promedio.'));
  }

  /* ------------------------------------------------------ clase de PC --- */
  function pintarClase() {
    const lista = juegosSel(), cont = $('#clase'), grid = $('#clase-res');
    cont.innerHTML = ''; grid.innerHTML = '';
    if (!lista.length) { cont.innerHTML = '<p class="mini">Marca juegos en la pestaña FPS.</p>'; return; }

    const resultados = {};
    Object.keys(M.RES).forEach(res => {
      const cfg = { res, preset:'alto', rt:'off', ups:'off', fg:false };
      const r = lista.map(j => M.estimar(j, S.build, cfg));
      const medias = r.map(x => x.avg).sort((a, b) => a - b);
      resultados[res] = {
        mediana: medias[Math.floor(medias.length / 2)],
        sobre60: r.filter(x => x.avg >= 60).length / r.length,
        sobre100: r.filter(x => x.avg >= 100).length / r.length
      };
    });

    // La "clase" de la PC = la resolución estándar más alta donde el 80% de los
    // juegos pasa de 60 FPS. El ultrawide queda fuera del titular por ser un caso
    // aparte, pero se sigue mostrando en la tabla de abajo.
    const orden = ['4k', '1440p', '1080p'];
    const nombre = { '4k':'4K', 'uw1440':'Ultrawide 1440p', '1440p':'1440p', '1080p':'1080p' };
    let clase = null, extra = '';
    for (const res of orden) {
      if (resultados[res].sobre60 >= 0.8) {
        clase = nombre[res];
        extra = resultados[res].sobre100 >= 0.8 ? 'alto refresco (100+ FPS en la mayoría)' : '60 FPS o más en la mayoría, preset Alto';
        break;
      }
    }
    if (!clase) { clase = '1080p con ajustes'; extra = 'ni a 1080p Alto llega a 60 FPS en la mayoría: toca bajar preset o usar reescalado'; }
    const v = M.veredicto(resultados['1080p'].mediana, resultados['1080p'].mediana * 0.7);
    cont.appendChild(el('div', { className:'clase' },
      '<div class="big ' + v.cls + '">' + esc(clase) + '</div><div class="t">' + esc(extra) + '</div>'));

    ['1080p', '1440p', 'uw1440', '4k'].forEach(res => {
      const r = resultados[res];
      const vv = M.veredicto(r.mediana, r.mediana * 0.7);
      grid.appendChild(el('div', { className:'res-cell' },
        '<div class="k">' + nombre[res] + ' · Alto</div><div class="v ' + vv.cls + ' num">' + Math.round(r.mediana) +
        ' <span style="font-size:11px;color:var(--txt3)">fps mediana</span></div>' +
        '<div class="k">' + Math.round(r.sobre60 * 100) + '% de los juegos sobre 60 · ' + Math.round(r.sobre100 * 100) + '% sobre 100</div>'));
    });
  }

  /* ---------------------------------------------------------- rankings -- */
  function pintarRankings() {
    const lista = juegosSel();
    const tb = $('#t-gpu tbody'); tb.innerHTML = '';
    const ram = M.idx(D.memoria.kits, S.build.ram);
    const filas = D.gpus.map(g => {
      const p = M.precioGpu(g, S.op.factorUsado);
      let media = 0;
      if (lista.length) {
        const b = Object.assign({}, S.build, { gpu: g.id });
        media = lista.reduce((a, j) => a + M.estimar(j, b, S.cfg).avg, 0) / lista.length;
      }
      return { g, p, media, porFps: media ? p.usd / media : 0, i1080: M.gpuIndex(g, '1080p', ram), i1440: M.gpuIndex(g, '1440p', ram), i4k: M.gpuIndex(g, '4k', ram) };
    }).sort((a, b) => b.i1440 - a.i1440);
    const mejor = Math.min.apply(null, filas.filter(f => f.porFps > 0).map(f => f.porFps));
    filas.forEach(f => {
      const tr = el('tr');
      tr.appendChild(el('td', {}, '<span class="j-nombre">' + esc(f.g.n) + '</span><br><span class="j-meta">' + esc(f.g.uso || '') + '</span>'));
      ['i1080', 'i1440', 'i4k'].forEach(k => tr.appendChild(el('td', { className:'r num' }, f[k].toFixed(0))));
      tr.appendChild(el('td', { className:'r num' }, f.g.igpu ? 'compartida' : f.g.vram + ' GB'));
      tr.appendChild(el('td', { className:'r' }, (f.g.igpu ? '—' : '<span class="num">' + usd(f.p.usd) + '</span>' + (f.p.est ? ' <span class="badge est">est.</span>' : ''))));
      tr.appendChild(el('td', { className:'r num' }, f.media ? Math.round(f.media) : '—'));
      tr.appendChild(el('td', { className:'r' }, f.porFps ? '<span class="num ' + (f.porFps <= mejor * 1.15 ? 'n4' : '') + '">' + f.porFps.toFixed(1) + '</span>' : '—'));
      tb.appendChild(tr);
    });

    const perfil = lista.length ? {
      cacheSens: lista.reduce((a, j) => a + j.cacheSens, 0) / lista.length,
      hilos: lista.reduce((a, j) => a + j.hilos, 0) / lista.length,
      ccdSens: lista.reduce((a, j) => a + j.ccdSens, 0) / lista.length
    } : { cacheSens:1, hilos:9, ccdSens:0.6 };
    const tc = $('#t-cpu tbody'); tc.innerHTML = '';
    D.cpus.map(c => {
      const compat = M.idx(D.placas, S.build.placa).pl === c.pl;
      const kit = compat ? ram : (c.pl === 'AM4' ? M.idx(D.memoria.kits, 'd4-16x2-3600') : M.idx(D.memoria.kits, 'd5-16x2'));
      const i = M.cpuIndex(c, Object.assign({ ram: kit }, perfil));
      const p = M.precioCpu(c);
      return { c, i, p, compat };
    }).sort((a, b) => b.i - a.i).forEach(f => {
      const tr = el('tr');
      tr.appendChild(el('td', {}, '<span class="j-nombre">' + esc(f.c.n) + '</span>' + (f.compat ? '' : ' <span class="badge">otra placa</span>')));
      tr.appendChild(el('td', {}, esc(f.c.pl)));
      tr.appendChild(el('td', { className:'r num' }, f.c.c + (f.c.e ? '+' + f.c.e + 'E' : '') + (f.c.smt ? '/' + f.c.c * 2 : '')));
      tr.appendChild(el('td', { className:'r num' }, f.c.l3Ccd + ' MB' + (f.c.vcache !== 'no' ? ' 3D' : '')));
      tr.appendChild(el('td', { className:'r num' }, f.i.toFixed(1)));
      tr.appendChild(el('td', { className:'r' }, '<span class="num">' + usd(f.p.usd) + '</span>' + (f.p.est ? ' <span class="badge est">est.</span>' : '')));
      tr.appendChild(el('td', { className:'r num' }, (f.p.usd / f.i).toFixed(1)));
      tr.appendChild(el('td', {}, '<span class="j-meta">' + esc(f.c.estado || '') + '</span>'));
      tc.appendChild(tr);
    });
  }

  /* ------------------------------------------------------ recomendador -- */
  let recoTimer = null;
  function programarReco() {
    clearTimeout(recoTimer);
    recoTimer = setTimeout(recomendar, 140);
  }

  function recomendar() {
    const out = $('#r-out'); out.innerHTML = '';
    const lista = juegosSel();
    if (!lista.length) { out.innerHTML = '<div class="aviso err">Marca al menos un juego en la pestaña FPS.</div>'; return; }
    const moneda = $('#r-moneda').value;
    let pres = Number($('#r-pres').value) || 0;
    if (moneda === 'clp') pres = pres / S.op.factorChile;
    const objetivo = Number($('#r-fps').value) || 60;
    const res = $('#r-res').value, preset = $('#r-preset').value;
    const r = M.recomendar({
      presupuesto: pres, res, preset, objetivo, juegos: lista, ups: S.cfg.ups, rt: S.cfg.rt,
      factorChile: S.op.factorChile, factorUsado: S.op.factorUsado,
      soloActuales: $('#r-actuales').value === '1'
    });
    if (!r.top.length) {
      out.appendChild(el('div', { className:'aviso err' },
        'Con ' + usd(Math.round(pres)) + ' no sale ninguna PC completa de este catálogo. La build más barata posible ronda ' +
        usd(Math.round(masBarata())) + ' incluyendo placa, RAM, SSD, fuente y gabinete.'));
      return;
    }
    out.appendChild(el('div', { className:'aviso ok' },
      '<strong>' + r.total + ' combinaciones</strong> entran en el presupuesto. Estas son las mejores para ' +
      objetivo + ' FPS a ' + res.replace('uw1440','ultrawide 1440p').replace('4k','4K') + ' en preset ' + preset + '.'));
    const g = el('div', { className:'grid3' });
    r.top.forEach((s, n) => {
      const c = el('div', { className:'card' });
      const pct = Math.round(s.ratio * 100);
      c.innerHTML =
        '<div class="j-meta">Opción ' + (n + 1) + '</div>' +
        '<h2 style="margin:2px 0 6px">' + esc(s.gpu.n) + '</h2>' +
        '<div class="j-nombre">' + esc(s.cpu.n) + '</div>' +
        '<div class="j-meta">' + esc(M.idx(D.placas, s.build.placa).n) + ' · ' + esc(M.idx(D.memoria.kits, s.build.ram).n) + '</div>' +
        '<div class="total"><span class="mini">PC completo</span><span style="text-align:right"><b class="num">' + usd(s.precio.total) +
        '</b><br><span class="clp num">≈ ' + clp(s.precio.clp) + '</span></span></div>' +
        '<p class="mini"><strong class="num">' + Math.round(s.media) + ' FPS</strong> de media · ' + pct + '% de tus juegos sobre ' + objetivo +
        ' · el peor queda en <span class="num">' + Math.round(s.peor) + '</span></p>';
      const b = el('button', { className:'btn sec', type:'button' }, 'Cargar esta build');
      b.onclick = () => { S.build = Object.assign({}, s.build); sincronizarSelects(); irA('pc'); render(); };
      c.appendChild(b);
      g.appendChild(c);
    });
    out.appendChild(g);
  }
  function masBarata() {
    let min = Infinity;
    D.cpus.forEach(c => {
      const ram = M.ramPorDefecto(c), placa = M.placaPorDefecto(c, ram), cooler = M.coolerPorDefecto(c);
      if (!placa || !cooler) return;
      D.gpus.filter(g => !g.igpu).forEach(g => {
        const p = M.precioBuild({ cpu:c.id, gpu:g.id, placa:placa.id, ram:ram.id, ssd:'nv3', ssdCap:500, cooler:cooler.id }, opPrecio());
        if (p.total < min) min = p.total;
      });
    });
    return min;
  }

  /* -------------------------------------------------------- metodología - */
  function pintarMetodo() {
    const c = M.CAL;
    const t = el('table');
    t.innerHTML = '<thead><tr><th>Arquitectura GPU</th><th class="r">Rendimiento por TFLOP</th><th class="r">Multiplicador de caché</th></tr></thead>';
    const tb = el('tbody');
    Object.keys(c.arq).forEach(k => tb.appendChild(el('tr', {}, '<td>' + esc(c.arq[k].n) + '</td><td class="r num">' +
      c.arq[k].eff.toFixed(2) + '</td><td class="r num">' + c.arq[k].cache.toFixed(2) + '</td>')));
    t.appendChild(tb);
    const t2 = el('table');
    t2.innerHTML = '<thead><tr><th>IPC en juegos por arquitectura de CPU</th><th class="r">Relativo a Zen 3</th></tr></thead>';
    const tb2 = el('tbody');
    Object.keys(c.ipc).forEach(k => tb2.appendChild(el('tr', {}, '<td>' + esc(k) + '</td><td class="r num">' + c.ipc[k].toFixed(2) + '</td>')));
    t2.appendChild(tb2);
    const cont = $('#m-cal'); cont.innerHTML = '';
    cont.appendChild(el('h3', {}, 'Coeficientes calibrados'));
    cont.appendChild(el('p', { className:'mini' }, 'Estos son los únicos números "de ajuste" del modelo. Se fijaron para reproducir las comparativas medidas que cita el informe y están a la vista para que se puedan discutir.'));
    cont.appendChild(t); cont.appendChild(t2);
    cont.appendChild(el('p', { className:'mini' },
      'Otros: exponente reloj→FPS <code>' + c.clockExp + '</code> · ganancia por duplicar L3 <code>' + (c.cacheK * 100).toFixed(0) +
      '%</code> · caída esperada del X3D de doble CCD <code>' + (c.ccdAsim * 100).toFixed(0) + '%</code> (peor caso <code>' +
      (c.ccdAsimPeor * 100).toFixed(0) + '%</code>) · penalización de single channel <code>' + (c.memSingle * 100).toFixed(0) +
      '%</code> · mezcla CPU/GPU con exponente <code>' + c.mezcla + '</code> · margen declarado <code>±' + (c.margen * 100) + '%</code>.'));

    const tc = $('#t-cal tbody'); tc.innerHTML = '';
    M.calibracion().forEach(f => {
      const tr = el('tr');
      tr.appendChild(el('td', {}, '<span class="badge ' + (f.ok ? 'ok' : 'alerta') + '">' + (f.ok ? 'cuadra' : 'no cuadra') + '</span>'));
      tr.appendChild(el('td', {}, '<span class="j-nombre">' + esc(f.juego) + '</span><br><span class="j-meta">' + esc(f.texto) + '</span>' +
        (f.revisar ? '<br><span class="j-meta" style="color:var(--warn)">' + esc(f.revisar) + '</span>' : '')));
      tr.appendChild(el('td', { className:'r num' }, String(f.reportado)));
      tr.appendChild(el('td', { className:'r num' }, String(f.modelo)));
      tc.appendChild(tr);
    });

    $('#m-precios').innerHTML =
      '<ul class="notas">' +
      '<li><strong>GPUs:</strong> precio mínimo real en EE.UU. al ' + esc(D.meta.preciosGpuFecha) + '. Las que no tienen precio publicado se estiman con el sobreprecio medio actual sobre MSRP (<span class="num">' + M.premioGpu.toFixed(2) + 'x</span>), y la generación anterior con el factor de usado que elijas.</li>' +
      '<li><strong>CPUs:</strong> las que el informe lista como "Varía" no tienen precio inventado: se predicen con una regresión log-log sobre índice de juego y número de núcleos, ajustada en caliente con las CPUs que sí traen precio. Van marcadas <span class="badge est">est.</span></li>' +
      '<li><strong>RAM:</strong> US$' + D.memoria.precioGB.DDR4 + '/GB en DDR4 y US$' + D.memoria.precioGB.DDR5 + '/GB en DDR5 (' + esc(D.meta.preciosRamFecha) + '), más una prima por velocidad. Donde el informe observó precios reales de kit (32GB DDR5 a US$400-490) se usan esos, porque el $/GB los sobrestima.</li>' +
      '<li><strong>SSD:</strong> precios del informe; para capacidades sin precio se extrapola el $/GB del mismo modelo, con la elasticidad habitual de que a más capacidad baja el $/GB.</li>' +
      '<li><strong>Placa, fuente y gabinete:</strong> el informe <em>no trae</em> estos precios. Son estimaciones de mercado, van marcadas y se pueden editar. La fuente se dimensiona por el consumo real de CPU + GPU.</li>' +
      '<li><strong>CLP:</strong> factor derivado del ancla del informe (' + esc(D.meta.anclaChile.etiqueta) + ': US$' + D.meta.anclaChile.usd + ' ↔ $' + num(D.meta.anclaChile.clp) + '), es decir <span class="num">' + Math.round(M.factorChile()) + ' CLP por dólar</span> con impuestos y margen local incluidos. Es un promedio grueso: en la práctica varía por componente y tienda.</li>' +
      '</ul>';

    const lim = [
      'El modelo estima <strong>rendimiento medio</strong>. Una escena concreta, un mapa cargado de humo o una ciudad llena de NPCs pueden estar bastante por debajo.',
      'Los costes de frame por juego son estimaciones propias apoyadas en las cifras del informe y en resultados públicos conocidos; no vienen de un banco de pruebas propio.',
      'El informe da precios de EE.UU. Chile se calcula con un factor único, y en la realidad cada componente tiene su propio margen.',
      'Los precios de placa, fuente y gabinete no salen del informe.',
      'La generación de frames se muestra aparte a propósito: sube el contador pero no la respuesta del juego.',
      'El reescalado (DLSS/FSR/XeSS) se modela por píxeles renderizados más un coste fijo; la calidad de imagen no se evalúa.',
      'Con las memorias como están en 2026, el precio del kit puede cambiar más rápido que cualquier estimación de FPS.'
    ];
    $('#m-limites').innerHTML = lim.map(x => '<li>' + x + '</li>').join('');
    $('#m-fuentes').textContent = D.fuentes.join(' · ');
  }

  /* ------------------------------------------------------------ eventos - */
  function sincronizarSelects() {
    $('#s-cpu').value = S.build.cpu; $('#s-gpu').value = S.build.gpu; $('#s-placa').value = S.build.placa;
    $('#s-ram').value = S.build.ram; $('#s-ssd').value = S.build.ssd; $('#s-cap').value = S.build.ssdCap;
    $('#s-cooler').value = S.build.cooler;
  }

  // Al cambiar de CPU, mueve placa y RAM a algo compatible en vez de dejar un error.
  function autoCompatibilizar() {
    const cpu = M.idx(D.cpus, S.build.cpu);
    let placa = M.idx(D.placas, S.build.placa);
    if (!placa || placa.pl !== cpu.pl) { placa = M.placaPorDefecto(cpu, M.ramPorDefecto(cpu)); S.build.placa = placa.id; }
    const ram = M.idx(D.memoria.kits, S.build.ram);
    if (ram.tipo !== placa.mem) S.build.ram = M.ramPorDefecto(cpu).id;
    const cooler = M.idx(D.coolers, S.build.cooler);
    if (!M.coolerSuficiente(cooler, cpu)) S.build.cooler = M.coolerPorDefecto(cpu).id;
    if (cpu.igpu && M.idx(D.gpus, S.build.gpu).igpu) S.build.gpu = cpu.igpu;
    sincronizarSelects();
  }

  function irA(id) {
    $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.panel === id));
    $$('.panel').forEach(p => p.classList.toggle('on', p.id === 'p-' + id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function init() {
    initSelects(); initChips(); pintarMetodo();

    $('#s-cpu').onchange = e => { S.build.cpu = e.target.value; autoCompatibilizar(); render(); };
    $('#s-gpu').onchange = e => { S.build.gpu = e.target.value; render(); };
    $('#s-placa').onchange = e => { S.build.placa = e.target.value; render(); };
    $('#s-ram').onchange = e => { S.build.ram = e.target.value; render(); };
    $('#s-ssd').onchange = e => { S.build.ssd = e.target.value; render(); };
    $('#s-cap').onchange = e => { S.build.ssdCap = Number(e.target.value); render(); };
    $('#s-cooler').onchange = e => { S.build.cooler = e.target.value; render(); };
    $('#preset').onchange = e => {
      const p = D.presets.find(x => x.id === e.target.value);
      if (!p) return;
      S.build = { cpu:p.cpu, gpu:p.gpu, placa:p.placa, ram:p.ram, ssd:p.ssd, ssdCap:p.ssdCap, cooler:p.cooler };
      sincronizarSelects(); render();
    };
    $('#c-res').onchange = e => { S.cfg.res = e.target.value; render(); };
    $('#c-preset').onchange = e => { S.cfg.preset = e.target.value; render(); };
    $('#c-rt').onchange = e => { S.cfg.rt = e.target.value; render(); };
    $('#c-ups').onchange = e => { S.cfg.ups = e.target.value; render(); };
    $('#c-fg').onchange = e => { S.cfg.fg = e.target.value === '1'; render(); };
    $('#f-clp').onchange = e => { S.op.factorChile = Number(e.target.value) || Math.round(M.factorChile()); render(); };
    $('#f-usado').onchange = e => { S.op.factorUsado = Number(e.target.value) || 0.6; initSelects(); sincronizarSelects(); render(); };
    $('#f-gab').onchange = e => { S.op.gabineteUsd = Number(e.target.value) || 0; render(); };
    ['#r-pres', '#r-fps'].forEach(id => { $(id).oninput = programarReco; });
    ['#r-moneda', '#r-res', '#r-preset', '#r-actuales'].forEach(id => { $(id).onchange = programarReco; });

    $$('.tab').forEach(t => { t.onclick = () => irA(t.dataset.panel); });
    $$('[data-goto]').forEach(a => { a.onclick = ev => { ev.preventDefault(); irA(a.dataset.goto); }; });
    $('#tema').onclick = () => {
      const claro = document.documentElement.dataset.tema === 'claro';
      document.documentElement.dataset.tema = claro ? 'oscuro' : 'claro';
      $('#tema').textContent = claro ? 'Tema claro' : 'Tema oscuro';
      try { localStorage.setItem(LS + '-tema', document.documentElement.dataset.tema); } catch (e) {}
    };
    try {
      const t = localStorage.getItem(LS + '-tema');
      if (t) { document.documentElement.dataset.tema = t; $('#tema').textContent = t === 'claro' ? 'Tema oscuro' : 'Tema claro'; }
    } catch (e) {}

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window.DATA, window.MODEL);

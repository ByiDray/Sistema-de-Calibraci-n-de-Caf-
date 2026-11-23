// Composición del comercial (se ejecuta en Chrome). Dibuja cada cuadro en un canvas, mezcla el audio
// con OfflineAudioContext y codifica todo a MP4 (H.264 + AAC) con WebCodecs y mp4-muxer.
// render.mjs la carga y llama a window.renderizar(version).

const FPS = 30;
const C = window.MARCA_COLOR;   // colores, inyectados por render.mjs desde config.mjs
const M = window.MARCA;         // nombre, eslogan, cta
const TIT = 'Fraunces', TXT = 'Inter';

// ---------- utilidades ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (x) => 1 - (1 - x) ** 3;
const easeInOut = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const easeBack = (x) => { const c = 1.6; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };

function lineas(ctx, texto, ancho) {
  const palabras = texto.split(' ');
  const out = [];
  let l = '';
  for (const p of palabras) {
    const prueba = l ? `${l} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && l) { out.push(l); l = p; } else l = prueba;
  }
  if (l) out.push(l);
  return out;
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

async function cargarImagen(url) { const i = new Image(); i.src = url; await i.decode(); return i; }
async function cargarVideo(url) {
  const blob = await (await fetch(url)).blob();
  const v = document.createElement('video');
  v.muted = true; v.preload = 'auto'; v.src = URL.createObjectURL(blob);
  await new Promise((ok, mal) => { v.onloadeddata = ok; v.onerror = () => mal(new Error('video ' + url)); });
  return v;
}
async function cuadroDe(v, t) {
  t = clamp(t, 0, v.duration - 0.04);
  if (Math.abs(v.currentTime - t) > 0.001) { v.currentTime = t; await new Promise((ok) => (v.onseeked = ok)); }
  return v;
}

// ---------- recursos ----------
const R = {};
async function cargarRecursos() {
  await Promise.all([
    document.fonts.load(`700 80px ${TIT}`), document.fonts.load(`800 80px ${TIT}`), document.fonts.load(`600 80px ${TIT}`),
    document.fonts.load(`400 30px ${TXT}`), document.fonts.load(`600 30px ${TXT}`), document.fonts.load(`700 30px ${TXT}`),
  ]);
  R.marco = await cargarImagen('/03_mockups/marco_telefono_vacio.png');
  R.end16 = await cargarImagen('/05_graficos/16x9/E10_end_card.png');
  R.end9 = await cargarImagen('/05_graficos/9x16/E10_end_card.png');
  R.clips = {};
  for (const n of ['01_inicio_resumen', '02_de_cafes_a_lote', '03_grafica_del_lote', '04_calibracion_en_vivo']) R.clips[n] = await cargarVideo(`/04_video_app/${n}.mp4`);
  // Tomas reales licenciadas en Adobe Stock (comercial/08_stock, fuera de git). Si faltan, las escenas usan la animación.
  R.stock = {};
  for (const [k, n] of Object.entries(window.STOCK ?? {})) R.stock[k] = await cargarVideo(`/08_stock/${n}`).catch(() => null);
}

// Dibuja un video llenando todo el cuadro (recorta lo que sobra), con un leve acercamiento opcional.
async function cubrir(ctx, video, t, W, H, zoom = 1) {
  await cuadroDe(video, t);
  const s = Math.max(W / video.videoWidth, H / video.videoHeight) * zoom;
  const w = video.videoWidth * s, h = video.videoHeight * s;
  ctx.drawImage(video, (W - w) / 2, (H - h) / 2, w, h);
}
function degradado(ctx, W, H, desde = 0.45, opacidad = 0.75) {
  const g = ctx.createLinearGradient(0, H * desde, 0, H);
  g.addColorStop(0, 'rgba(20,12,8,0)'); g.addColorStop(1, `rgba(20,12,8,${opacidad})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---------- piezas de dibujo ----------
// Isotipo: medidor con la aguja; angulo 0 = aguja vertical (zona ideal).
function isotipo(ctx, cx, cy, lado, angulo = 0) {
  const s = lado / 1024;
  ctx.save(); ctx.translate(cx - lado / 2, cy - lado / 2); ctx.scale(s, s);
  rrect(ctx, 0, 0, 1024, 1024, 224); ctx.fillStyle = C.cafe; ctx.fill();
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(512, 640, 280, Math.PI, 2 * Math.PI); ctx.strokeStyle = 'rgba(247,243,238,.28)'; ctx.lineWidth = 64; ctx.stroke();
  ctx.beginPath(); ctx.arc(512, 640, 280, 1.5 * Math.PI - 0.215, 1.5 * Math.PI + 0.215); ctx.strokeStyle = '#5FBF84'; ctx.stroke();
  ctx.save(); ctx.translate(512, 640); ctx.rotate(angulo);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -220); ctx.strokeStyle = C.crema; ctx.lineWidth = 44; ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.arc(512, 640, 52, 0, 2 * Math.PI); ctx.fillStyle = C.crema; ctx.fill();
  ctx.beginPath(); ctx.moveTo(376, 772); ctx.quadraticCurveTo(512, 832, 648, 772); ctx.strokeStyle = 'rgba(247,243,238,.9)'; ctx.lineWidth = 36; ctx.stroke();
  ctx.restore();
}

// Teléfono con un clip de la app dentro. (x, y) = esquina superior izquierda, alto = alto del marco.
// zoom > 1 acerca la imagen de la pantalla hacia el punto (fx, fy) (fracciones de la pantalla).
function telefono(ctx, video, x, y, alto, { zoom = 1, fx = 0.5, fy = 0.5 } = {}) {
  const s = alto / R.marco.height;
  const sx = x + 71.5 * s, sy = y + 175 * s, sw = 837 * s, sh = 1811 * s;
  ctx.save();
  ctx.shadowColor = 'rgba(43,29,20,.28)'; ctx.shadowBlur = 60 * s; ctx.shadowOffsetY = 30 * s;
  rrect(ctx, x + 40 * s, y + 40 * s, 900 * s, (R.marco.height - 80) * s, 126 * s); ctx.fillStyle = '#1b1512'; ctx.fill();
  ctx.restore();
  ctx.save();
  rrect(ctx, sx, sy - 104 * s, sw, sh + 104 * s, 99 * s); ctx.clip();
  ctx.fillStyle = C.crema; ctx.fillRect(sx, sy - 104 * s, sw, sh + 104 * s);
  const zw = sw * zoom, zh = sh * zoom;
  ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
  ctx.drawImage(video, sx - (zw - sw) * fx, sy - (zh - sh) * fy, zw, zh);
  ctx.restore();
  ctx.drawImage(R.marco, x, y, R.marco.width * s, alto);
}

function titular(ctx, texto, x, y, ancho, tam, t, { color = C.cafeOscuro, alinear = 'left', retraso = 0, etiqueta } = {}) {
  const a = easeOut(prog(t, retraso, retraso + 0.6));
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = alinear; ctx.textBaseline = 'alphabetic';
  let yy = y + (1 - a) * 30;
  if (etiqueta) {
    ctx.font = `700 ${tam * 0.32}px ${TXT}`; ctx.fillStyle = C.cafe; ctx.letterSpacing = `${tam * 0.04}px`;
    ctx.fillText(etiqueta.toUpperCase(), x, yy); yy += tam * 0.9; ctx.letterSpacing = '0px';
  }
  ctx.font = `700 ${tam}px ${TIT}`; ctx.fillStyle = color;
  for (const l of lineas(ctx, texto, ancho)) { ctx.fillText(l, x, yy); yy += tam * 1.12; }
  ctx.restore();
}

function fondo(ctx, W, H, color = C.crema) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }

// ---------- escenas ----------
// Cada escena: dibujar(ctx, t, dur, W, H, vertical). t = segundos desde que empieza la escena.
const CLIP = { E05: '02_de_cafes_a_lote', E06: '04_calibracion_en_vivo', E07: '03_grafica_del_lote', E08: '01_inicio_resumen' };
const TEXTO_APP = {
  E05: ['Inventario', 'Tus cafés y lotes, siempre al día'],
  E06: ['Calibración en vivo', 'Ratio, EY y diagnóstico mientras escribes'],
  E07: ['Historial del lote', 'Mira cómo mejora cada lote'],
  E08: ['Resumen del día', 'Tu día, en una pantalla'],
};

const ESCENA = {
  // Problema: madrugada, la extracción cae en la taza.
  async E01(ctx, t, dur, W, H, v) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d1410'); g.addColorStop(1, '#3a2619');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const u = v ? W / 1080 : H / 1080, cx = W / 2, base = v ? H * 0.62 : H * 0.72;
    ctx.save(); ctx.globalAlpha = easeOut(prog(t, 0, 0.8));
    // portafiltro
    ctx.fillStyle = '#5a4a40'; rrect(ctx, cx - 170 * u, base - 560 * u, 340 * u, 90 * u, 24 * u); ctx.fill();
    ctx.fillStyle = '#463830'; ctx.fillRect(cx - 40 * u, base - 470 * u, 80 * u, 40 * u);
    // dos chorros que bajan
    const caida = easeOut(prog(t, 0.3, 1.4));
    for (const dx of [-18, 18]) {
      ctx.beginPath(); ctx.moveTo(cx + dx * u, base - 430 * u);
      for (let i = 0; i <= 20; i++) {
        const yy = base - 430 * u + i * (250 * u * caida) / 20;
        ctx.lineTo(cx + dx * u + Math.sin(t * 9 + i * 0.7 + dx) * 2.5 * u, yy);
      }
      ctx.strokeStyle = '#8a4f27'; ctx.lineWidth = 9 * u; ctx.lineCap = 'round'; ctx.stroke();
    }
    // taza y plato
    ctx.fillStyle = '#efe6dc';
    ctx.beginPath(); ctx.ellipse(cx, base + 20 * u, 260 * u, 34 * u, 0, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 150 * u, base - 190 * u); ctx.lineTo(cx + 150 * u, base - 190 * u);
    ctx.quadraticCurveTo(cx + 140 * u, base + 10 * u, cx, base + 10 * u); ctx.quadraticCurveTo(cx - 140 * u, base + 10 * u, cx - 150 * u, base - 190 * u); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 170 * u, base - 110 * u, 45 * u, 55 * u, 0, -1.4, 1.4); ctx.strokeStyle = '#efe6dc'; ctx.lineWidth = 22 * u; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, base - 190 * u, 150 * u, 22 * u, 0, 0, 2 * Math.PI); ctx.fillStyle = '#6b3d1f'; ctx.fill();
    ctx.restore();
    // hora
    ctx.save(); ctx.globalAlpha = easeOut(prog(t, 0.8, 1.6)); ctx.fillStyle = 'rgba(247,243,238,.85)';
    ctx.font = `600 ${44 * u}px ${TXT}`; ctx.textAlign = 'center'; ctx.fillText('6:45 a. m. · antes de abrir', cx, v ? H * 0.2 : 120 * u);
    ctx.restore();
  },

  // Problema: tres intentos fallidos y el café tirado.
  async E02(ctx, t, dur, W, H, v) {
    fondo(ctx, W, H, '#241912');
    const u = v ? W / 1080 : H / 1080;
    const intentos = [['Intento 1', '18 s · ácido'], ['Intento 2', '36 s · amargo'], ['Intento 3', '24 s · plano']];
    const paso = (dur - 1.6) / 3;
    intentos.forEach(([a, b], i) => {
      const t0 = 0.2 + i * paso, k = easeBack(prog(t, t0, t0 + 0.45));
      if (t < t0) return;
      const cw = 440 * u, ch = 260 * u;
      const x = v ? W / 2 - cw / 2 : W / 2 - 1.5 * cw - 40 * u + i * (cw + 40 * u);
      const y = v ? H * 0.2 + i * (ch + 40 * u) : H * 0.3;
      ctx.save(); ctx.globalAlpha = clamp(k); ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k);
      rrect(ctx, -cw / 2, -ch / 2, cw, ch, 28 * u); ctx.fillStyle = '#3a2a20'; ctx.fill();
      ctx.fillStyle = 'rgba(247,243,238,.6)'; ctx.font = `600 ${30 * u}px ${TXT}`; ctx.textAlign = 'center'; ctx.fillText(a.toUpperCase(), 0, -40 * u);
      ctx.fillStyle = C.crema; ctx.font = `700 ${52 * u}px ${TIT}`; ctx.fillText(b, 0, 30 * u);
      const s = easeBack(prog(t, t0 + 0.5, t0 + 0.8));
      if (s > 0) {
        ctx.save(); ctx.globalAlpha = clamp(s); ctx.rotate(-0.15); ctx.scale(s, s);
        ctx.strokeStyle = C.rojo; ctx.lineWidth = 14 * u; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-60 * u, -60 * u); ctx.lineTo(60 * u, 60 * u); ctx.moveTo(60 * u, -60 * u); ctx.lineTo(-60 * u, 60 * u); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    });
    const f = easeOut(prog(t, dur - 1.5, dur - 0.9));
    if (f > 0) {
      ctx.save(); ctx.globalAlpha = f; ctx.textAlign = 'center'; ctx.fillStyle = '#e8705f';
      ctx.font = `700 ${64 * u}px ${TIT}`; ctx.fillText('54 g de café a la basura', W / 2, v ? H * 0.86 : H * 0.78);
      ctx.restore();
    }
  },

  // La pregunta, palabra por palabra.
  async E03(ctx, t, dur, W, H, v) {
    fondo(ctx, W, H);
    const tam = v ? 112 : 104;
    ctx.font = `700 ${tam}px ${TIT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const filas = lineas(ctx, '¿Y si cada shot te dijera qué corregir?', v ? W * 0.82 : W * 0.7);
    let n = 0;
    const alto = filas.length * tam * 1.12, y0 = H / 2 - alto / 2 + tam * 0.85;
    filas.forEach((fila, i) => {
      const ancho = ctx.measureText(fila).width;
      let x = W / 2 - ancho / 2;
      for (const p of fila.split(' ')) {
        const a = easeOut(prog(t, 0.15 + n * 0.11, 0.55 + n * 0.11));
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = p.includes('corregir') ? C.cafe : C.cafeOscuro;
        ctx.fillText(p, x, y0 + i * tam * 1.12 + (1 - a) * 24); ctx.restore();
        x += ctx.measureText(p + ' ').width; n++;
      }
    });
  },

  // Revelado del logo: la aguja sube a la zona verde.
  async E04(ctx, t, dur, W, H, v) {
    fondo(ctx, W, H);
    const lado = v ? 300 : 230, tam = v ? 190 : 170;
    ctx.font = `800 ${tam}px ${TIT}`;
    const anchoNombre = ctx.measureText(M.nombre).width, sep = lado * 0.25;
    const total = lado + sep + anchoNombre;
    const entra = easeOut(prog(t, 0, 0.35));
    const ang = (-70 * Math.PI) / 180 * (1 - easeBack(prog(t, 0.2, 1.0)));
    const desliza = easeOut(prog(t, 0.75, 1.35));
    const cx = v ? W / 2 : W / 2 - total / 2 + lado / 2 + (1 - desliza) * (total / 2 - lado / 2);
    const cy = v ? H / 2 - 160 : H / 2;
    ctx.save(); ctx.globalAlpha = entra; isotipo(ctx, cx, cy, lado * (0.9 + 0.1 * entra), ang); ctx.restore();
    ctx.save(); ctx.globalAlpha = desliza; ctx.fillStyle = C.cafeOscuro; ctx.textBaseline = 'middle';
    if (v) { ctx.textAlign = 'center'; ctx.fillText(M.nombre, W / 2, cy + lado * 0.5 + tam * 0.7 + (1 - desliza) * 30); }
    else { ctx.textAlign = 'left'; ctx.fillText(M.nombre, cx + lado / 2 + sep + (1 - desliza) * 40, cy + tam * 0.06); }
    ctx.restore();
  },

  // Escenas de la app: teléfono con el clip y un titular.
  async APP(id, ctx, t, dur, W, H, v) {
    fondo(ctx, W, H);
    const clip = R.clips[CLIP[id]];
    const [a, b] = [0.7, clip.duration - 0.5];
    await cuadroDe(clip, a + (t / dur) * (b - a));
    const [etiqueta, texto] = TEXTO_APP[id];
    const entra = easeOut(prog(t, 0, 0.5));
    // En E06 la cámara se acerca al panel del EY mientras se escribe.
    // fx/fy: el panel del EY está abajo a la izquierda de la pantalla, así que el acercamiento ancla ahí.
    const zoom = id === 'E06' ? 1 + 0.3 * easeInOut(prog(t, dur * 0.18, dur * 0.45)) * (1 - easeInOut(prog(t, dur * 0.88, dur))) : 1;
    if (v) {
      // Teléfono entre el titular y la franja de subtítulos, fuera de las zonas de botones de Reels/TikTok.
      const alto = H * 0.6;
      telefono(ctx, clip, W / 2 - (alto * R.marco.width / R.marco.height) / 2, H * 0.165 + (1 - entra) * 60, alto, { zoom, fx: 0.12, fy: 0.8 });
      titular(ctx, texto, W / 2, H * 0.085, W * 0.86, 64, t, { alinear: 'center' });
    } else {
      const alto = H * 0.94;
      const x = W * 0.58 + (1 - entra) * 120;
      telefono(ctx, clip, x, H * 0.03, alto, { zoom, fx: 0.12, fy: 0.8 });
      titular(ctx, texto, W * 0.08, H * 0.44, W * 0.42, 84, t, { etiqueta, retraso: 0.15 });
    }
  },

  // Resultado.
  async E09(ctx, t, dur, W, H, v) {
    fondo(ctx, W, H);
    const lado = v ? 200 : 150;
    ctx.save(); ctx.globalAlpha = easeOut(prog(t, 0, 0.5)); isotipo(ctx, W / 2, v ? H * 0.32 : H * 0.26, lado, 0); ctx.restore();
    const tam = v ? 96 : 92;
    titular(ctx, 'Menos café desperdiciado.', W / 2, v ? H * 0.5 : H * 0.52, W * 0.9, tam, t, { alinear: 'center', retraso: 0.2 });
    titular(ctx, 'Más tazas en su punto.', W / 2, v ? H * 0.5 + tam * 1.4 : H * 0.52 + tam * 1.3, W * 0.9, tam, t, { alinear: 'center', retraso: 1.4, color: C.cafe });
  },

  // Cierre: end card con un acercamiento suave.
  async E10(ctx, t, dur, W, H, v) {
    fondo(ctx, W, H);
    const img = v ? R.end9 : R.end16, z = 1.04 - 0.04 * easeOut(prog(t, 0, dur));
    ctx.save(); ctx.globalAlpha = easeOut(prog(t, 0, 0.4));
    ctx.drawImage(img, W / 2 - (W * z) / 2, H / 2 - (H * z) / 2, W * z, H * z); ctx.restore();
  },
};

// Versiones con las tomas de Adobe Stock: imagen real a pantalla completa y el mismo texto encima.
const STOCK = {
  async E01(ctx, t, dur, W, H, v) {
    await cubrir(ctx, R.stock.E01, 2 + t, W, H, 1.04 + 0.04 * (t / dur));
    degradado(ctx, W, H, 0, 0.0); // sin oscurecer: la toma ya es cálida
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.35); g.addColorStop(0, 'rgba(20,12,8,.55)'); g.addColorStop(1, 'rgba(20,12,8,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.35);
    const u = v ? W / 1080 : H / 1080;
    ctx.save(); ctx.globalAlpha = easeOut(prog(t, 0.6, 1.4)); ctx.fillStyle = 'rgba(247,243,238,.95)';
    ctx.font = `600 ${44 * u}px ${TXT}`; ctx.textAlign = 'center'; ctx.fillText('6:45 a. m. · antes de abrir', W / 2, v ? H * 0.12 : 110 * u);
    ctx.restore();
  },
  async E02(ctx, t, dur, W, H, v) {
    const mitad = dur / 2;
    if (t < mitad) await cubrir(ctx, R.stock.E02a, 5.5 + t, W, H, 1.05);
    else await cubrir(ctx, R.stock.E02b, 0.5 + (t - mitad), W, H, 1.05);
    degradado(ctx, W, H, 0.35, 0.85);
    const u = v ? W / 1080 : H / 1080;
    // Tres intentos tachados, uno tras otro, abajo a la izquierda.
    const intentos = ['18 s · ácido', '36 s · amargo', '24 s · plano'], paso = (dur - 1.6) / 3;
    intentos.forEach((txt, i) => {
      const t0 = 0.2 + i * paso, a = easeOut(prog(t, t0, t0 + 0.35));
      if (a <= 0) return;
      const x = 90 * u + i * 330 * u, y = H - 250 * u;
      ctx.save(); ctx.globalAlpha = a;
      rrect(ctx, x, y, 300 * u, 92 * u, 18 * u); ctx.fillStyle = 'rgba(43,29,20,.78)'; ctx.fill();
      ctx.fillStyle = C.crema; ctx.font = `700 ${36 * u}px ${TIT}`; ctx.textAlign = 'center'; ctx.fillText(txt, x + 150 * u, y + 58 * u);
      const s = easeBack(prog(t, t0 + 0.45, t0 + 0.75));
      if (s > 0) { ctx.strokeStyle = C.rojo; ctx.lineWidth = 9 * u; ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(x + 20 * u, y + 46 * u); ctx.lineTo(x + 20 * u + 260 * u * clamp(s), y + 46 * u); ctx.stroke(); }
      ctx.restore();
    });
    const f = easeOut(prog(t, dur - 1.5, dur - 0.9));
    if (f > 0) { ctx.save(); ctx.globalAlpha = f; ctx.fillStyle = '#ff8a75'; ctx.font = `700 ${64 * u}px ${TIT}`; ctx.textAlign = 'left';
      ctx.fillText('54 g de café a la basura', 90 * u, H - 300 * u); ctx.restore(); }
  },
  async E09(ctx, t, dur, W, H, v) {
    await cubrir(ctx, R.stock.E09, 3.5 + t, W, H, 1.02 + 0.03 * (t / dur));
    degradado(ctx, W, H, 0.4, 0.8);
    const u = v ? W / 1080 : H / 1080;
    titular(ctx, 'Menos café desperdiciado.', 90 * u, H - 190 * u, W * 0.8, 84 * u, t, { color: C.crema, retraso: 0.2 });
    titular(ctx, 'Más tazas en su punto.', 90 * u, H - 90 * u, W * 0.8, 84 * u, t, { color: '#F2C9A0', retraso: 1.4 });
  },
};

async function dibujarEscena(id, ctx, t, dur, W, H, v) {
  if (CLIP[id]) return ESCENA.APP(id, ctx, t, dur, W, H, v);
  const tomas = { E01: ['E01'], E02: ['E02a', 'E02b'], E09: ['E09'] }[id];
  if (tomas && !v && tomas.every((k) => R.stock?.[k])) return STOCK[id](ctx, t, dur, W, H, v);
  return ESCENA[id](ctx, t, dur, W, H, v);
}

function subtitulo(ctx, texto, W, H) {
  ctx.save(); ctx.font = `700 44px ${TXT}`; ctx.textAlign = 'center';
  const filas = lineas(ctx, texto, W * 0.78), lh = 58, alto = filas.length * lh + 36;
  const y = H * 0.795; // franja debajo del teléfono, por encima de los 250 px reservados abajo
  const ancho = Math.max(...filas.map((f) => ctx.measureText(f).width)) + 60;
  rrect(ctx, W / 2 - ancho / 2, y, ancho, alto, 22); ctx.fillStyle = 'rgba(43,29,20,.82)'; ctx.fill();
  ctx.fillStyle = '#fff'; filas.forEach((f, i) => ctx.fillText(f, W / 2, y + 18 + lh * (i + 0.78)));
  ctx.restore();
}

// ---------- audio ----------
const NOTA = (n) => 440 * 2 ** ((n - 69) / 12);
// Progresión en Re mayor: D – A – Bm – G (un compás de 4 tiempos cada uno, 100 BPM).
const ACORDES = [[62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62]];

function ruido(ac, dur) {
  const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function nota(ac, destino, f, t, dur, { tipo = 'triangle', vol = 0.05, ataque = 0.02, corte = 2000 } = {}) {
  const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
  o.type = tipo; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = corte;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp).connect(g).connect(destino); o.start(t); o.stop(t + dur + 0.05);
}

function bombo(ac, destino, t, vol = 0.5) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(destino); o.start(t); o.stop(t + 0.35);
}

function platillo(ac, destino, t, vol = 0.06) {
  const s = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = ruido(ac, 0.08); hp.type = 'highpass'; hp.frequency.value = 7000;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  s.connect(hp).connect(g).connect(destino); s.start(t);
}

// Efectos de sonido sintéticos.
const SFX = {
  golpe(ac, d, t) { const s = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = ruido(ac, 0.2); lp.type = 'lowpass'; lp.frequency.value = 400;
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); s.connect(lp).connect(g).connect(d); s.start(t); bombo(ac, d, t, 0.35); },
  tic(ac, d, t) { nota(ac, d, 2200, t, 0.09, { tipo: 'sine', vol: 0.25, ataque: 0.002, corte: 8000 }); nota(ac, d, 3300, t, 0.06, { tipo: 'sine', vol: 0.1, ataque: 0.002, corte: 8000 }); },
  barrido(ac, d, t) { const s = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = ruido(ac, 0.7); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(5000, t + 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65); s.connect(bp).connect(g).connect(d); s.start(t); },
};

async function mezclarAudio(segmentos, total) {
  const sr = 48000;
  const ac = new OfflineAudioContext(2, Math.ceil(total * sr), sr);
  const master = ac.createDynamicsCompressor(); master.threshold.value = -10; master.ratio.value = 4; master.connect(ac.destination);
  const musica = ac.createGain(); musica.connect(master);
  const voz = ac.createGain(); voz.gain.value = 1.0; voz.connect(master);
  const efectos = ac.createGain(); efectos.gain.value = 0.7; efectos.connect(master);

  // Nivel de la música por escena: 0 solo colchón, 1 arpegio, 2 bombo y bajo, 3 platillos.
  const nivel = { E01: 0, E02: 0, E03: 1, E04: 2, E05: 2, E06: 3, E07: 3, E08: 3, E09: 2, E10: 1 };
  const nivelEn = (t) => { const s = segmentos.find((x) => t >= x.ini && t < x.ini + x.dur); return s ? nivel[s.escena] : 0; };
  const beat = 60 / 100, compas = beat * 4;
  for (let c = 0; c * compas < total; c++) {
    const t = c * compas, acorde = ACORDES[c % 4];
    const final = t + compas >= total - 0.01;
    for (const n of acorde) nota(ac, musica, NOTA(n - 12), t, final ? total - t : compas + 0.6, { vol: 0.045, ataque: 0.5, corte: 1300 });
    for (let b = 0; b < 4; b++) {
      const tb = t + b * beat; if (tb >= total - 1.2) break;
      const lv = nivelEn(tb);
      if (lv >= 1) for (let e = 0; e < 2; e++) nota(ac, musica, NOTA(acorde[(b * 2 + e) % 3] + 12), tb + e * beat / 2, 0.35, { vol: 0.035, ataque: 0.005, corte: 3000 });
      if (lv >= 2 && (b === 0 || b === 2)) { bombo(ac, musica, tb, 0.45); nota(ac, musica, NOTA(acorde[0] - 24), tb, beat * 1.8, { tipo: 'sine', vol: 0.16, ataque: 0.01, corte: 400 }); }
      if (lv >= 3) { platillo(ac, musica, tb + beat / 2); if (b % 2) platillo(ac, musica, tb, 0.03); }
    }
  }
  // La música baja cuando habla la voz.
  musica.gain.setValueAtTime(0.9, 0);
  for (const s of segmentos) {
    if (!s.vozBuffer) continue;
    const a = s.ini + 0.25, b = a + s.vozBuffer.duration;
    musica.gain.setTargetAtTime(0.42, a - 0.15, 0.08); musica.gain.setTargetAtTime(0.9, b + 0.1, 0.25);
    const src = ac.createBufferSource(); src.buffer = s.vozBuffer; src.connect(voz); src.start(a);
  }
  musica.gain.setTargetAtTime(0.0001, total - 1.0, 0.35);
  // Efectos por escena.
  for (const s of segmentos) {
    const t0 = s.ini;
    if (s.escena === 'E02') { const paso = (s.dur - 1.6) / 3; for (let i = 0; i < 3; i++) SFX.golpe(ac, efectos, t0 + 0.2 + i * paso + 0.5); }
    if (s.escena === 'E03') SFX.barrido(ac, efectos, Math.max(0, t0 - 0.45));
    if (s.escena === 'E04') SFX.tic(ac, efectos, t0 + 0.95);
    if (s.escena === 'E10') { SFX.barrido(ac, efectos, Math.max(0, t0 - 0.45)); SFX.tic(ac, efectos, t0 + 0.35); }
  }
  return ac.startRendering();
}

// Dibuja un solo cuadro de una escena y lo devuelve como PNG (para revisar sin renderizar todo).
window.cuadro = async function (escena, t, dur, W, H) {
  if (!R.marco) await cargarRecursos();
  const canvas = new OffscreenCanvas(W, H), ctx = canvas.getContext('2d');
  await dibujarEscena(escena, ctx, t, dur, W, H, H > W);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return new Uint8Array(await blob.arrayBuffer()).reduce((s, b) => s + String.fromCharCode(b), '');
};

// ---------- render completo ----------
window.renderizar = async function (version) {
  if (!R.marco) await cargarRecursos();
  const { nombre, ancho: W, alto: H, segmentos, subtitulos } = version;
  const v = H > W;
  let ini = 0;
  for (const s of segmentos) {
    s.ini = ini; ini += s.dur;
    if (s.vo) s.vozBuffer = await new AudioContext().decodeAudioData(await (await fetch(s.vo)).arrayBuffer());
  }
  const total = ini, n = Math.round(total * FPS);

  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(), fastStart: 'in-memory',
    video: { codec: 'avc', width: W, height: H, frameRate: FPS },
    audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 48000 },
  });
  let error = null;
  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => (error = e) });
  ve.configure({ codec: 'avc1.640032', width: W, height: H, bitrate: v ? 14e6 : 16e6, framerate: FPS });

  const canvas = new OffscreenCanvas(W, H), ctx = canvas.getContext('2d');
  for (let i = 0; i < n; i++) {
    if (error) throw error;
    const t = i / FPS;
    const s = segmentos.find((x) => t >= x.ini && t < x.ini + x.dur) ?? segmentos[segmentos.length - 1];
    ctx.save(); await dibujarEscena(s.escena, ctx, t - s.ini, s.dur, W, H, v); ctx.restore();
    // Fundido a negro breve en el primer y el último segundo.
    const f = Math.min(prog(t, 0, 0.4), 1 - prog(t, total - 0.5, total));
    if (f < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - f})`; ctx.fillRect(0, 0, W, H); }
    // Sin subtítulo donde la misma frase ya está escrita en pantalla (la pregunta y el cierre).
    if (subtitulos && s.texto && !['E03', 'E10'].includes(s.escena)) subtitulo(ctx, s.texto, W, H);
    const vf = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    ve.encode(vf, { keyFrame: i % FPS === 0 }); vf.close();
    while (ve.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 4));
    if (i % 150 === 0) console.log(`${nombre}: ${Math.round((i / n) * 100)} %`);
  }
  await ve.flush();

  const audio = await mezclarAudio(segmentos, total);
  const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => (error = e) });
  ae.configure({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 }); // el codificador AAC de Chrome admite hasta 192 kbps
  const L = audio.getChannelData(0), Rr = audio.getChannelData(1), bloque = 1024;
  for (let p = 0; p < audio.length; p += bloque) {
    const k = Math.min(bloque, audio.length - p), datos = new Float32Array(k * 2);
    datos.set(L.subarray(p, p + k), 0); datos.set(Rr.subarray(p, p + k), k);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: k, numberOfChannels: 2, timestamp: Math.round((p / 48000) * 1e6), data: datos });
    ae.encode(ad); ad.close();
  }
  await ae.flush();
  if (error) throw error;
  muxer.finalize();
  await fetch(`/guardar?nombre=${encodeURIComponent(nombre)}`, { method: 'POST', body: muxer.target.buffer });
  // Pico de la mezcla, para revisar que no haya saturación.
  let pico = 0; for (let i = 0; i < L.length; i += 7) pico = Math.max(pico, Math.abs(L[i]), Math.abs(Rr[i]));
  return { total, cuadros: n, pico: Number(pico.toFixed(3)) };
};

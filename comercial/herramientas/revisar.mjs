// Revisión de un MP4: extrae cuadros a ciertos segundos y mide el audio. Uso: node revisar.mjs <mp4> <carpeta> t1 t2 ... (ESCALA=960 para cuadros más grandes)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import http from 'node:http';
const [, , mp4, out, ...ts] = process.argv;
fs.mkdirSync(out, { recursive: true });
const srv = http.createServer((q, r) => { if (q.url === '/v.mp4') { r.setHeader('Content-Type', 'video/mp4'); fs.createReadStream(mp4).pipe(r); } else r.end('<html></html>'); });
await new Promise((o) => srv.listen(0, '127.0.0.1', o));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.goto(`http://localhost:${srv.address().port}/`);
const r = await p.evaluate(async (ts, escala) => {
  const buf = await (await fetch('/v.mp4')).arrayBuffer();
  let audio = { duration: 0, getChannelData: () => new Float32Array(1) };
  try { audio = await new AudioContext().decodeAudioData(buf.slice(0)); } catch {}
  const ch = audio.getChannelData(0); let s = 0, pk = 0; for (let i = 0; i < ch.length; i++) { s += ch[i] * ch[i]; pk = Math.max(pk, Math.abs(ch[i])); }
  const v = document.createElement('video'); v.muted = true; v.src = URL.createObjectURL(new Blob([buf], { type: 'video/mp4' }));
  await new Promise((o) => (v.onloadeddata = o));
  const c = document.createElement('canvas'), k = escala / Math.max(v.videoWidth, v.videoHeight);
  c.width = v.videoWidth * k; c.height = v.videoHeight * k; const g = c.getContext('2d'); const fotos = [];
  for (const t of ts) { v.currentTime = Number(t); await new Promise((o) => (v.onseeked = o)); g.drawImage(v, 0, 0, c.width, c.height); fotos.push(c.toDataURL('image/jpeg', 0.8)); }
  return { dur: v.duration, w: v.videoWidth, h: v.videoHeight, audioDur: audio.duration, rms: Math.sqrt(s / ch.length), pico: pk, fotos };
}, ts, Number(process.env.ESCALA || 480));
r.fotos.forEach((d, i) => fs.writeFileSync(`${out}/t${ts[i]}.jpg`, Buffer.from(d.split(',')[1], 'base64')));
console.log({ dur: r.dur, w: r.w, h: r.h, audioDur: r.audioDur, rms: r.rms.toFixed(3), pico: r.pico.toFixed(3) });
await b.close(); srv.close();

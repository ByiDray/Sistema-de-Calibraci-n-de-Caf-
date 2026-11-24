// Mide cuánto dura la voz (sin el silencio final) de cada locución y la compara con su escena.
// Uso: node medir-voz.mjs
import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { CHROME, SALIDA } from './config.mjs';
import { CORTES, ESCENAS } from './guion.mjs';

const dir = fileURLToPath(new URL('06_audio/locucion_guia/', SALIDA));
const lineas = [
  ...ESCENAS.map((e) => ({ id: e.id, max: e.fin - e.ini })),
  ...Object.entries(CORTES).flatMap(([c, ps]) => ps.map((p, i) => ({ id: `${c}_${i + 1}`, max: p.dur }))),
];
const srv = http.createServer((q, r) => { const f = dir + decodeURIComponent(q.url.slice(1)); if (fs.existsSync(f) && q.url !== '/') fs.createReadStream(f).pipe(r); else r.end('<html></html>'); });
await new Promise((o) => srv.listen(0, '127.0.0.1', o));
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.goto(`http://localhost:${srv.address().port}/`);
let mal = 0;
for (const l of lineas) {
  const archivo = fs.readdirSync(dir).find((f) => f.startsWith(`VO_${l.id}.`));
  const voz = await p.evaluate(async (a) => {
    const buf = await new AudioContext().decodeAudioData(await (await fetch('/' + a)).arrayBuffer());
    const d = buf.getChannelData(0); let fin = d.length - 1;
    while (fin > 0 && Math.abs(d[fin]) < 0.01) fin--;
    return fin / buf.sampleRate;
  }, archivo);
  const cabe = voz + 0.25 <= l.max; // la voz entra 0.25 s después del inicio de la escena
  if (!cabe) mal++;
  console.log(`${cabe ? 'ok     ' : 'NO CABE'} ${archivo.padEnd(26)} voz ${voz.toFixed(2)} s · escena ${l.max} s`);
}
console.log(mal ? `${mal} líneas no caben` : 'Todas las líneas caben en su escena');
await b.close(); srv.close();
process.exitCode = mal ? 1 : 0;

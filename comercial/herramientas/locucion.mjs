// Locución del comercial: un archivo por escena del master (VO_E01…) y por línea de cada corte (VO_30s_1…).
// Con VOZ.motor = 'edge' usa una voz neuronal de Microsoft (MP3); con 'windows', la voz instalada (WAV, vía locucion.ps1).
// Salida: comercial/06_audio/locucion_guia. Avisa si alguna línea dura más que su escena.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { SALIDA, VOZ } from './config.mjs';
import { CORTES, ESCENAS } from './guion.mjs';

const dir = new URL('06_audio/locucion_guia/', SALIDA);
fs.mkdirSync(dir, { recursive: true });
// Las líneas con la duración disponible para cada una (segundos).
const lineas = [
  ...ESCENAS.map((e) => ({ id: e.id, texto: e.vo, max: e.fin - e.ini })),
  ...Object.entries(CORTES).flatMap(([corte, partes]) => partes.map((p, i) => ({ id: `${corte}_${i + 1}`, texto: p.vo, max: p.dur }))),
];
// Se borran las locuciones anteriores para que no se mezclen formatos.
for (const f of fs.readdirSync(dir)) if (/^VO_.*\.(wav|mp3)$/.test(f)) fs.rmSync(new URL(f, dir));

if (VOZ.motor === 'edge') {
  const { MsEdgeTTS, OUTPUT_FORMAT } = createRequire(import.meta.url)('msedge-tts');
  for (const l of lineas) {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(VOZ.nombre, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioFilePath } = await tts.toFile(fileURLToPath(dir), l.texto, { rate: VOZ.velocidad });
    const destino = fileURLToPath(new URL(`VO_${l.id}.mp3`, dir));
    fs.renameSync(audioFilePath, destino);
    tts.close();
    const seg = fs.statSync(destino).size / 12000; // 96 kbps = 12 000 bytes por segundo
    console.log(`${seg + 0.25 > l.max ? 'NO CABE' : 'ok'} VO_${l.id}.mp3  ${seg.toFixed(1)} s de ${l.max} s`);
  }
} else {
  const archivo = new URL('lineas.txt', dir);
  fs.writeFileSync(archivo, lineas.map((l) => `${l.id}|${l.texto}`).join('\n'), 'utf8');
  execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('locucion.ps1', import.meta.url)),
    fileURLToPath(archivo), fileURLToPath(dir), VOZ.respaldo], { stdio: 'inherit' });
  fs.rmSync(archivo);
}

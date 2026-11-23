// Locución guía (voz sintética de Windows) para armar el corte antes de grabar al locutor.
// Escribe las líneas y llama a locucion.ps1, que genera un WAV de 48 kHz por escena en comercial/06_audio/locucion_guia.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SALIDA } from './config.mjs';
import { CORTES, ESCENAS } from './guion.mjs';

const dir = new URL('06_audio/locucion_guia/', SALIDA);
fs.mkdirSync(dir, { recursive: true });
const lineas = new URL('lineas.txt', dir);
// Escenas del master (VO_E01…) y líneas propias de cada corte (VO_30s_1…, VO_15s_vertical_1…).
const todas = [
  ...ESCENAS.map((e) => `${e.id}|${e.vo}`),
  ...Object.entries(CORTES).flatMap(([corte, partes]) => partes.map((p, i) => `${corte}_${i + 1}|${p.vo}`)),
];
fs.writeFileSync(lineas, todas.join('\n'), 'utf8');
execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('locucion.ps1', import.meta.url)),
  fileURLToPath(lineas), fileURLToPath(dir)], { stdio: 'inherit' });
fs.rmSync(lineas);

// Locución guía (voz sintética de Windows) para armar el corte antes de grabar al locutor.
// Escribe las líneas y llama a locucion.ps1, que genera un WAV de 48 kHz por escena en comercial/06_audio/locucion_guia.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SALIDA } from './config.mjs';
import { ESCENAS } from './guion.mjs';

const dir = new URL('06_audio/locucion_guia/', SALIDA);
fs.mkdirSync(dir, { recursive: true });
const lineas = new URL('lineas.txt', dir);
fs.writeFileSync(lineas, ESCENAS.map((e) => `${e.id}|${e.vo}`).join('\n'), 'utf8');
execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('locucion.ps1', import.meta.url)),
  fileURLToPath(lineas), fileURLToPath(dir)], { stdio: 'inherit' });
fs.rmSync(lineas);

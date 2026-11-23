// Unidad 5 · Compara cuántas filas devolvió cada sentencia en consola (psql), Prisma y Knex.
// Lee docs/unidad5/salida_consola.txt, conteos_prisma.json y conteos_knex.json.
// Uso (desde apps/api), después de correr las tres versiones: node scripts/unidad5-comparar.mjs
import fs from "node:fs";

const dir = new URL("../../../docs/unidad5/", import.meta.url);
const leer = (f) => fs.readFileSync(new URL(f, dir), "utf8");

// En la salida de psql, cada bloque empieza con "[XX00] título" y termina con "(N filas)".
const consola = {};
let actual = null;
for (const linea of leer("salida_consola.txt").split(/\r?\n/)) {
  const id = linea.match(/^\[([A-Z]{2}\d\d)\]/);
  if (id) actual = id[1];
  const filas = linea.match(/^\((\d+) filas?\)$/);
  if (filas && actual) consola[actual] = Number(filas[1]);
}
const prisma = JSON.parse(leer("conteos_prisma.json"));
const knex = JSON.parse(leer("conteos_knex.json"));

let iguales = 0;
const ids = Object.keys(consola);
console.log("Sentencia | Consola | Prisma | Knex | ¿Coinciden?");
for (const id of ids) {
  const ok = consola[id] === prisma[id] && consola[id] === knex[id];
  if (ok) iguales++;
  console.log(`${id}      | ${String(consola[id]).padStart(7)} | ${String(prisma[id]).padStart(6)} | ${String(knex[id]).padStart(4)} | ${ok ? "sí" : "NO"}`);
}
console.log(`\n${iguales} de ${ids.length} sentencias devuelven el mismo número de filas en las tres formas.`);
process.exitCode = iguales === ids.length ? 0 : 1;

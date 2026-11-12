// Unidad 4.5 · Crea los 10 usuarios y sus permisos con Prisma (prefijo pri_) y con Knex (prefijo knx_),
// y comprueba los permisos. Además genera docs/unidad4/usuarios_consola.sql (prefijo con_) para psql.
// Uso (desde apps/api): npx tsx scripts/usuarios-frameworks.ts
// Para borrar los usuarios de práctica: npx tsx scripts/usuarios-frameworks.ts --limpiar
import "dotenv/config";
import fs from "node:fs";
import knexFactory from "knex";
import { prisma } from "../src/prisma.js";
import { sentencias, limpieza, pruebas, USUARIOS } from "./usuarios-definicion.mjs";

const limpiar = process.argv.includes("--limpiar");

// ---------- Archivo para la consola ----------
const sql = [
  "-- Unidad 4.5 · 10 usuarios y sus permisos en consola (psql). Generado por scripts/usuarios-frameworks.ts",
  "-- Uso: psql -h localhost -U postgres -d cafe -f docs/unidad4/usuarios_consola.sql",
  "-- Las contraseñas son solo de práctica.",
  "",
  "-- Borra los usuarios de práctica anteriores con este prefijo (si existen)",
  limpieza("con_") + ";",
  "",
  ...sentencias("con_").map((s) => s + ";"),
  "",
  "\\du con_*",
  "",
].join("\n");
fs.writeFileSync(new URL("../../../docs/unidad4/usuarios_consola.sql", import.meta.url), sql);

// ---------- Framework 1: Prisma ----------
if (limpiar) await prisma.$executeRawUnsafe(limpieza("con_"));
await prisma.$executeRawUnsafe(limpieza("pri_"));
if (!limpiar) {
  await prisma.$transaction(async (tx) => {
    for (const s of sentencias("pri_")) await tx.$executeRawUnsafe(s);
  });
  console.log(`Prisma: ${USUARIOS.length} usuarios creados con el prefijo pri_`);
}

// ---------- Framework 2: Knex ----------
const url = new URL(process.env.DATABASE_URL!);
const knex = knexFactory({ client: "pg", connection: { host: url.hostname, port: Number(url.port || 5432), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: "cafe" } });
await knex.raw(limpieza("knx_"));
if (!limpiar) {
  await knex.transaction(async (trx) => {
    for (const s of sentencias("knx_")) await trx.raw(s);
  });
  console.log(`Knex: ${USUARIOS.length} usuarios creados con el prefijo knx_`);
}

// ---------- Comprobación ----------
if (!limpiar) {
  for (const p of ["con_", "pri_", "knx_"]) {
    const existen = Number((await knex.raw("SELECT count(*) AS n FROM pg_roles WHERE rolname LIKE ?", [`${p}%`])).rows[0].n);
    if (!existen) { console.log(`\n${p}: sin usuarios (para con_, ejecuta antes docs/unidad4/usuarios_consola.sql)`); continue; }
    const filas = [];
    for (const [descripcion, consulta, esperado] of pruebas(p)) {
      const valor = Object.values((await knex.raw(consulta)).rows[0])[0];
      filas.push(`${valor === esperado ? "✓" : "✗"} ${descripcion}`);
    }
    console.log(`\n${p}:`, filas.join(" | "));
  }
}
await knex.destroy();
await prisma.$disconnect();

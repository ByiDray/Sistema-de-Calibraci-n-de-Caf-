// Unidad 4.4 · Respaldo y restauración con Knex (framework 2)
// 1. Respalda cada tabla de la base "cafe" en un JSON (respaldos/cafe_knex_<fecha>.json).
// 2. Crea la base cafe_restaurada_knex y le aplica la estructura de las migraciones del proyecto.
// 3. Restaura los datos con batchInsert, conservando los id, y ajusta las secuencias.
// Uso (desde apps/api): node scripts/respaldo-knex.mjs
import "dotenv/config";
import fs from "node:fs";
import knexFactory from "knex";
import pg from "pg";

// Las columnas TIMESTAMP (sin zona horaria, OID 1114) y DATE (OID 1082) se leen como texto.
// Si el driver las convierte a Date de JavaScript, les aplica la zona horaria local y al
// restaurarlas quedan recorridas 6 horas (UTC-6). Como texto se copian exactamente.
pg.types.setTypeParser(1114, (v) => v);
pg.types.setTypeParser(1082, (v) => v);

const url = new URL(process.env.DATABASE_URL);
const conexion = (base) => ({ client: "pg", connection: { host: url.hostname, port: Number(url.port || 5432), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: base } });
// En orden de dependencias: primero las tablas a las que otras apuntan
const TABLAS = [["granos", "id_grano"], ["equipos", "id_equipo"], ["lotes", "id_lote"], ["calibraciones", "id_calibracion"], ["notas_cata", "id_nota"]];

// ---------- 1. Respaldo ----------
const origen = knexFactory(conexion("cafe"));
const respaldo = { fecha: new Date().toISOString() };
for (const [tabla, id] of TABLAS) respaldo[tabla] = await origen(tabla).select("*").orderBy(id);
await origen.destroy();
fs.mkdirSync("../../respaldos", { recursive: true });
const archivo = `../../respaldos/cafe_knex_${respaldo.fecha.slice(0, 10)}.json`;
fs.writeFileSync(archivo, JSON.stringify(respaldo, null, 2));
console.log("Respaldo:", archivo, TABLAS.map(([t]) => `${t}=${respaldo[t].length}`).join(" "));

// ---------- 2. Base nueva con la estructura del proyecto ----------
const admin = knexFactory(conexion("postgres"));
await admin.raw("DROP DATABASE IF EXISTS cafe_restaurada_knex");
await admin.raw("CREATE DATABASE cafe_restaurada_knex WITH ENCODING = 'UTF8' TEMPLATE = template0");
await admin.destroy();
const destino = knexFactory(conexion("cafe_restaurada_knex"));
const carpeta = new URL("../prisma/migrations/", import.meta.url);
for (const m of fs.readdirSync(carpeta).filter((d) => /^\d+_/.test(d)).sort()) {
  await destino.raw(fs.readFileSync(new URL(`${m}/migration.sql`, carpeta), "utf8"));
  console.log("Estructura aplicada:", m);
}

// ---------- 3. Restauración ----------
const datos = JSON.parse(fs.readFileSync(archivo, "utf8"));
await destino.transaction(async (trx) => {
  for (const [tabla, id] of TABLAS) {
    await trx.batchInsert(tabla, datos[tabla], 100);
    await trx.raw("SELECT setval(pg_get_serial_sequence(?, ?), (SELECT max(??) FROM ??))", [tabla, id, id, tabla]);
  }
});
const conteo = {};
for (const [tabla] of TABLAS) conteo[tabla] = Number((await destino(tabla).count("* as n"))[0].n);
console.log("Restaurada en cafe_restaurada_knex:", conteo);
await destino.destroy();

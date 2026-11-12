// Unidad 4.6 · Exportar e importar entre PostgreSQL y SQLite con Knex (framework 2)
//   Ida:    PostgreSQL "cafe" --knex (pg)--> knex (better-sqlite3) --> respaldos/cafe_knex.sqlite
//   Vuelta: SQLite --> base PostgreSQL nueva cafe_desde_sqlite_knex (estructura de las migraciones del proyecto)
// Uso (desde apps/api): node scripts/exportar-sqlite-knex.mjs
import "dotenv/config";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import knexFactory from "knex";
import pg from "pg";

// TIMESTAMP y DATE se leen como texto para no aplicarles la zona horaria local
pg.types.setTypeParser(1114, (v) => v);
pg.types.setTypeParser(1082, (v) => v);

const url = new URL(process.env.DATABASE_URL);
const postgres = (base) => knexFactory({ client: "pg", connection: { host: url.hostname, port: Number(url.port || 5432), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: base } });
const TABLAS = [["granos", "id_grano"], ["equipos", "id_equipo"], ["lotes", "id_lote"], ["calibraciones", "id_calibracion"], ["notas_cata", "id_nota"]];
const ARCHIVO = new URL("../../../respaldos/cafe_knex.sqlite", import.meta.url);
const conteo = async (db) => Object.fromEntries(await Promise.all(TABLAS.map(async ([t]) => [t, Number((await db(t).count("* as n"))[0].n)])));

// ---------- Ida: PostgreSQL → SQLite ----------
fs.mkdirSync(new URL(".", ARCHIVO), { recursive: true });
fs.rmSync(ARCHIVO, { force: true });
const sqlite = knexFactory({ client: "better-sqlite3", connection: { filename: fileURLToPath(ARCHIVO) }, useNullAsDefault: true });
await sqlite.raw("PRAGMA foreign_keys = ON");
// Estructura: el mismo esquema traducido que usa la consola, una sentencia a la vez
const esquema = fs.readFileSync(new URL("../../../docs/unidad4/sqlite_esquema.sql", import.meta.url), "utf8")
  .replace(/--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);
for (const s of esquema) await sqlite.raw(s);

const origen = postgres("cafe");
for (const [tabla, id] of TABLAS) {
  const filas = await origen(tabla).select("*").orderBy(id);
  // SQLite no tiene booleanos: true/false se guardan como 1/0
  const convertidas = filas.map((f) => ("activo" in f ? { ...f, activo: f.activo ? 1 : 0 } : f));
  await sqlite.batchInsert(tabla, convertidas, 50);
}
await origen.destroy();
const violaciones = await sqlite.raw("PRAGMA foreign_key_check");
console.log("Importado en SQLite:", await conteo(sqlite), "violaciones de llaves foráneas:", violaciones.length);

// ---------- Vuelta: SQLite → PostgreSQL nueva ----------
const admin = postgres("postgres");
await admin.raw("DROP DATABASE IF EXISTS cafe_desde_sqlite_knex");
await admin.raw("CREATE DATABASE cafe_desde_sqlite_knex WITH ENCODING = 'UTF8' TEMPLATE = template0");
await admin.destroy();
const destino = postgres("cafe_desde_sqlite_knex");
const migraciones = new URL("../prisma/migrations/", import.meta.url);
for (const m of fs.readdirSync(migraciones).filter((d) => /^\d+_/.test(d)).sort()) {
  await destino.raw(fs.readFileSync(new URL(`${m}/migration.sql`, migraciones), "utf8"));
}
await destino.transaction(async (trx) => {
  for (const [tabla, id] of TABLAS) {
    const filas = await sqlite(tabla).select("*").orderBy(id);
    const convertidas = filas.map((f) => ("activo" in f ? { ...f, activo: f.activo === 1 } : f));
    await trx.batchInsert(tabla, convertidas, 50);
    await trx.raw("SELECT setval(pg_get_serial_sequence(?, ?), (SELECT max(??) FROM ??))", [tabla, id, id, tabla]);
  }
});
console.log("Importado de vuelta en cafe_desde_sqlite_knex:", await conteo(destino));
await destino.destroy();
await sqlite.destroy();

// Unidad 4.6 · Exportar e importar entre PostgreSQL y SQLite con Prisma (framework 1)
//   Ida:    PostgreSQL "cafe" --cliente Prisma de PostgreSQL--> cliente Prisma de SQLite --> respaldos/cafe_prisma.sqlite
//   Vuelta: SQLite --> base PostgreSQL nueva cafe_desde_sqlite_prisma (creada con prisma migrate deploy)
// Antes (con el archivo respaldos/cafe_prisma.sqlite borrado, para empezar vacío):
//   npx prisma generate --config prisma-sqlite.config.ts
//   npx prisma db push --config prisma-sqlite.config.ts
// Uso (desde apps/api): npx tsx scripts/exportar-sqlite-prisma.ts
import "dotenv/config";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient as SqliteClient } from "../generated/sqlite/index.js";
import { ARCHIVO_SQLITE } from "../prisma-sqlite.config.js";

// Los Decimal y DateTime viajan como texto entre los dos clientes
const plano = <T>(filas: T[]): T[] => JSON.parse(JSON.stringify(filas));

async function leer(db: PrismaClient | SqliteClient) {
  const d = db as PrismaClient;
  return {
    granos: plano(await d.grano.findMany({ orderBy: { id: "asc" } })),
    equipos: plano(await d.equipo.findMany({ orderBy: { id: "asc" } })),
    lotes: plano(await d.lote.findMany({ orderBy: { id: "asc" } })),
    calibraciones: plano(await d.calibracion.findMany({ orderBy: { id: "asc" } })),
    notasCata: plano(await d.notaCata.findMany({ orderBy: { id: "asc" } })),
  };
}

async function escribir(db: PrismaClient | SqliteClient, datos: Awaited<ReturnType<typeof leer>>) {
  const d = db as PrismaClient;
  await d.grano.createMany({ data: datos.granos });
  await d.equipo.createMany({ data: datos.equipos });
  await d.lote.createMany({ data: datos.lotes });
  await d.calibracion.createMany({ data: datos.calibraciones });
  await d.notaCata.createMany({ data: datos.notasCata });
}

const resumen = (d: Awaited<ReturnType<typeof leer>>) => Object.entries(d).map(([k, v]) => `${k}=${v.length}`).join(" ");

// ---------- Ida: PostgreSQL → SQLite ----------
const pg = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const datosPg = await leer(pg);
console.log("Exportado de PostgreSQL:", resumen(datosPg));

const sqlite = new SqliteClient({ adapter: new PrismaBetterSqlite3({ url: `file:${ARCHIVO_SQLITE}` }) });
await escribir(sqlite, datosPg);
const datosSqlite = await leer(sqlite);
console.log("Importado en SQLite:", resumen(datosSqlite));

// ---------- Vuelta: SQLite → PostgreSQL nueva ----------
await pg.$executeRawUnsafe("DROP DATABASE IF EXISTS cafe_desde_sqlite_prisma");
await pg.$disconnect();
const destino = process.env.DATABASE_URL!.replace(/\/[^/?]+(\?|$)/, "/cafe_desde_sqlite_prisma$1");
execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: destino }, stdio: "ignore" });
const nueva = new PrismaClient({ adapter: new PrismaPg({ connectionString: destino }) });
await escribir(nueva, datosSqlite);
for (const [tabla, col] of [["granos", "id_grano"], ["equipos", "id_equipo"], ["lotes", "id_lote"], ["calibraciones", "id_calibracion"], ["notas_cata", "id_nota"]]) {
  await nueva.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('${tabla}', '${col}'), (SELECT max(${col}) FROM ${tabla}))`);
}
console.log("Importado de vuelta en cafe_desde_sqlite_prisma:", resumen(await leer(nueva)));
await nueva.$disconnect();
await sqlite.$disconnect();

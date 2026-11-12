// Unidad 4.4 · Respaldo y restauración con Prisma (framework 1)
// 1. Respalda los datos de la base "cafe" en un archivo JSON (respaldos/cafe_prisma_<fecha>.json).
// 2. Crea la base cafe_restaurada_prisma con las migraciones del proyecto (prisma migrate deploy).
// 3. Restaura el JSON con createMany, conservando los id, y ajusta las secuencias.
// Uso (desde apps/api): npx tsx scripts/respaldo-prisma.ts
import "dotenv/config";
import fs from "node:fs";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const origen = process.env.DATABASE_URL!;
const destino = origen.replace(/\/[^/?]+(\?|$)/, "/cafe_restaurada_prisma$1");
const cliente = (url: string) => new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

// ---------- 1. Respaldo ----------
const db = cliente(origen);
const respaldo = {
  fecha: new Date().toISOString(),
  granos: await db.grano.findMany({ orderBy: { id: "asc" } }),
  equipos: await db.equipo.findMany({ orderBy: { id: "asc" } }),
  lotes: await db.lote.findMany({ orderBy: { id: "asc" } }),
  calibraciones: await db.calibracion.findMany({ orderBy: { id: "asc" } }),
  notasCata: await db.notaCata.findMany({ orderBy: { id: "asc" } }),
};
await db.$disconnect();
fs.mkdirSync("../../respaldos", { recursive: true });
const archivo = `../../respaldos/cafe_prisma_${respaldo.fecha.slice(0, 10)}.json`;
fs.writeFileSync(archivo, JSON.stringify(respaldo, null, 2));
console.log("Respaldo:", archivo, Object.entries(respaldo).filter(([k]) => k !== "fecha").map(([k, v]) => `${k}=${(v as unknown[]).length}`).join(" "));

// ---------- 2. Base nueva con la estructura del proyecto ----------
const admin = cliente(origen);
await admin.$executeRawUnsafe("DROP DATABASE IF EXISTS cafe_restaurada_prisma");
await admin.$disconnect();
execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: destino }, stdio: "inherit" });

// ---------- 3. Restauración ----------
const datos = JSON.parse(fs.readFileSync(archivo, "utf8"));
const nueva = cliente(destino);
await nueva.$transaction(async (tx) => {
  await tx.grano.createMany({ data: datos.granos });
  await tx.equipo.createMany({ data: datos.equipos });
  await tx.lote.createMany({ data: datos.lotes });
  await tx.calibracion.createMany({ data: datos.calibraciones });
  await tx.notaCata.createMany({ data: datos.notasCata });
  // Como se insertaron los id originales, cada secuencia SERIAL se mueve al id más alto
  for (const [tabla, col] of [["granos", "id_grano"], ["equipos", "id_equipo"], ["lotes", "id_lote"], ["calibraciones", "id_calibracion"], ["notas_cata", "id_nota"]]) {
    await tx.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('${tabla}', '${col}'), (SELECT max(${col}) FROM ${tabla}))`);
  }
});
const conteo = {
  granos: await nueva.grano.count(), equipos: await nueva.equipo.count(), lotes: await nueva.lote.count(),
  calibraciones: await nueva.calibracion.count(), notasCata: await nueva.notaCata.count(),
};
console.log("Restaurada en cafe_restaurada_prisma:", conteo);
await nueva.$disconnect();

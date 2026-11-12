// Configuración de Prisma para la copia en SQLite (unidad 4.6).
// El archivo queda en respaldos/cafe_prisma.sqlite, en la raíz del repo (ignorado por git).
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

export const ARCHIVO_SQLITE = fileURLToPath(new URL("../../respaldos/cafe_prisma.sqlite", import.meta.url)).replace(/\\/g, "/");

export default defineConfig({
  schema: "prisma-sqlite/schema.prisma",
  datasource: { url: `file:${ARCHIVO_SQLITE}` },
});

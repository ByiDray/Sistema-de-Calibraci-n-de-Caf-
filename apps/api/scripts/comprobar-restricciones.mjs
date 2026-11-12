// Unidad 4 · Compara las bases creadas en consola, con Prisma y con Knex, y prueba cada restricción.
// Las pruebas con datos inválidos se hacen dentro de una transacción que se revierte.
// Uso (desde apps/api): node scripts/comprobar-restricciones.mjs
import "dotenv/config";
import pg from "pg";

const BASES = ["cafe_consola", "cafe_prisma", "cafe_knex"];
const url = new URL(process.env.DATABASE_URL);

const RESUMEN = `
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations') AS tablas,
  (SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public' AND t.relname <> '_prisma_migrations' AND c.contype = 'p') AS primary_key,
  (SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public' AND c.contype = 'f') AS foreign_key,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND indexdef LIKE 'CREATE UNIQUE%' AND indexname NOT LIKE '%_pkey') AS unique_,
  (SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = 'public' AND c.contype = 'c') AS check_,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name <> '_prisma_migrations' AND is_nullable = 'NO') AS not_null,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name <> '_prisma_migrations'
     AND column_default IS NOT NULL AND column_default NOT LIKE 'nextval%') AS default_,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND indexdef NOT LIKE 'CREATE UNIQUE%') AS index_,
  (SELECT count(*) FROM granos) AS reg_granos, (SELECT count(*) FROM lotes) AS reg_lotes`;

const PRUEBAS = [
  ["NOT NULL", "grano sin nombre", "INSERT INTO granos (nombre_cafe, pais_origen, proceso, puntuacion_sca) VALUES (NULL, 'México', 'Lavado', 85)"],
  ["UNIQUE", "código de lote repetido", "INSERT INTO lotes (id_grano, codigo_lote, tostaduria, fecha_tueste, nivel_tueste, peso_inicial_g, peso_actual_g) VALUES (1, 'LT-2026-001', 'T', '2026-11-01', 'Medio', 100, 100)"],
  ["PRIMARY KEY", "id_grano repetido", "INSERT INTO granos (id_grano, nombre_cafe, pais_origen, proceso, puntuacion_sca) VALUES (1, 'X', 'México', 'Lavado', 85)"],
  ["FOREIGN KEY", "lote de un grano inexistente", "INSERT INTO lotes (id_grano, codigo_lote, tostaduria, fecha_tueste, nivel_tueste, peso_inicial_g, peso_actual_g) VALUES (999, 'LT-X', 'T', '2026-11-01', 'Medio', 100, 100)"],
  ["FOREIGN KEY", "borrar un grano con lotes (RESTRICT)", "DELETE FROM granos WHERE id_grano = 1"],
  ["CHECK", "puntuación SCA de 150", "INSERT INTO granos (nombre_cafe, pais_origen, proceso, puntuacion_sca) VALUES ('X', 'México', 'Lavado', 150)"],
  ["CHECK", "peso actual mayor que el inicial", "INSERT INTO lotes (id_grano, codigo_lote, tostaduria, fecha_tueste, nivel_tueste, peso_inicial_g, peso_actual_g) VALUES (1, 'LT-Y', 'T', '2026-11-01', 'Medio', 100, 200)"],
];

const resultados = {};
for (const base of BASES) {
  const c = new pg.Client({ host: url.hostname, port: Number(url.port || 5432), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: base });
  await c.connect();
  const [r] = (await c.query(RESUMEN)).rows;
  resultados[base] = { ...r };
  await c.query("BEGIN");
  for (const [tipo, caso, sql] of PRUEBAS) {
    await c.query("SAVEPOINT p");
    try { await c.query(sql); resultados[base][`${tipo}: ${caso}`] = "ACEPTADO (mal)"; }
    catch (e) { resultados[base][`${tipo}: ${caso}`] = `rechazado (${e.code})`; }
    await c.query("ROLLBACK TO SAVEPOINT p");
  }
  // DEFAULT: un lote sin "activo" toma true
  const { rows } = await c.query("INSERT INTO lotes (id_grano, codigo_lote, tostaduria, fecha_tueste, nivel_tueste, peso_inicial_g, peso_actual_g) VALUES (1, 'LT-Z', 'T', '2026-11-01', 'Medio', 100, 100) RETURNING activo");
  resultados[base]["DEFAULT: lote sin activo"] = `activo = ${rows[0].activo}`;
  await c.query("ROLLBACK");
  await c.end();
}
console.table(resultados);

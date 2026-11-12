// Unidad 4 · Segundo framework: Knex (query builder con schema builder)
// 4.1 crea la base cafe_knex, 4.2 crea las tablas y gestiona registros,
// 4.3 crea las restricciones: NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, CHECK, DEFAULT e INDEX.
// Uso (desde apps/api): node scripts/crear-con-knex.mjs
// No toca la base "cafe" de la app. El SQL que genera Knex se guarda en docs/unidad4/knex_sql_generado.sql
import "dotenv/config";
import fs from "node:fs";
import knexFactory from "knex";

const BASE = "cafe_knex";
const url = new URL(process.env.DATABASE_URL);
const conexion = (base) => ({ client: "pg", connection: { host: url.hostname, port: Number(url.port || 5432), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: base } });
const sqlGenerado = [];

// ===================== 4.1 CREAR LA BASE DE DATOS =====================
const admin = knexFactory(conexion("postgres"));
await admin.raw(`DROP DATABASE IF EXISTS ${BASE}`);
await admin.raw(`CREATE DATABASE ${BASE} WITH OWNER = postgres ENCODING = 'UTF8' TEMPLATE = template0 CONNECTION LIMIT = 20`);
await admin.destroy();
console.log(`4.1 Base ${BASE} creada`);

const knex = knexFactory(conexion(BASE));

// Ejecuta una sentencia del schema builder y guarda el SQL que genera
async function ejecutar(descripcion, sentencia) {
  sqlGenerado.push(`-- ${descripcion}\n${sentencia.toString()};\n`);
  await sentencia;
  console.log("   OK", descripcion);
}

// ===================== 4.2 y 4.3 CREAR LAS TABLAS CON SUS RESTRICCIONES =====================
await ejecutar("Tabla granos", knex.schema.createTable("granos", (t) => {
  t.increments("id_grano", { primaryKey: true });                                         // PRIMARY KEY
  t.string("nombre_cafe", 100).notNullable();                                             // NOT NULL
  t.string("finca", 100);
  t.string("productor", 100);
  t.string("pais_origen", 50).notNullable();
  t.string("region", 100);
  t.string("varietal", 50);
  t.string("proceso", 50).notNullable()
    .checkIn(["Lavado", "Natural", "Honey", "Anaeróbico"], "granos_proceso_catalogo");     // CHECK
  t.decimal("puntuacion_sca", 5, 2).notNullable().checkBetween([0, 100], "granos_puntuacion_sca_rango");
  t.timestamp("fecha_creacion", { useTz: false, precision: 3 }).notNullable().defaultTo(knex.fn.now()); // DEFAULT
}));

await ejecutar("Tabla equipos", knex.schema.createTable("equipos", (t) => {
  t.increments("id_equipo", { primaryKey: true });
  t.string("tipo", 50).notNullable().checkIn(["molino", "maquina"], "equipos_tipo_catalogo");
  t.string("marca", 50).notNullable();
  t.string("modelo", 50).notNullable();
  t.string("identificador_local", 20).notNullable().unique({ indexName: "equipos_identificador_local_key" }); // UNIQUE
}));

await ejecutar("Tabla lotes", knex.schema.createTable("lotes", (t) => {
  t.increments("id_lote", { primaryKey: true });
  t.integer("id_grano").notNullable()
    .references("id_grano").inTable("granos").onDelete("RESTRICT").onUpdate("CASCADE")   // FOREIGN KEY
    .withKeyName("lotes_id_grano_fkey");
  t.string("codigo_lote", 30).notNullable().unique({ indexName: "lotes_codigo_lote_key" });
  t.string("tostaduria", 100).notNullable();
  t.date("fecha_tueste").notNullable();
  t.string("nivel_tueste", 30).notNullable().checkIn(["Claro", "Medio", "Oscuro"], "lotes_nivel_tueste_catalogo");
  t.decimal("peso_inicial_g", 10, 2).notNullable().checkPositive("lotes_peso_inicial_positivo");
  t.decimal("peso_actual_g", 10, 2).notNullable();
  t.boolean("activo").notNullable().defaultTo(true);
  // CHECK de tabla que compara dos columnas
  t.check("?? >= 0 AND ?? <= ??", ["peso_actual_g", "peso_actual_g", "peso_inicial_g"], "lotes_peso_actual_rango");
  t.index(["id_grano"], "lotes_id_grano_idx");                                            // INDEX
}));

await ejecutar("Tabla calibraciones", knex.schema.createTable("calibraciones", (t) => {
  t.increments("id_calibracion", { primaryKey: true });
  const fk = (col, tabla, ref, nombre) =>
    t.integer(col).notNullable().references(ref).inTable(tabla).onDelete("RESTRICT").onUpdate("CASCADE").withKeyName(nombre);
  fk("id_lote", "lotes", "id_lote", "calibraciones_id_lote_fkey");
  fk("id_molino", "equipos", "id_equipo", "calibraciones_id_molino_fkey");
  fk("id_maquina", "equipos", "id_equipo", "calibraciones_id_maquina_fkey");
  t.timestamp("fecha_hora", { useTz: false, precision: 3 }).notNullable().defaultTo(knex.fn.now());
  t.decimal("dosis_in_g", 5, 2).notNullable().checkPositive("calibraciones_dosis_positiva");
  t.decimal("ajuste_molienda", 4, 2).notNullable().checkPositive("calibraciones_ajuste_positivo");
  t.decimal("temperatura_c", 4, 1).notNullable().checkBetween([0, 100], "calibraciones_temperatura_rango");
  t.decimal("presion_bar", 3, 1).notNullable().checkBetween([0, 15], "calibraciones_presion_rango");
  t.decimal("yield_out_g", 5, 2).notNullable().checkPositive("calibraciones_yield_positivo");
  t.decimal("tiempo_segundos", 5, 1).notNullable().checkPositive("calibraciones_tiempo_positivo");
  t.string("ratio_calculado", 10).notNullable();
  t.decimal("tds_porcentaje", 5, 2).notNullable();
  t.check("?? > 0 AND ?? <= 100", ["tds_porcentaje", "tds_porcentaje"], "calibraciones_tds_rango");
  t.decimal("ey_porcentaje", 5, 2).notNullable();
  t.string("diagnostico", 150).notNullable()
    .checkIn(["EQUILIBRADA", "SUBEXTRAIDA", "SOBREEXTRAIDA"], "calibraciones_diagnostico_catalogo");
  t.decimal("calificacion_sabor", 3, 1).notNullable().checkBetween([0, 10], "calibraciones_calificacion_rango");
  t.string("notas_barista", 255);
  t.string("barista_nombre", 100).notNullable();
  t.index(["id_lote"], "calibraciones_id_lote_idx");
}));

await ejecutar("Tabla notas_cata", knex.schema.createTable("notas_cata", (t) => {
  t.increments("id_nota", { primaryKey: true });
  t.integer("id_lote").notNullable()
    .references("id_lote").inTable("lotes").onDelete("RESTRICT").onUpdate("CASCADE").withKeyName("notas_cata_id_lote_fkey");
  t.string("descriptor", 80).notNullable();
  t.unique(["id_lote", "descriptor"], { indexName: "notas_cata_id_lote_descriptor_key" }); // UNIQUE compuesto
}));

fs.writeFileSync(new URL("../../../docs/unidad4/knex_sql_generado.sql", import.meta.url),
  "-- SQL generado por el schema builder de Knex (scripts/crear-con-knex.mjs)\n\n" + sqlGenerado.join("\n"));

// ===================== 4.2 GESTIONAR REGISTROS =====================
const granos = await knex("granos").insert([
  { nombre_cafe: "Chiapas Altura Selecta", finca: "Finca La Esperanza", productor: "Cooperativa Sierra Madre", pais_origen: "México", region: "Chiapas", varietal: "Typica", proceso: "Lavado", puntuacion_sca: 86.5 },
  { nombre_cafe: "Geisha Boquete", finca: "Finca Lérida", productor: "Hacienda La Esmeralda", pais_origen: "Panamá", region: "Boquete", varietal: "Geisha", proceso: "Lavado", puntuacion_sca: 92.5 },
  { nombre_cafe: "Sidama Natural", finca: "Bombe", productor: "Unión Sidama", pais_origen: "Etiopía", region: "Sidama", varietal: "Heirloom", proceso: "Natural", puntuacion_sca: 87.75 },
]).returning("id_grano");
const equipos = await knex("equipos").insert([
  { tipo: "molino", marca: "Eureka", modelo: "Mignon Specialita", identificador_local: "MOL-01" },
  { tipo: "maquina", marca: "La Marzocco", modelo: "Linea Mini", identificador_local: "MAQ-01" },
]).returning("id_equipo");
const lotes = await knex("lotes").insert([
  { id_grano: granos[0].id_grano, codigo_lote: "LT-2026-001", tostaduria: "Tostaduría Local", fecha_tueste: "2026-09-20", nivel_tueste: "Medio", peso_inicial_g: 1000, peso_actual_g: 1000 },
  { id_grano: granos[1].id_grano, codigo_lote: "LT-2026-002", tostaduria: "Tostaduría Local", fecha_tueste: "2026-09-22", nivel_tueste: "Claro", peso_inicial_g: 1000, peso_actual_g: 1000 },
  { id_grano: granos[2].id_grano, codigo_lote: "LT-2026-003", tostaduria: "Tostaduría Norte", fecha_tueste: "2026-09-25", nivel_tueste: "Medio", peso_inicial_g: 1000, peso_actual_g: 1000 },
]).returning("id_lote");
await knex("calibraciones").insert({
  id_lote: lotes[0].id_lote, id_molino: equipos[0].id_equipo, id_maquina: equipos[1].id_equipo, dosis_in_g: 18, ajuste_molienda: 12,
  temperatura_c: 93, presion_bar: 9, yield_out_g: 36, tiempo_segundos: 28, ratio_calculado: "1:2.0", tds_porcentaje: 9.9,
  ey_porcentaje: 19.8, diagnostico: "EQUILIBRADA", calificacion_sabor: 8, notas_barista: "Chocolate y caramelo", barista_nombre: "Carlos Ramírez",
});
await knex("notas_cata").insert([
  { id_lote: lotes[0].id_lote, descriptor: "Chocolate amargo" }, { id_lote: lotes[0].id_lote, descriptor: "Caramelo" },
  { id_lote: lotes[1].id_lote, descriptor: "Jazmín" }, { id_lote: lotes[2].id_lote, descriptor: "Arándano" },
]);
await knex("lotes").where({ codigo_lote: "LT-2026-001" }).decrement("peso_actual_g", 18);       // modificación
await knex("notas_cata").where({ id_lote: lotes[2].id_lote, descriptor: "Arándano" }).del();     // baja
const consulta = await knex("lotes as l").join("granos as g", "g.id_grano", "l.id_grano")
  .select("l.codigo_lote", "g.nombre_cafe", "l.peso_actual_g", "l.activo").orderBy("l.codigo_lote");
console.log("4.2 Registros:");
console.table(consulta);
await knex.destroy();

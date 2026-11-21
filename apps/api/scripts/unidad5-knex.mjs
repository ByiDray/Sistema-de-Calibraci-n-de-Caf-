// Unidad 5 · Segundo framework: Knex (query builder)
// 5.1 25 consultas simples, 5.2 15 JOIN, 5.3 15 funciones agregadas, 5.4 5 vistas, 5.5 5 funciones y disparadores.
// Todo se arma con el query builder (select, where, join, leftJoin, rightJoin, fullOuterJoin, crossJoin,
// groupBy, having, count, avg, sum...) y las vistas con knex.schema.createViewOrReplace. knex.raw solo
// aparece en expresiones sueltas (ROUND, CASE, EXTRACT, STRING_AGG) y en el PL/pgSQL de 5.5.
// Trabaja sobre cafe_u5_knex (copia de "cafe", ver docs/unidad5/preparar_bases.ps1).
// El SQL que genera Knex se guarda en docs/unidad5/knex_sql_generado.sql
// Uso (desde apps/api): node scripts/unidad5-knex.mjs
import "dotenv/config";
import fs from "node:fs";
import knexFactory from "knex";
import pg from "pg";
import { conBase, crearSalida, DDL_FUNCIONES } from "./unidad5-comun.mjs";

// El driver pg convierte TIMESTAMP (sin zona) y DATE a Date en la hora local de la PC, lo que
// las corre 6 horas. Se leen como texto para mostrarlas igual que psql.
pg.types.setTypeParser(1114, (v) => v); // timestamp
pg.types.setTypeParser(1082, (v) => v); // date

const knex = knexFactory({ client: "pg", connection: conBase(process.env.DATABASE_URL, "cafe_u5_knex") });
const { imprimir, guardar } = crearSalida("knex");
const r = knex.raw.bind(knex);
const sqlGenerado = [];
const QB = "query builder";

// Ejecuta una consulta del builder, guarda su SQL y devuelve las filas.
async function q(id, consulta) {
  sqlGenerado.push(`-- [${id}]\n${consulta.toString()};\n`);
  const res = await consulta;
  return Array.isArray(res) ? res : res.rows;
}

const pasos = [
  // ===================== 5.1 CONSULTAS SIMPLES =====================
  ["CS01", "Todos los granos ordenados por nombre", QB, () => knex("granos").select("*").orderBy("nombre_cafe")],
  ["CS02", "Proyección: nombre, país y puntuación SCA", QB, () => knex("granos").select("nombre_cafe", "pais_origen", "puntuacion_sca").orderBy("id_grano")],
  ["CS03", "Granos de proceso Natural", QB, () => knex("granos").select("nombre_cafe", "pais_origen").where("proceso", "Natural").orderBy("nombre_cafe")],
  ["CS04", "Granos con puntuación SCA de 88 o más", QB, () =>
    knex("granos").select("nombre_cafe", "puntuacion_sca").where("puntuacion_sca", ">=", 88).orderBy("puntuacion_sca", "desc")],
  ["CS05", "Granos con SCA entre 85 y 88 (BETWEEN)", QB, () =>
    knex("granos").select("nombre_cafe", "puntuacion_sca").whereBetween("puntuacion_sca", [85, 88]).orderBy("puntuacion_sca")],
  ["CS06", "Granos de México, Colombia o Perú (IN)", QB, () =>
    knex("granos").select("nombre_cafe", "pais_origen").whereIn("pais_origen", ["México", "Colombia", "Perú"]).orderBy(["pais_origen", "nombre_cafe"])],
  ["CS07", 'Granos cuyo nombre contiene "natural" sin importar mayúsculas (ILIKE)', QB, () =>
    knex("granos").select("nombre_cafe", "proceso").whereILike("nombre_cafe", "%natural%").orderBy("nombre_cafe")],
  ["CS08", "Calibraciones sin notas del barista (IS NULL)", QB, () =>
    knex("calibraciones").select("id_calibracion", "barista_nombre", "fecha_hora").whereNull("notas_barista").orderBy("id_calibracion")],
  ["CS09", "Los 3 granos con mejor puntuación (ORDER BY + LIMIT)", QB, () =>
    knex("granos").select("nombre_cafe", "puntuacion_sca").orderBy("puntuacion_sca", "desc").limit(3)],
  ["CS10", "Países de origen distintos (DISTINCT)", QB, () => knex("granos").distinct("pais_origen").orderBy("pais_origen")],
  ["CS11", "Porcentaje de existencia que queda en cada lote (expresión con alias)", `${QB} + knex.raw`, () =>
    knex("lotes").select("codigo_lote", "peso_actual_g", "peso_inicial_g", r("ROUND(peso_actual_g / peso_inicial_g * 100, 1) AS porcentaje_restante"))
      .orderBy([{ column: "porcentaje_restante", order: "desc" }, "codigo_lote"])],
  ["CS12", "Lotes activos de tueste Medio u Oscuro (AND / OR)", QB, () =>
    knex("lotes").select("codigo_lote", "nivel_tueste").where("activo", true)
      .andWhere((w) => w.where("nivel_tueste", "Medio").orWhere("nivel_tueste", "Oscuro")).orderBy("codigo_lote")],
  ["CS13", "Equipos que no son molino (NOT)", QB, () =>
    knex("equipos").select("identificador_local", "marca", "modelo").whereNot("tipo", "molino").orderBy("identificador_local")],
  ["CS14", "Lotes tostados del 1 de octubre de 2026 en adelante (fechas)", QB, () =>
    knex("lotes").select("codigo_lote", "fecha_tueste").where("fecha_tueste", ">=", "2026-10-01").orderBy("fecha_tueste")],
  ["CS15", "Calibraciones hechas por la tarde, de 15:00 en adelante (EXTRACT)", `${QB} + knex.raw`, () =>
    knex("calibraciones").select("id_calibracion", "fecha_hora", r("EXTRACT(HOUR FROM fecha_hora) AS hora"))
      .whereRaw("EXTRACT(HOUR FROM fecha_hora) >= ?", [15]).orderBy("fecha_hora")],
  ["CS16", "Clasificación de cada grano según su SCA (CASE)", `${QB} + knex.raw`, () =>
    knex("granos").select("nombre_cafe", "puntuacion_sca",
      r("CASE WHEN puntuacion_sca >= 90 THEN 'Excepcional' WHEN puntuacion_sca >= 85 THEN 'Excelente' ELSE 'Muy bueno' END AS clasificacion"))
      .orderBy("puntuacion_sca", "desc")],
  ["CS17", "Calibraciones sobreextraídas", QB, () =>
    knex("calibraciones").select("id_calibracion", "ey_porcentaje", "barista_nombre").where("diagnostico", "SOBREEXTRAIDA").orderBy("ey_porcentaje", "desc")],
  ["CS18", "Calibraciones en el rango ideal de EY (18 a 22 %), mejor sabor primero", QB, () =>
    knex("calibraciones").select("id_calibracion", "ey_porcentaje", "calificacion_sabor").whereBetween("ey_porcentaje", [18, 22])
      .orderBy([{ column: "calificacion_sabor", order: "desc" }, "id_calibracion"])],
  ["CS19", "Segunda página de calibraciones, 5 por página (LIMIT / OFFSET)", QB, () =>
    knex("calibraciones").select("id_calibracion", "fecha_hora", "barista_nombre").orderBy("fecha_hora").limit(5).offset(5)],
  ["CS20", "Lotes inactivos", QB, () => knex("lotes").select("codigo_lote", "peso_actual_g").where("activo", false).orderBy("codigo_lote")],
  ["CS21", "Nombre completo de cada equipo en mayúsculas (funciones de texto)", `${QB} + knex.raw`, () =>
    knex("equipos").select("identificador_local", r("UPPER(marca || ' ' || modelo) AS equipo"), r("LENGTH(modelo) AS largo_modelo")).orderBy("identificador_local")],
  ["CS22", "Granos con finca registrada, ordenados por región", QB, () =>
    knex("granos").select("nombre_cafe", "finca", "region").whereNotNull("finca").orderBy("region", "asc", "last").orderBy("nombre_cafe")],
  ["CS23", "Notas de cata que mencionan chocolate", QB, () =>
    knex("notas_cata").select("id_lote", "descriptor").whereILike("descriptor", "%chocolate%").orderBy("id_nota")],
  ["CS24", 'Notas del barista, o "Sin notas" si no hay (COALESCE)', `${QB} + knex.raw`, () =>
    knex("calibraciones").select("id_calibracion", r("COALESCE(notas_barista, 'Sin notas') AS notas")).orderBy("id_calibracion")],
  ["CS25", "Extracciones de 25 a 30 segundos a 9 bar", QB, () =>
    knex("calibraciones").select("id_calibracion", "tiempo_segundos", "presion_bar").whereBetween("tiempo_segundos", [25, 30]).andWhere("presion_bar", 9).orderBy("id_calibracion")],

  // ===================== 5.2 OPERACIONES JOIN =====================
  ["JN01", "Cada lote con el nombre de su café (INNER JOIN)", `${QB} (innerJoin)`, () =>
    knex("lotes as l").innerJoin("granos as g", "g.id_grano", "l.id_grano").select("l.codigo_lote", "g.nombre_cafe", "l.tostaduria").orderBy("l.codigo_lote")],
  ["JN02", "Calibraciones con su lote y su café (tres tablas)", `${QB} (join)`, () =>
    knex("calibraciones as c").join("lotes as l", "l.id_lote", "c.id_lote").join("granos as g", "g.id_grano", "l.id_grano")
      .select("c.id_calibracion", "l.codigo_lote", "g.nombre_cafe", "c.ey_porcentaje").orderBy("c.id_calibracion")],
  ["JN03", "Calibraciones con el molino y la máquina usados (misma tabla dos veces)", `${QB} (join con alias)`, () =>
    knex("calibraciones as c").join("equipos as m", "m.id_equipo", "c.id_molino").join("equipos as q", "q.id_equipo", "c.id_maquina")
      .select("c.id_calibracion", "m.identificador_local as molino", "q.identificador_local as maquina").orderBy("c.id_calibracion")],
  ["JN04", "Todos los granos con sus lotes, aunque no tengan (LEFT JOIN)", `${QB} (leftJoin)`, () =>
    knex("granos as g").leftJoin("lotes as l", "l.id_grano", "g.id_grano").select("g.nombre_cafe", "l.codigo_lote").orderBy(["g.nombre_cafe", "l.codigo_lote"])],
  ["JN05", "Lotes que nunca se han calibrado (LEFT JOIN ... IS NULL)", `${QB} (leftJoin + whereNull)`, () =>
    knex("lotes as l").leftJoin("calibraciones as c", "c.id_lote", "l.id_lote").whereNull("c.id_calibracion").select("l.codigo_lote").orderBy("l.codigo_lote")],
  ["JN06", "Calibraciones por molino, incluidos los molinos sin uso (RIGHT JOIN)", `${QB} (rightJoin)`, () =>
    knex("calibraciones as c").rightJoin("equipos as e", "e.id_equipo", "c.id_molino").where("e.tipo", "molino")
      .select("e.identificador_local", "c.id_calibracion").orderBy(["e.identificador_local", "c.id_calibracion"])],
  ["JN07", "Lotes y notas de cata, aparezcan o no en la otra tabla (FULL OUTER JOIN)", `${QB} (fullOuterJoin)`, () =>
    knex("lotes as l").fullOuterJoin("notas_cata as n", "n.id_lote", "l.id_lote").select("l.codigo_lote", "n.descriptor").orderBy(["l.codigo_lote", "n.descriptor"])],
  ["JN08", "Notas de cata con su lote y su café", `${QB} (join)`, () =>
    knex("notas_cata as n").join("lotes as l", "l.id_lote", "n.id_lote").join("granos as g", "g.id_grano", "l.id_grano")
      .select("n.descriptor", "l.codigo_lote", "g.nombre_cafe").orderBy(["g.nombre_cafe", "n.descriptor"])],
  ["JN09", "Calibraciones equilibradas de cafés lavados (JOIN con filtro)", `${QB} (join + where)`, () =>
    knex("calibraciones as c").join("lotes as l", "l.id_lote", "c.id_lote").join("granos as g", "g.id_grano", "l.id_grano")
      .where({ "g.proceso": "Lavado", "c.diagnostico": "EQUILIBRADA" }).select("c.id_calibracion", "g.nombre_cafe", "c.ey_porcentaje").orderBy("c.id_calibracion")],
  ["JN10", "Pares de granos del mismo país (SELF JOIN)", `${QB} (join de la tabla consigo misma)`, () =>
    knex("granos as a").join("granos as b", (on) => on.on("a.pais_origen", "b.pais_origen").andOn("a.id_grano", "<", "b.id_grano"))
      .select("a.nombre_cafe as grano_a", "b.nombre_cafe as grano_b", "a.pais_origen").orderBy("a.pais_origen")],
  ["JN11", "Combinaciones posibles de molino y máquina (CROSS JOIN)", `${QB} (crossJoin)`, () =>
    knex("equipos as m").crossJoin("equipos as q").where({ "m.tipo": "molino", "q.tipo": "maquina" })
      .select("m.identificador_local as molino", "q.identificador_local as maquina").orderBy(["molino", "maquina"])],
  ["JN12", "Notas de cata con su lote (JOIN ... USING)", `${QB} (joinRaw USING)`, () =>
    knex("notas_cata").joinRaw("JOIN lotes USING (id_lote)").select("codigo_lote", "descriptor").orderBy(["codigo_lote", "descriptor"])],
  ["JN13", "Ficha completa de cada calibración (cinco tablas)", `${QB} (join) + knex.raw`, () =>
    knex("calibraciones as c").join("lotes as l", "l.id_lote", "c.id_lote").join("granos as g", "g.id_grano", "l.id_grano")
      .join("equipos as m", "m.id_equipo", "c.id_molino").join("equipos as q", "q.id_equipo", "c.id_maquina")
      .select("c.id_calibracion", "g.nombre_cafe", "l.codigo_lote", r("m.marca || ' ' || m.modelo AS molino"), r("q.marca || ' ' || q.modelo AS maquina"),
        "c.ratio_calculado", "c.diagnostico").orderBy("c.id_calibracion")],
  ["JN14", "Cada lote con su calibración más reciente (LEFT JOIN LATERAL)", `${QB} (joinRaw LATERAL)`, () =>
    knex("lotes as l").joinRaw(`LEFT JOIN LATERAL (${knex("calibraciones as c").select("c.fecha_hora", "c.ey_porcentaje")
      .whereRaw("c.id_lote = l.id_lote").orderBy("c.fecha_hora", "desc").limit(1).toString()}) u ON TRUE`)
      .select("l.codigo_lote", "u.fecha_hora as ultima_calibracion", "u.ey_porcentaje").orderBy("l.codigo_lote")],
  ["JN15", "Calibraciones hechas más de 30 días después del tueste (JOIN con condición no igual)", `${QB} (join con on + andOn)`, () =>
    knex("lotes as l").join("calibraciones as c", (on) => on.on("c.id_lote", "l.id_lote").andOn("c.fecha_hora", ">", r("l.fecha_tueste + INTERVAL '30 days'")))
      .select("l.codigo_lote", "l.fecha_tueste", "c.fecha_hora").orderBy("c.fecha_hora")],

  // ===================== 5.3 FUNCIONES AGREGADAS =====================
  ["AG01", "Total de granos registrados (COUNT)", `${QB} (count)`, () => knex("granos").count("* as total_granos")],
  ["AG02", "Granos por proceso (COUNT + GROUP BY)", `${QB} (count + groupBy)`, () =>
    knex("granos").select("proceso").count("* as granos").groupBy("proceso").orderBy([{ column: "granos", order: "desc" }, "proceso"])],
  ["AG03", "Puntuación SCA promedio por país (AVG)", `${QB} (groupBy) + knex.raw`, () =>
    knex("granos").select("pais_origen", r("ROUND(AVG(puntuacion_sca), 2) AS sca_promedio")).groupBy("pais_origen").orderBy("sca_promedio", "desc")],
  ["AG04", "Puntuación SCA más alta y más baja (MAX / MIN)", `${QB} (max + min)`, () =>
    knex("granos").max("puntuacion_sca as sca_maxima").min("puntuacion_sca as sca_minima")],
  ["AG05", "Gramos en existencia de los lotes activos (SUM)", `${QB} (sum)`, () => knex("lotes").sum("peso_actual_g as gramos_disponibles").where("activo", true)],
  ["AG06", "Calibraciones por diagnóstico", `${QB} (count + groupBy)`, () =>
    knex("calibraciones").select("diagnostico").count("* as calibraciones").groupBy("diagnostico").orderBy("calibraciones", "desc")],
  ["AG07", "EY y sabor promedio de cada lote calibrado", `${QB} (join + groupBy) + knex.raw`, () =>
    knex("calibraciones as c").join("lotes as l", "l.id_lote", "c.id_lote")
      .select("l.codigo_lote", r("COUNT(*) AS calibraciones"), r("ROUND(AVG(c.ey_porcentaje), 2) AS ey_promedio"), r("ROUND(AVG(c.calificacion_sabor), 1) AS sabor_promedio"))
      .groupBy("l.codigo_lote").orderBy("l.codigo_lote")],
  ["AG08", "Lotes con más de una calibración (HAVING)", `${QB} (groupBy + having)`, () =>
    knex("calibraciones").select("id_lote").count("* as calibraciones").groupBy("id_lote").having(r("COUNT(*)"), ">", 1)
      .orderBy([{ column: "calibraciones", order: "desc" }, "id_lote"])],
  ["AG09", "Número de baristas distintos (COUNT DISTINCT)", `${QB} (countDistinct)`, () => knex("calibraciones").countDistinct("barista_nombre as baristas")],
  ["AG10", "Calibraciones y sabor promedio por barista", `${QB} (groupBy) + knex.raw`, () =>
    knex("calibraciones").select("barista_nombre", r("COUNT(*) AS calibraciones"), r("ROUND(AVG(calificacion_sabor), 1) AS sabor_promedio"))
      .groupBy("barista_nombre").orderBy([{ column: "sabor_promedio", order: "desc" }, "barista_nombre"])],
  ["AG11", "Veces que se usó cada molino, incluidos los que no (COUNT + LEFT JOIN)", `${QB} (leftJoin + count)`, () =>
    knex("equipos as e").leftJoin("calibraciones as c", "c.id_molino", "e.id_equipo").where("e.tipo", "molino")
      .select("e.identificador_local").count("c.id_calibracion as usos").groupBy("e.identificador_local")
      .orderBy([{ column: "usos", order: "desc" }, "e.identificador_local"])],
  ["AG12", "Notas de cata de cada lote en una sola línea (STRING_AGG)", `${QB} (join + groupBy) + knex.raw`, () =>
    knex("lotes as l").join("notas_cata as n", "n.id_lote", "l.id_lote")
      .select("l.codigo_lote", r("STRING_AGG(n.descriptor, ', ' ORDER BY n.descriptor) AS notas")).groupBy("l.codigo_lote").orderBy("l.codigo_lote")],
  ["AG13", "Receta promedio por máquina: dosis, bebida y tiempo", `${QB} (join + groupBy) + knex.raw`, () =>
    knex("calibraciones as c").join("equipos as e", "e.id_equipo", "c.id_maquina")
      .select("e.identificador_local", r("ROUND(AVG(c.dosis_in_g), 2) AS dosis"), r("ROUND(AVG(c.yield_out_g), 2) AS bebida"), r("ROUND(AVG(c.tiempo_segundos), 1) AS tiempo"))
      .groupBy("e.identificador_local").orderBy("e.identificador_local")],
  ["AG14", "Consumo por nivel de tueste: lotes, gramos iniciales, restantes y % consumido", `${QB} (count + sum + groupBy) + knex.raw`, () =>
    knex("lotes").select("nivel_tueste").count("* as lotes").sum("peso_inicial_g as gramos_iniciales").sum("peso_actual_g as gramos_restantes")
      .select(r("ROUND((1 - SUM(peso_actual_g) / SUM(peso_inicial_g)) * 100, 1) AS porcentaje_consumido")).groupBy("nivel_tueste").orderBy("nivel_tueste")],
  ["AG15", "Calibraciones y EY promedio por mes (DATE_TRUNC)", `${QB} (groupBy) + knex.raw`, () =>
    knex("calibraciones").select(r("TO_CHAR(DATE_TRUNC('month', fecha_hora), 'YYYY-MM') AS mes"), r("COUNT(*) AS calibraciones"), r("ROUND(AVG(ey_porcentaje), 2) AS ey_promedio"))
      .groupBy("mes").orderBy("mes")],
];

// ===================== 5.4 VISTAS (knex.schema.createViewOrReplace) =====================
const vistas = [
  ["VI01", "Vista v_ficha_calibracion: cada calibración con su café, lote y equipos", "v_ficha_calibracion",
    () => knex("calibraciones as c").join("lotes as l", "l.id_lote", "c.id_lote").join("granos as g", "g.id_grano", "l.id_grano")
      .join("equipos as m", "m.id_equipo", "c.id_molino").join("equipos as q", "q.id_equipo", "c.id_maquina")
      .select("c.id_calibracion", "c.fecha_hora", "g.nombre_cafe", "l.codigo_lote", r("m.marca || ' ' || m.modelo AS molino"), r("q.marca || ' ' || q.modelo AS maquina"),
        "c.dosis_in_g", "c.yield_out_g", "c.ratio_calculado", "c.ey_porcentaje", "c.diagnostico", "c.calificacion_sabor", "c.barista_nombre"),
    () => knex("v_ficha_calibracion").select("id_calibracion", "nombre_cafe", "codigo_lote", "ratio_calculado", "diagnostico").orderBy("id_calibracion")],
  ["VI02", "Vista v_existencia_lotes: porcentaje restante y estado de cada lote", "v_existencia_lotes",
    () => knex("lotes as l").join("granos as g", "g.id_grano", "l.id_grano")
      .select("l.codigo_lote", "g.nombre_cafe", "l.peso_actual_g", "l.peso_inicial_g", r("ROUND(l.peso_actual_g / l.peso_inicial_g * 100, 1) AS porcentaje_restante"),
        r("CASE WHEN l.peso_actual_g = 0 THEN 'Agotado' WHEN l.peso_actual_g / l.peso_inicial_g < 0.2 THEN 'Queda poco' ELSE 'Disponible' END AS estado")),
    () => knex("v_existencia_lotes").select("*").orderBy(["porcentaje_restante", "codigo_lote"])],
  ["VI03", "Vista v_resumen_grano: lotes, calibraciones y resultados por café", "v_resumen_grano",
    () => knex("granos as g").leftJoin("lotes as l", "l.id_grano", "g.id_grano").leftJoin("calibraciones as c", "c.id_lote", "l.id_lote")
      .select("g.id_grano", "g.nombre_cafe", "g.puntuacion_sca").countDistinct("l.id_lote as lotes").count("c.id_calibracion as calibraciones")
      .select(r("ROUND(AVG(c.ey_porcentaje), 2) AS ey_promedio")).max("c.calificacion_sabor as mejor_sabor")
      .groupBy("g.id_grano", "g.nombre_cafe", "g.puntuacion_sca"),
    () => knex("v_resumen_grano").select("nombre_cafe", "lotes", "calibraciones", "ey_promedio", "mejor_sabor").orderBy("id_grano")],
  ["VI04", "Vista v_mejor_receta_lote: la calibración con mejor sabor de cada lote", "v_mejor_receta_lote",
    () => knex("calibraciones as c").join("lotes as l", "l.id_lote", "c.id_lote").distinctOn("c.id_lote")
      .select("c.id_lote", "l.codigo_lote", "c.id_calibracion", "c.dosis_in_g", "c.yield_out_g", "c.tiempo_segundos", "c.ajuste_molienda", "c.calificacion_sabor")
      .orderBy([{ column: "c.id_lote" }, { column: "c.calificacion_sabor", order: "desc" }, { column: "c.fecha_hora", order: "desc" }]),
    () => knex("v_mejor_receta_lote").select("codigo_lote", "id_calibracion", "dosis_in_g", "yield_out_g", "calificacion_sabor").orderBy("codigo_lote")],
  ["VI05", "Vista v_uso_equipos: cuántas veces se ha usado cada equipo", "v_uso_equipos",
    () => knex("equipos as e").select("e.identificador_local", "e.tipo", r("e.marca || ' ' || e.modelo AS equipo"),
      knex("calibraciones as c").count("*").whereRaw("c.id_molino = e.id_equipo OR c.id_maquina = e.id_equipo").as("usos")),
    () => knex("v_uso_equipos").select("*").orderBy([{ column: "usos", order: "desc" }, "identificador_local"])],
];
for (const [id, titulo, nombre, definicion, consulta] of vistas) {
  pasos.push([id, titulo, "knex.schema.createViewOrReplace + query builder", async () => {
    const crear = knex.schema.createViewOrReplace(nombre, (v) => v.as(definicion()));
    sqlGenerado.push(`-- [${id}] crear vista\n${crear.toString()};\n`);
    await crear;
    return q(id, consulta());
  }]);
}

// ===================== 5.5 FUNCIONES Y DISPARADORES (knex.raw) =====================
async function crearFuncion(id) {
  for (const s of DDL_FUNCIONES[id]) {
    sqlGenerado.push(`-- [${id}]\n${s};\n`);
    await knex.raw(s);
  }
}
pasos.push(
  ["FN01", "Función fn_calcular_ey(tds, bebida, dosis): porcentaje de extracción", "knex.raw (CREATE FUNCTION) + query builder", async () => {
    await crearFuncion("FN01");
    return q("FN01", knex("calibraciones").select("id_calibracion", "ey_porcentaje as ey_guardado",
      r("fn_calcular_ey(tds_porcentaje, yield_out_g, dosis_in_g) AS ey_funcion")).orderBy("id_calibracion"));
  }],
  ["FN02", "Función fn_porcentaje_existencia(id_lote): cuánto queda de un lote", "knex.raw (CREATE FUNCTION) + query builder", async () => {
    await crearFuncion("FN02");
    return q("FN02", knex("lotes").select("codigo_lote", r("fn_porcentaje_existencia(id_lote) AS porcentaje")).orderBy("codigo_lote"));
  }],
  ["FN03", "Función fn_historial_lote(codigo): calibraciones de un lote como tabla", "knex.raw (CREATE FUNCTION) + query builder", async () => {
    await crearFuncion("FN03");
    return q("FN03", knex.select("*").from(r("fn_historial_lote(?)", ["LT-2026-001"])));
  }],
  ["FN04", "Disparador trg_bitacora_existencia: registra cada cambio de peso de un lote", "knex.raw (CREATE TRIGGER) + prueba con query builder", async () => {
    await crearFuncion("FN04");
    // Prueba: se usan 18 g del lote LT-2026-002 para un shot.
    await q("FN04 prueba", knex("lotes").where("codigo_lote", "LT-2026-002").decrement("peso_actual_g", 18));
    return q("FN04", knex("bitacora_existencia as b").select("b.id_lote", "b.peso_anterior", "b.peso_nuevo", "b.diferencia").orderBy("b.id_bitacora"));
  }],
  ["FN05", "Disparador trg_desactivar_lote_agotado: un lote sin existencia pasa a inactivo", "knex.raw (CREATE TRIGGER) + prueba con query builder", async () => {
    await crearFuncion("FN05");
    // Prueba: se termina el lote LT-2026-006; el UPDATE no toca "activo", lo cambia el disparador.
    await q("FN05 prueba", knex("lotes").where("codigo_lote", "LT-2026-006").update({ peso_actual_g: 0 }));
    return q("FN05", knex("lotes").select("codigo_lote", "peso_actual_g", "activo").where("codigo_lote", "LT-2026-006"));
  }],
);

for (const [id, titulo, forma, correr] of pasos) {
  const filas = id.startsWith("VI") || id.startsWith("FN") ? await correr() : await q(id, correr());
  imprimir(id, titulo, forma, filas);
}
guardar();
fs.writeFileSync(new URL("../../../docs/unidad5/knex_sql_generado.sql", import.meta.url),
  "-- Unidad 5 · SQL generado por Knex (scripts/unidad5-knex.mjs) sobre cafe_u5_knex\n\n" + sqlGenerado.join("\n"));
await knex.destroy();

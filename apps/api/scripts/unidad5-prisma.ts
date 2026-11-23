// Unidad 5 · Primer framework: Prisma
// 5.1 25 consultas simples, 5.2 15 JOIN, 5.3 15 funciones agregadas, 5.4 5 vistas, 5.5 5 funciones y disparadores.
// Se usa la API de Prisma Client (findMany, include, aggregate, groupBy, count) siempre que la
// consulta se puede expresar con ella; lo que Prisma no modela (RIGHT/FULL/CROSS/SELF JOIN,
// STRING_AGG, DATE_TRUNC, vistas y PL/pgSQL) se envía como SQL con $queryRaw / $executeRaw.
// Trabaja sobre cafe_u5_prisma (copia de "cafe", ver docs/unidad5/preparar_bases.ps1).
// Uso (desde apps/api): npx tsx scripts/unidad5-prisma.ts
import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { conBase, crearSalida, DDL_FUNCIONES } from "./unidad5-comun.mjs";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: conBase(process.env.DATABASE_URL!, "cafe_u5_prisma") }) });
const { imprimir, guardar } = crearSalida("prisma");

type Fila = Record<string, unknown>;
const API = "Prisma Client";
const RAW = "SQL con $queryRaw";
const n = (d: Prisma.Decimal | number | null) => (d == null ? null : Number(d));
const redondear = (x: number | null, dec: number) => (x == null ? null : Math.round((x + 1e-9) * 10 ** dec) / 10 ** dec);
const crudo = (sql: string) => db.$queryRawUnsafe<Fila[]>(sql);
const ejecutar = async (sentencias: string[]) => { for (const s of sentencias) await db.$executeRawUnsafe(s); };

const pasos: [id: string, titulo: string, forma: string, correr: () => Promise<Fila[]>][] = [
  // ===================== 5.1 CONSULTAS SIMPLES =====================
  ["CS01", "Todos los granos ordenados por nombre", API, () => db.grano.findMany({ orderBy: { nombreCafe: "asc" } })],
  ["CS02", "Proyección: nombre, país y puntuación SCA", API, () =>
    db.grano.findMany({ select: { nombreCafe: true, paisOrigen: true, puntuacionSca: true }, orderBy: { id: "asc" } })],
  ["CS03", "Granos de proceso Natural", API, () =>
    db.grano.findMany({ where: { proceso: "Natural" }, select: { nombreCafe: true, paisOrigen: true }, orderBy: { nombreCafe: "asc" } })],
  ["CS04", "Granos con puntuación SCA de 88 o más", API, () =>
    db.grano.findMany({ where: { puntuacionSca: { gte: 88 } }, select: { nombreCafe: true, puntuacionSca: true }, orderBy: { puntuacionSca: "desc" } })],
  ["CS05", "Granos con SCA entre 85 y 88 (BETWEEN)", API, () =>
    db.grano.findMany({ where: { puntuacionSca: { gte: 85, lte: 88 } }, select: { nombreCafe: true, puntuacionSca: true }, orderBy: { puntuacionSca: "asc" } })],
  ["CS06", "Granos de México, Colombia o Perú (IN)", API, () =>
    db.grano.findMany({ where: { paisOrigen: { in: ["México", "Colombia", "Perú"] } }, select: { nombreCafe: true, paisOrigen: true }, orderBy: [{ paisOrigen: "asc" }, { nombreCafe: "asc" }] })],
  ["CS07", 'Granos cuyo nombre contiene "natural" sin importar mayúsculas (ILIKE)', API, () =>
    db.grano.findMany({ where: { nombreCafe: { contains: "natural", mode: "insensitive" } }, select: { nombreCafe: true, proceso: true }, orderBy: { nombreCafe: "asc" } })],
  ["CS08", "Calibraciones sin notas del barista (IS NULL)", API, () =>
    db.calibracion.findMany({ where: { notasBarista: null }, select: { id: true, baristaNombre: true, fechaHora: true }, orderBy: { id: "asc" } })],
  ["CS09", "Los 3 granos con mejor puntuación (ORDER BY + LIMIT)", API, () =>
    db.grano.findMany({ select: { nombreCafe: true, puntuacionSca: true }, orderBy: { puntuacionSca: "desc" }, take: 3 })],
  ["CS10", "Países de origen distintos (DISTINCT)", API, () =>
    db.grano.findMany({ distinct: ["paisOrigen"], select: { paisOrigen: true }, orderBy: { paisOrigen: "asc" } })],
  ["CS11", "Porcentaje de existencia que queda en cada lote (expresión con alias)", `${API} + cálculo en TypeScript`, async () =>
    (await db.lote.findMany({ select: { codigoLote: true, pesoActualG: true, pesoInicialG: true } }))
      .map((l) => ({ ...l, porcentajeRestante: redondear((n(l.pesoActualG)! / n(l.pesoInicialG)!) * 100, 1) }))
      .sort((a, b) => b.porcentajeRestante! - a.porcentajeRestante! || a.codigoLote.localeCompare(b.codigoLote))],
  ["CS12", "Lotes activos de tueste Medio u Oscuro (AND / OR)", API, () =>
    db.lote.findMany({ where: { activo: true, OR: [{ nivelTueste: "Medio" }, { nivelTueste: "Oscuro" }] }, select: { codigoLote: true, nivelTueste: true }, orderBy: { codigoLote: "asc" } })],
  ["CS13", "Equipos que no son molino (NOT)", API, () =>
    db.equipo.findMany({ where: { NOT: { tipo: "molino" } }, select: { identificadorLocal: true, marca: true, modelo: true }, orderBy: { identificadorLocal: "asc" } })],
  ["CS14", "Lotes tostados del 1 de octubre de 2026 en adelante (fechas)", API, () =>
    db.lote.findMany({ where: { fechaTueste: { gte: new Date("2026-10-01") } }, select: { codigoLote: true, fechaTueste: true }, orderBy: { fechaTueste: "asc" } })],
  ["CS15", "Calibraciones hechas por la tarde, de 15:00 en adelante (EXTRACT)", `${API} + filtro en TypeScript`, async () =>
    (await db.calibracion.findMany({ select: { id: true, fechaHora: true }, orderBy: { fechaHora: "asc" } }))
      .map((c) => ({ ...c, hora: c.fechaHora.getUTCHours() })).filter((c) => c.hora >= 15)],
  ["CS16", "Clasificación de cada grano según su SCA (CASE)", `${API} + cálculo en TypeScript`, async () =>
    (await db.grano.findMany({ select: { nombreCafe: true, puntuacionSca: true }, orderBy: { puntuacionSca: "desc" } }))
      .map((g) => ({ ...g, clasificacion: n(g.puntuacionSca)! >= 90 ? "Excepcional" : n(g.puntuacionSca)! >= 85 ? "Excelente" : "Muy bueno" }))],
  ["CS17", "Calibraciones sobreextraídas", API, () =>
    db.calibracion.findMany({ where: { diagnostico: "SOBREEXTRAIDA" }, select: { id: true, eyPorcentaje: true, baristaNombre: true }, orderBy: { eyPorcentaje: "desc" } })],
  ["CS18", "Calibraciones en el rango ideal de EY (18 a 22 %), mejor sabor primero", API, () =>
    db.calibracion.findMany({ where: { eyPorcentaje: { gte: 18, lte: 22 } }, select: { id: true, eyPorcentaje: true, calificacionSabor: true }, orderBy: [{ calificacionSabor: "desc" }, { id: "asc" }] })],
  ["CS19", "Segunda página de calibraciones, 5 por página (LIMIT / OFFSET)", API, () =>
    db.calibracion.findMany({ select: { id: true, fechaHora: true, baristaNombre: true }, orderBy: { fechaHora: "asc" }, skip: 5, take: 5 })],
  ["CS20", "Lotes inactivos", API, () =>
    db.lote.findMany({ where: { activo: false }, select: { codigoLote: true, pesoActualG: true }, orderBy: { codigoLote: "asc" } })],
  ["CS21", "Nombre completo de cada equipo en mayúsculas (funciones de texto)", `${API} + cálculo en TypeScript`, async () =>
    (await db.equipo.findMany({ orderBy: { identificadorLocal: "asc" } }))
      .map((e) => ({ identificadorLocal: e.identificadorLocal, equipo: `${e.marca} ${e.modelo}`.toUpperCase(), largoModelo: e.modelo.length }))],
  ["CS22", "Granos con finca registrada, ordenados por región", API, () =>
    db.grano.findMany({ where: { finca: { not: null } }, select: { nombreCafe: true, finca: true, region: true }, orderBy: [{ region: { sort: "asc", nulls: "last" } }, { nombreCafe: "asc" }] })],
  ["CS23", "Notas de cata que mencionan chocolate", API, () =>
    db.notaCata.findMany({ where: { descriptor: { contains: "chocolate", mode: "insensitive" } }, select: { idLote: true, descriptor: true }, orderBy: { id: "asc" } })],
  ["CS24", 'Notas del barista, o "Sin notas" si no hay (COALESCE)', `${API} + cálculo en TypeScript`, async () =>
    (await db.calibracion.findMany({ select: { id: true, notasBarista: true }, orderBy: { id: "asc" } }))
      .map((c) => ({ id: c.id, notas: c.notasBarista ?? "Sin notas" }))],
  ["CS25", "Extracciones de 25 a 30 segundos a 9 bar", API, () =>
    db.calibracion.findMany({ where: { tiempoSegundos: { gte: 25, lte: 30 }, presionBar: 9 }, select: { id: true, tiempoSegundos: true, presionBar: true }, orderBy: { id: "asc" } })],

  // ===================== 5.2 OPERACIONES JOIN =====================
  ["JN01", "Cada lote con el nombre de su café (INNER JOIN)", `${API} (include)`, async () =>
    (await db.lote.findMany({ include: { grano: true }, orderBy: { codigoLote: "asc" } }))
      .map((l) => ({ codigoLote: l.codigoLote, nombreCafe: l.grano.nombreCafe, tostaduria: l.tostaduria }))],
  ["JN02", "Calibraciones con su lote y su café (tres tablas)", `${API} (include anidado)`, async () =>
    (await db.calibracion.findMany({ include: { lote: { include: { grano: true } } }, orderBy: { id: "asc" } }))
      .map((c) => ({ id: c.id, codigoLote: c.lote.codigoLote, nombreCafe: c.lote.grano.nombreCafe, eyPorcentaje: c.eyPorcentaje }))],
  ["JN03", "Calibraciones con el molino y la máquina usados (misma tabla dos veces)", `${API} (include de dos relaciones)`, async () =>
    (await db.calibracion.findMany({ include: { molino: true, maquina: true }, orderBy: { id: "asc" } }))
      .map((c) => ({ id: c.id, molino: c.molino.identificadorLocal, maquina: c.maquina.identificadorLocal }))],
  ["JN04", "Todos los granos con sus lotes, aunque no tengan (LEFT JOIN)", `${API} (include)`, async () =>
    (await db.grano.findMany({ include: { lotes: { orderBy: { codigoLote: "asc" } } }, orderBy: { nombreCafe: "asc" } }))
      .flatMap((g): { nombreCafe: string; codigoLote: string | null }[] =>
        (g.lotes.length ? g.lotes.map((l) => ({ nombreCafe: g.nombreCafe, codigoLote: l.codigoLote })) : [{ nombreCafe: g.nombreCafe, codigoLote: null }]))],
  ["JN05", "Lotes que nunca se han calibrado (LEFT JOIN ... IS NULL)", `${API} (filtro de relación none)`, () =>
    db.lote.findMany({ where: { calibraciones: { none: {} } }, select: { codigoLote: true }, orderBy: { codigoLote: "asc" } })],
  ["JN06", "Calibraciones por molino, incluidos los molinos sin uso (RIGHT JOIN)", RAW, () => crudo(`
    SELECT e.identificador_local, c.id_calibracion
    FROM calibraciones c RIGHT JOIN equipos e ON e.id_equipo = c.id_molino
    WHERE e.tipo = 'molino' ORDER BY e.identificador_local, c.id_calibracion`)],
  ["JN07", "Lotes y notas de cata, aparezcan o no en la otra tabla (FULL OUTER JOIN)", RAW, () => crudo(`
    SELECT l.codigo_lote, n.descriptor
    FROM lotes l FULL OUTER JOIN notas_cata n ON n.id_lote = l.id_lote ORDER BY l.codigo_lote, n.descriptor`)],
  ["JN08", "Notas de cata con su lote y su café", `${API} (include + orden por relación)`, async () =>
    (await db.notaCata.findMany({ include: { lote: { include: { grano: true } } }, orderBy: [{ lote: { grano: { nombreCafe: "asc" } } }, { descriptor: "asc" }] }))
      .map((nc) => ({ descriptor: nc.descriptor, codigoLote: nc.lote.codigoLote, nombreCafe: nc.lote.grano.nombreCafe }))],
  ["JN09", "Calibraciones equilibradas de cafés lavados (JOIN con filtro)", `${API} (filtro sobre relación)`, async () =>
    (await db.calibracion.findMany({ where: { diagnostico: "EQUILIBRADA", lote: { grano: { proceso: "Lavado" } } }, include: { lote: { include: { grano: true } } }, orderBy: { id: "asc" } }))
      .map((c) => ({ id: c.id, nombreCafe: c.lote.grano.nombreCafe, eyPorcentaje: c.eyPorcentaje }))],
  ["JN10", "Pares de granos del mismo país (SELF JOIN)", RAW, () => crudo(`
    SELECT a.nombre_cafe AS grano_a, b.nombre_cafe AS grano_b, a.pais_origen
    FROM granos a JOIN granos b ON a.pais_origen = b.pais_origen AND a.id_grano < b.id_grano ORDER BY a.pais_origen`)],
  ["JN11", "Combinaciones posibles de molino y máquina (CROSS JOIN)", RAW, () => crudo(`
    SELECT m.identificador_local AS molino, q.identificador_local AS maquina
    FROM equipos m CROSS JOIN equipos q WHERE m.tipo = 'molino' AND q.tipo = 'maquina' ORDER BY molino, maquina`)],
  ["JN12", "Notas de cata con su lote (JOIN ... USING)", `${API} (include)`, async () =>
    (await db.notaCata.findMany({ include: { lote: true }, orderBy: [{ lote: { codigoLote: "asc" } }, { descriptor: "asc" }] }))
      .map((nc) => ({ codigoLote: nc.lote.codigoLote, descriptor: nc.descriptor }))],
  ["JN13", "Ficha completa de cada calibración (cinco tablas)", `${API} (include de cuatro relaciones)`, async () =>
    (await db.calibracion.findMany({ include: { lote: { include: { grano: true } }, molino: true, maquina: true }, orderBy: { id: "asc" } }))
      .map((c) => ({ id: c.id, nombreCafe: c.lote.grano.nombreCafe, codigoLote: c.lote.codigoLote, molino: `${c.molino.marca} ${c.molino.modelo}`,
        maquina: `${c.maquina.marca} ${c.maquina.modelo}`, ratio: c.ratioCalculado, diagnostico: c.diagnostico }))],
  ["JN14", "Cada lote con su calibración más reciente (LEFT JOIN LATERAL)", `${API} (include con orderBy + take 1)`, async () =>
    (await db.lote.findMany({ include: { calibraciones: { orderBy: { fechaHora: "desc" }, take: 1 } }, orderBy: { codigoLote: "asc" } }))
      .map((l) => ({ codigoLote: l.codigoLote, ultimaCalibracion: l.calibraciones[0]?.fechaHora ?? null, eyPorcentaje: l.calibraciones[0]?.eyPorcentaje ?? null }))],
  ["JN15", "Calibraciones hechas más de 30 días después del tueste (JOIN con condición no igual)", RAW, () => crudo(`
    SELECT l.codigo_lote, l.fecha_tueste, c.fecha_hora
    FROM lotes l JOIN calibraciones c ON c.id_lote = l.id_lote AND c.fecha_hora > l.fecha_tueste + INTERVAL '30 days'
    ORDER BY c.fecha_hora`)],

  // ===================== 5.3 FUNCIONES AGREGADAS =====================
  ["AG01", "Total de granos registrados (COUNT)", `${API} (count)`, async () => [{ totalGranos: await db.grano.count() }]],
  ["AG02", "Granos por proceso (COUNT + GROUP BY)", `${API} (groupBy)`, async () =>
    (await db.grano.groupBy({ by: ["proceso"], _count: { _all: true }, orderBy: [{ _count: { proceso: "desc" } }, { proceso: "asc" }] }))
      .map((g) => ({ proceso: g.proceso, granos: g._count._all }))],
  ["AG03", "Puntuación SCA promedio por país (AVG)", `${API} (groupBy + _avg)`, async () =>
    (await db.grano.groupBy({ by: ["paisOrigen"], _avg: { puntuacionSca: true }, orderBy: { _avg: { puntuacionSca: "desc" } } }))
      .map((g) => ({ paisOrigen: g.paisOrigen, scaPromedio: redondear(n(g._avg.puntuacionSca), 2) }))],
  ["AG04", "Puntuación SCA más alta y más baja (MAX / MIN)", `${API} (aggregate)`, async () => {
    const a = await db.grano.aggregate({ _max: { puntuacionSca: true }, _min: { puntuacionSca: true } });
    return [{ scaMaxima: a._max.puntuacionSca, scaMinima: a._min.puntuacionSca }];
  }],
  ["AG05", "Gramos en existencia de los lotes activos (SUM)", `${API} (aggregate + _sum)`, async () =>
    [{ gramosDisponibles: (await db.lote.aggregate({ where: { activo: true }, _sum: { pesoActualG: true } }))._sum.pesoActualG }]],
  ["AG06", "Calibraciones por diagnóstico", `${API} (groupBy)`, async () =>
    (await db.calibracion.groupBy({ by: ["diagnostico"], _count: { _all: true }, orderBy: { _count: { diagnostico: "desc" } } }))
      .map((g) => ({ diagnostico: g.diagnostico, calibraciones: g._count._all }))],
  ["AG07", "EY y sabor promedio de cada lote calibrado", `${API} (groupBy + _avg)`, async () => {
    const grupos = await db.calibracion.groupBy({ by: ["idLote"], _count: { _all: true }, _avg: { eyPorcentaje: true, calificacionSabor: true } });
    const codigos = new Map((await db.lote.findMany({ select: { id: true, codigoLote: true } })).map((l) => [l.id, l.codigoLote]));
    return grupos.map((g) => ({ codigoLote: codigos.get(g.idLote)!, calibraciones: g._count._all,
      eyPromedio: redondear(n(g._avg.eyPorcentaje), 2), saborPromedio: redondear(n(g._avg.calificacionSabor), 1) }))
      .sort((a, b) => a.codigoLote.localeCompare(b.codigoLote));
  }],
  ["AG08", "Lotes con más de una calibración (HAVING)", `${API} (groupBy + having)`, async () =>
    (await db.calibracion.groupBy({ by: ["idLote"], _count: { _all: true }, having: { id: { _count: { gt: 1 } } }, orderBy: [{ _count: { id: "desc" } }, { idLote: "asc" }] }))
      .map((g) => ({ idLote: g.idLote, calibraciones: g._count._all }))],
  ["AG09", "Número de baristas distintos (COUNT DISTINCT)", `${API} (findMany distinct)`, async () =>
    [{ baristas: (await db.calibracion.findMany({ distinct: ["baristaNombre"], select: { baristaNombre: true } })).length }]],
  ["AG10", "Calibraciones y sabor promedio por barista", `${API} (groupBy + _avg)`, async () =>
    (await db.calibracion.groupBy({ by: ["baristaNombre"], _count: { _all: true }, _avg: { calificacionSabor: true } }))
      .map((g) => ({ baristaNombre: g.baristaNombre, calibraciones: g._count._all, saborPromedio: redondear(n(g._avg.calificacionSabor), 1) }))
      .sort((a, b) => b.saborPromedio! - a.saborPromedio! || a.baristaNombre.localeCompare(b.baristaNombre))],
  ["AG11", "Veces que se usó cada molino, incluidos los que no (COUNT + LEFT JOIN)", `${API} (_count de relación)`, async () =>
    (await db.equipo.findMany({ where: { tipo: "molino" }, select: { identificadorLocal: true, _count: { select: { comoMolino: true } } } }))
      .map((e) => ({ identificadorLocal: e.identificadorLocal, usos: e._count.comoMolino }))
      .sort((a, b) => b.usos - a.usos || a.identificadorLocal.localeCompare(b.identificadorLocal))],
  ["AG12", "Notas de cata de cada lote en una sola línea (STRING_AGG)", RAW, () => crudo(`
    SELECT l.codigo_lote, STRING_AGG(n.descriptor, ', ' ORDER BY n.descriptor) AS notas
    FROM lotes l JOIN notas_cata n ON n.id_lote = l.id_lote GROUP BY l.codigo_lote ORDER BY l.codigo_lote`)],
  ["AG13", "Receta promedio por máquina: dosis, bebida y tiempo", `${API} (groupBy + _avg)`, async () => {
    const grupos = await db.calibracion.groupBy({ by: ["idMaquina"], _avg: { dosisInG: true, yieldOutG: true, tiempoSegundos: true } });
    const codigos = new Map((await db.equipo.findMany()).map((e) => [e.id, e.identificadorLocal]));
    return grupos.map((g) => ({ identificadorLocal: codigos.get(g.idMaquina)!, dosis: redondear(n(g._avg.dosisInG), 2),
      bebida: redondear(n(g._avg.yieldOutG), 2), tiempo: redondear(n(g._avg.tiempoSegundos), 1) }))
      .sort((a, b) => a.identificadorLocal.localeCompare(b.identificadorLocal));
  }],
  ["AG14", "Consumo por nivel de tueste: lotes, gramos iniciales, restantes y % consumido", `${API} (groupBy + _sum)`, async () =>
    (await db.lote.groupBy({ by: ["nivelTueste"], _count: { _all: true }, _sum: { pesoInicialG: true, pesoActualG: true }, orderBy: { nivelTueste: "asc" } }))
      .map((g) => ({ nivelTueste: g.nivelTueste, lotes: g._count._all, gramosIniciales: g._sum.pesoInicialG, gramosRestantes: g._sum.pesoActualG,
        porcentajeConsumido: redondear((1 - n(g._sum.pesoActualG)! / n(g._sum.pesoInicialG)!) * 100, 1) }))],
  ["AG15", "Calibraciones y EY promedio por mes (DATE_TRUNC)", RAW, () => crudo(`
    SELECT TO_CHAR(DATE_TRUNC('month', fecha_hora), 'YYYY-MM') AS mes, COUNT(*) AS calibraciones, ROUND(AVG(ey_porcentaje), 2) AS ey_promedio
    FROM calibraciones GROUP BY mes ORDER BY mes`)],

  // ===================== 5.4 VISTAS =====================
  ["VI01", "Vista v_ficha_calibracion: cada calibración con su café, lote y equipos", "$executeRaw (CREATE VIEW) + $queryRaw", async () => {
    await db.$executeRawUnsafe(`CREATE OR REPLACE VIEW v_ficha_calibracion AS
      SELECT c.id_calibracion, c.fecha_hora, g.nombre_cafe, l.codigo_lote,
             m.marca || ' ' || m.modelo AS molino, q.marca || ' ' || q.modelo AS maquina,
             c.dosis_in_g, c.yield_out_g, c.ratio_calculado, c.ey_porcentaje, c.diagnostico,
             c.calificacion_sabor, c.barista_nombre
      FROM calibraciones c
      JOIN lotes l ON l.id_lote = c.id_lote
      JOIN granos g ON g.id_grano = l.id_grano
      JOIN equipos m ON m.id_equipo = c.id_molino
      JOIN equipos q ON q.id_equipo = c.id_maquina`);
    return crudo("SELECT id_calibracion, nombre_cafe, codigo_lote, ratio_calculado, diagnostico FROM v_ficha_calibracion ORDER BY id_calibracion");
  }],
  ["VI02", "Vista v_existencia_lotes: porcentaje restante y estado de cada lote", "$executeRaw (CREATE VIEW) + $queryRaw", async () => {
    await db.$executeRawUnsafe(`CREATE OR REPLACE VIEW v_existencia_lotes AS
      SELECT l.codigo_lote, g.nombre_cafe, l.peso_actual_g, l.peso_inicial_g,
             ROUND(l.peso_actual_g / l.peso_inicial_g * 100, 1) AS porcentaje_restante,
             CASE WHEN l.peso_actual_g = 0 THEN 'Agotado'
                  WHEN l.peso_actual_g / l.peso_inicial_g < 0.2 THEN 'Queda poco'
                  ELSE 'Disponible' END AS estado
      FROM lotes l JOIN granos g ON g.id_grano = l.id_grano`);
    return crudo("SELECT * FROM v_existencia_lotes ORDER BY porcentaje_restante, codigo_lote");
  }],
  ["VI03", "Vista v_resumen_grano: lotes, calibraciones y resultados por café", "$executeRaw (CREATE VIEW) + $queryRaw", async () => {
    await db.$executeRawUnsafe(`CREATE OR REPLACE VIEW v_resumen_grano AS
      SELECT g.id_grano, g.nombre_cafe, g.puntuacion_sca,
             COUNT(DISTINCT l.id_lote) AS lotes, COUNT(c.id_calibracion) AS calibraciones,
             ROUND(AVG(c.ey_porcentaje), 2) AS ey_promedio, MAX(c.calificacion_sabor) AS mejor_sabor
      FROM granos g
      LEFT JOIN lotes l ON l.id_grano = g.id_grano
      LEFT JOIN calibraciones c ON c.id_lote = l.id_lote
      GROUP BY g.id_grano, g.nombre_cafe, g.puntuacion_sca`);
    return crudo("SELECT nombre_cafe, lotes, calibraciones, ey_promedio, mejor_sabor FROM v_resumen_grano ORDER BY id_grano");
  }],
  ["VI04", "Vista v_mejor_receta_lote: la calibración con mejor sabor de cada lote", "$executeRaw (CREATE VIEW) + $queryRaw", async () => {
    await db.$executeRawUnsafe(`CREATE OR REPLACE VIEW v_mejor_receta_lote AS
      SELECT DISTINCT ON (c.id_lote) c.id_lote, l.codigo_lote, c.id_calibracion, c.dosis_in_g, c.yield_out_g,
             c.tiempo_segundos, c.ajuste_molienda, c.calificacion_sabor
      FROM calibraciones c JOIN lotes l ON l.id_lote = c.id_lote
      ORDER BY c.id_lote, c.calificacion_sabor DESC, c.fecha_hora DESC`);
    return crudo("SELECT codigo_lote, id_calibracion, dosis_in_g, yield_out_g, calificacion_sabor FROM v_mejor_receta_lote ORDER BY codigo_lote");
  }],
  ["VI05", "Vista v_uso_equipos: cuántas veces se ha usado cada equipo", "$executeRaw (CREATE VIEW) + $queryRaw", async () => {
    await db.$executeRawUnsafe(`CREATE OR REPLACE VIEW v_uso_equipos AS
      SELECT e.identificador_local, e.tipo, e.marca || ' ' || e.modelo AS equipo,
             (SELECT COUNT(*) FROM calibraciones c WHERE c.id_molino = e.id_equipo OR c.id_maquina = e.id_equipo) AS usos
      FROM equipos e`);
    return crudo("SELECT * FROM v_uso_equipos ORDER BY usos DESC, identificador_local");
  }],

  // ===================== 5.5 FUNCIONES Y DISPARADORES =====================
  ["FN01", "Función fn_calcular_ey(tds, bebida, dosis): porcentaje de extracción", "$executeRaw (CREATE FUNCTION) + $queryRaw", async () => {
    await ejecutar(DDL_FUNCIONES.FN01);
    return crudo("SELECT id_calibracion, ey_porcentaje AS ey_guardado, fn_calcular_ey(tds_porcentaje, yield_out_g, dosis_in_g) AS ey_funcion FROM calibraciones ORDER BY id_calibracion");
  }],
  ["FN02", "Función fn_porcentaje_existencia(id_lote): cuánto queda de un lote", "$executeRaw (CREATE FUNCTION) + $queryRaw", async () => {
    await ejecutar(DDL_FUNCIONES.FN02);
    return crudo("SELECT codigo_lote, fn_porcentaje_existencia(id_lote) AS porcentaje FROM lotes ORDER BY codigo_lote");
  }],
  ["FN03", "Función fn_historial_lote(codigo): calibraciones de un lote como tabla", "$executeRaw (CREATE FUNCTION) + $queryRaw parametrizado", async () => {
    await ejecutar(DDL_FUNCIONES.FN03);
    const codigo = "LT-2026-001";
    return db.$queryRaw<Fila[]>`SELECT * FROM fn_historial_lote(${codigo})`;
  }],
  ["FN04", "Disparador trg_bitacora_existencia: registra cada cambio de peso de un lote", "$executeRaw (CREATE TRIGGER) + prueba con Prisma Client", async () => {
    await ejecutar(DDL_FUNCIONES.FN04);
    // Prueba: se usan 18 g del lote LT-2026-002 para un shot; el UPDATE lo hace Prisma Client.
    await db.lote.update({ where: { codigoLote: "LT-2026-002" }, data: { pesoActualG: { decrement: 18 } } });
    return crudo("SELECT b.id_lote, b.peso_anterior, b.peso_nuevo, b.diferencia FROM bitacora_existencia b ORDER BY b.id_bitacora");
  }],
  ["FN05", "Disparador trg_desactivar_lote_agotado: un lote sin existencia pasa a inactivo", "$executeRaw (CREATE TRIGGER) + prueba con Prisma Client", async () => {
    await ejecutar(DDL_FUNCIONES.FN05);
    // Prueba: se termina el lote LT-2026-006; Prisma no envía "activo", lo cambia el disparador.
    await db.lote.update({ where: { codigoLote: "LT-2026-006" }, data: { pesoActualG: 0 } });
    return db.lote.findMany({ where: { codigoLote: "LT-2026-006" }, select: { codigoLote: true, pesoActualG: true, activo: true } });
  }],
];

for (const [id, titulo, forma, correr] of pasos) imprimir(id, titulo, forma, await correr());
guardar();
await db.$disconnect();

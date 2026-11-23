// Unidad 5 · Utilidades compartidas por unidad5-prisma.ts y unidad5-knex.mjs:
// imprime cada resultado como tabla de texto, guarda la salida completa y el número
// de filas de cada sentencia para compararlo con la ejecución en consola.
import fs from "node:fs";

const DOCS = new URL("../../../docs/unidad5/", import.meta.url);

// Texto que se muestra para cada tipo de valor (Decimal de Prisma, BigInt, fechas, nulos).
function texto(v) {
  if (v === null || v === undefined) return "(nulo)";
  if (typeof v === "bigint") return v.toString();
  if (v instanceof Date) return v.toISOString().replace("T", " ").replace(/\.000Z$|Z$/, "");
  if (typeof v === "object" && typeof v.toFixed === "function") return v.toString(); // Prisma.Decimal
  if (typeof v === "boolean") return v ? "t" : "f";
  return String(v);
}

export function crearSalida(nombre) {
  const lineas = [];
  const conteos = {};
  const log = (l = "") => { lineas.push(l); console.log(l); };

  function imprimir(id, titulo, forma, filas) {
    conteos[id] = filas.length;
    log(`[${id}] ${titulo}`);
    log(`    forma: ${forma}`);
    if (filas.length) {
      const cols = Object.keys(filas[0]);
      const datos = filas.map((f) => cols.map((c) => texto(f[c])));
      const ancho = cols.map((c, i) => Math.min(40, Math.max(c.length, ...datos.map((d) => d[i].length))));
      const fila = (vals) => " " + vals.map((v, i) => v.slice(0, 40).padEnd(ancho[i])).join(" | ");
      log(fila(cols));
      log("-" + ancho.map((a) => "-".repeat(a)).join("-+-") + "-");
      datos.forEach((d) => log(fila(d)));
    }
    log(`(${filas.length} ${filas.length === 1 ? "fila" : "filas"})`);
    log();
  }

  function guardar() {
    fs.writeFileSync(new URL(`salida_${nombre}.txt`, DOCS), lineas.join("\n") + "\n");
    fs.writeFileSync(new URL(`conteos_${nombre}.json`, DOCS), JSON.stringify(conteos, null, 2) + "\n");
    log(`Salida guardada en docs/unidad5/salida_${nombre}.txt (${Object.keys(conteos).length} sentencias)`);
  }

  return { imprimir, guardar, log };
}

// 5.5 · Funciones y disparadores. Ningún framework tiene un constructor para PL/pgSQL,
// así que las dos versiones envían este mismo DDL (el de docs/unidad5/consola_unidad5.sql).
// Cada entrada es una lista de sentencias porque los drivers ejecutan una a la vez.
export const DDL_FUNCIONES = {
  FN01: [`CREATE OR REPLACE FUNCTION fn_calcular_ey(tds NUMERIC, bebida NUMERIC, dosis NUMERIC)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT ROUND(tds * bebida / dosis, 2);
$$`],
  FN02: [`CREATE OR REPLACE FUNCTION fn_porcentaje_existencia(p_id_lote INT)
RETURNS NUMERIC LANGUAGE plpgsql STABLE AS $$
DECLARE
  resultado NUMERIC;
BEGIN
  SELECT ROUND(peso_actual_g / peso_inicial_g * 100, 1) INTO resultado FROM lotes WHERE id_lote = p_id_lote;
  IF resultado IS NULL THEN
    RAISE EXCEPTION 'No existe el lote %', p_id_lote;
  END IF;
  RETURN resultado;
END;
$$`],
  FN03: [`CREATE OR REPLACE FUNCTION fn_historial_lote(p_codigo VARCHAR)
RETURNS TABLE (id_calibracion INT, fecha_hora TIMESTAMP, ey_porcentaje NUMERIC, diagnostico VARCHAR, calificacion_sabor NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT c.id_calibracion, c.fecha_hora, c.ey_porcentaje, c.diagnostico, c.calificacion_sabor
  FROM calibraciones c JOIN lotes l ON l.id_lote = c.id_lote
  WHERE l.codigo_lote = p_codigo ORDER BY c.fecha_hora;
$$`],
  FN04: [
    `CREATE TABLE IF NOT EXISTS bitacora_existencia (
  id_bitacora   SERIAL PRIMARY KEY,
  id_lote       INT NOT NULL REFERENCES lotes (id_lote),
  peso_anterior DECIMAL(10,2) NOT NULL,
  peso_nuevo    DECIMAL(10,2) NOT NULL,
  diferencia    DECIMAL(10,2) NOT NULL,
  fecha         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
    `CREATE OR REPLACE FUNCTION fn_bitacora_existencia() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO bitacora_existencia (id_lote, peso_anterior, peso_nuevo, diferencia)
  VALUES (NEW.id_lote, OLD.peso_actual_g, NEW.peso_actual_g, NEW.peso_actual_g - OLD.peso_actual_g);
  RETURN NEW;
END;
$$`,
    `DROP TRIGGER IF EXISTS trg_bitacora_existencia ON lotes`,
    `CREATE TRIGGER trg_bitacora_existencia
AFTER UPDATE OF peso_actual_g ON lotes
FOR EACH ROW WHEN (OLD.peso_actual_g IS DISTINCT FROM NEW.peso_actual_g)
EXECUTE FUNCTION fn_bitacora_existencia()`,
  ],
  FN05: [
    `CREATE OR REPLACE FUNCTION fn_desactivar_lote_agotado() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.peso_actual_g = 0 THEN
    NEW.activo := FALSE;
  END IF;
  RETURN NEW;
END;
$$`,
    `DROP TRIGGER IF EXISTS trg_desactivar_lote_agotado ON lotes`,
    `CREATE TRIGGER trg_desactivar_lote_agotado
BEFORE UPDATE OF peso_actual_g ON lotes
FOR EACH ROW EXECUTE FUNCTION fn_desactivar_lote_agotado()`,
  ],
};

// Convierte una URL de conexión para apuntar a otra base del mismo servidor.
export const conBase = (url, base) => url.replace(/\/[^/?]+(\?|$)/, `/${base}$1`);

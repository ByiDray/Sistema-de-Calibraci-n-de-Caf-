-- =====================================================================
-- Unidad 5 · Modo consola (psql) · App BD Café
-- 5.1 25 consultas simples, 5.2 15 operaciones JOIN, 5.3 15 funciones agregadas,
-- 5.4 5 vistas y 5.5 5 funciones y disparadores.
--
-- Se ejecuta sobre cafe_u5_consola, una copia de la base "cafe" de la app
-- (ver preparar_bases.ps1), para no tocar los datos reales:
--   psql -h localhost -U postgres -d cafe_u5_consola -f docs/unidad5/consola_unidad5.sql
-- Cada sentencia lleva un identificador [XX00] que también usan los scripts
-- de Prisma y Knex, para comparar los resultados de las tres formas.
-- =====================================================================
\set QUIET on
\pset footer on
\pset null '(nulo)'
\set ON_ERROR_STOP on
\set QUIET off

-- ===================== 5.1 CONSULTAS SIMPLES (25) =====================

\echo '[CS01] Todos los granos ordenados por nombre'
SELECT * FROM granos ORDER BY nombre_cafe;

\echo '[CS02] Proyección: nombre, país y puntuación SCA'
SELECT nombre_cafe, pais_origen, puntuacion_sca FROM granos ORDER BY id_grano;

\echo '[CS03] Granos de proceso Natural'
SELECT nombre_cafe, pais_origen FROM granos WHERE proceso = 'Natural' ORDER BY nombre_cafe;

\echo '[CS04] Granos con puntuación SCA de 88 o más'
SELECT nombre_cafe, puntuacion_sca FROM granos WHERE puntuacion_sca >= 88 ORDER BY puntuacion_sca DESC;

\echo '[CS05] Granos con SCA entre 85 y 88 (BETWEEN)'
SELECT nombre_cafe, puntuacion_sca FROM granos WHERE puntuacion_sca BETWEEN 85 AND 88 ORDER BY puntuacion_sca;

\echo '[CS06] Granos de México, Colombia o Perú (IN)'
SELECT nombre_cafe, pais_origen FROM granos WHERE pais_origen IN ('México', 'Colombia', 'Perú') ORDER BY pais_origen, nombre_cafe;

\echo '[CS07] Granos cuyo nombre contiene "natural" sin importar mayúsculas (ILIKE)'
SELECT nombre_cafe, proceso FROM granos WHERE nombre_cafe ILIKE '%natural%' ORDER BY nombre_cafe;

\echo '[CS08] Calibraciones sin notas del barista (IS NULL)'
SELECT id_calibracion, barista_nombre, fecha_hora FROM calibraciones WHERE notas_barista IS NULL ORDER BY id_calibracion;

\echo '[CS09] Los 3 granos con mejor puntuación (ORDER BY + LIMIT)'
SELECT nombre_cafe, puntuacion_sca FROM granos ORDER BY puntuacion_sca DESC LIMIT 3;

\echo '[CS10] Países de origen distintos (DISTINCT)'
SELECT DISTINCT pais_origen FROM granos ORDER BY pais_origen;

\echo '[CS11] Porcentaje de existencia que queda en cada lote (expresión con alias)'
SELECT codigo_lote, peso_actual_g, peso_inicial_g,
       ROUND(peso_actual_g / peso_inicial_g * 100, 1) AS porcentaje_restante
FROM lotes ORDER BY porcentaje_restante DESC, codigo_lote;

\echo '[CS12] Lotes activos de tueste Medio u Oscuro (AND / OR)'
SELECT codigo_lote, nivel_tueste FROM lotes
WHERE activo = TRUE AND (nivel_tueste = 'Medio' OR nivel_tueste = 'Oscuro') ORDER BY codigo_lote;

\echo '[CS13] Equipos que no son molino (NOT)'
SELECT identificador_local, marca, modelo FROM equipos WHERE NOT tipo = 'molino' ORDER BY identificador_local;

\echo '[CS14] Lotes tostados del 1 de octubre de 2026 en adelante (fechas)'
SELECT codigo_lote, fecha_tueste FROM lotes WHERE fecha_tueste >= DATE '2026-10-01' ORDER BY fecha_tueste;

\echo '[CS15] Calibraciones hechas por la tarde, de 15:00 en adelante (EXTRACT)'
SELECT id_calibracion, fecha_hora, EXTRACT(HOUR FROM fecha_hora) AS hora
FROM calibraciones WHERE EXTRACT(HOUR FROM fecha_hora) >= 15 ORDER BY fecha_hora;

\echo '[CS16] Clasificación de cada grano según su SCA (CASE)'
SELECT nombre_cafe, puntuacion_sca,
       CASE WHEN puntuacion_sca >= 90 THEN 'Excepcional'
            WHEN puntuacion_sca >= 85 THEN 'Excelente'
            ELSE 'Muy bueno' END AS clasificacion
FROM granos ORDER BY puntuacion_sca DESC;

\echo '[CS17] Calibraciones sobreextraídas'
SELECT id_calibracion, ey_porcentaje, barista_nombre FROM calibraciones WHERE diagnostico = 'SOBREEXTRAIDA' ORDER BY ey_porcentaje DESC;

\echo '[CS18] Calibraciones en el rango ideal de EY (18 a 22 %), mejor sabor primero'
SELECT id_calibracion, ey_porcentaje, calificacion_sabor FROM calibraciones
WHERE ey_porcentaje BETWEEN 18 AND 22 ORDER BY calificacion_sabor DESC, id_calibracion;

\echo '[CS19] Segunda página de calibraciones, 5 por página (LIMIT / OFFSET)'
SELECT id_calibracion, fecha_hora, barista_nombre FROM calibraciones ORDER BY fecha_hora LIMIT 5 OFFSET 5;

\echo '[CS20] Lotes inactivos'
SELECT codigo_lote, peso_actual_g FROM lotes WHERE activo = FALSE ORDER BY codigo_lote;

\echo '[CS21] Nombre completo de cada equipo en mayúsculas (funciones de texto)'
SELECT identificador_local, UPPER(marca || ' ' || modelo) AS equipo, LENGTH(modelo) AS largo_modelo
FROM equipos ORDER BY identificador_local;

\echo '[CS22] Granos con finca registrada, ordenados por región'
SELECT nombre_cafe, finca, region FROM granos WHERE finca IS NOT NULL ORDER BY region NULLS LAST, nombre_cafe;

\echo '[CS23] Notas de cata que mencionan chocolate'
SELECT id_lote, descriptor FROM notas_cata WHERE descriptor ILIKE '%chocolate%' ORDER BY id_nota;

\echo '[CS24] Notas del barista, o "Sin notas" si no hay (COALESCE)'
SELECT id_calibracion, COALESCE(notas_barista, 'Sin notas') AS notas FROM calibraciones ORDER BY id_calibracion;

\echo '[CS25] Extracciones de 25 a 30 segundos a 9 bar'
SELECT id_calibracion, tiempo_segundos, presion_bar FROM calibraciones
WHERE tiempo_segundos BETWEEN 25 AND 30 AND presion_bar = 9 ORDER BY id_calibracion;


-- ===================== 5.2 OPERACIONES JOIN (15) =====================

\echo '[JN01] Cada lote con el nombre de su café (INNER JOIN)'
SELECT l.codigo_lote, g.nombre_cafe, l.tostaduria
FROM lotes l INNER JOIN granos g ON g.id_grano = l.id_grano ORDER BY l.codigo_lote;

\echo '[JN02] Calibraciones con su lote y su café (tres tablas)'
SELECT c.id_calibracion, l.codigo_lote, g.nombre_cafe, c.ey_porcentaje
FROM calibraciones c
JOIN lotes l ON l.id_lote = c.id_lote
JOIN granos g ON g.id_grano = l.id_grano ORDER BY c.id_calibracion;

\echo '[JN03] Calibraciones con el molino y la máquina usados (misma tabla dos veces)'
SELECT c.id_calibracion, m.identificador_local AS molino, q.identificador_local AS maquina
FROM calibraciones c
JOIN equipos m ON m.id_equipo = c.id_molino
JOIN equipos q ON q.id_equipo = c.id_maquina ORDER BY c.id_calibracion;

\echo '[JN04] Todos los granos con sus lotes, aunque no tengan (LEFT JOIN)'
SELECT g.nombre_cafe, l.codigo_lote
FROM granos g LEFT JOIN lotes l ON l.id_grano = g.id_grano ORDER BY g.nombre_cafe, l.codigo_lote;

\echo '[JN05] Lotes que nunca se han calibrado (LEFT JOIN ... IS NULL)'
SELECT l.codigo_lote
FROM lotes l LEFT JOIN calibraciones c ON c.id_lote = l.id_lote
WHERE c.id_calibracion IS NULL ORDER BY l.codigo_lote;

\echo '[JN06] Calibraciones por molino, incluidos los molinos sin uso (RIGHT JOIN)'
SELECT e.identificador_local, c.id_calibracion
FROM calibraciones c RIGHT JOIN equipos e ON e.id_equipo = c.id_molino
WHERE e.tipo = 'molino' ORDER BY e.identificador_local, c.id_calibracion;

\echo '[JN07] Lotes y notas de cata, aparezcan o no en la otra tabla (FULL OUTER JOIN)'
SELECT l.codigo_lote, n.descriptor
FROM lotes l FULL OUTER JOIN notas_cata n ON n.id_lote = l.id_lote ORDER BY l.codigo_lote, n.descriptor;

\echo '[JN08] Notas de cata con su lote y su café'
SELECT n.descriptor, l.codigo_lote, g.nombre_cafe
FROM notas_cata n
JOIN lotes l ON l.id_lote = n.id_lote
JOIN granos g ON g.id_grano = l.id_grano ORDER BY g.nombre_cafe, n.descriptor;

\echo '[JN09] Calibraciones equilibradas de cafés lavados (JOIN con filtro)'
SELECT c.id_calibracion, g.nombre_cafe, c.ey_porcentaje
FROM calibraciones c
JOIN lotes l ON l.id_lote = c.id_lote
JOIN granos g ON g.id_grano = l.id_grano
WHERE g.proceso = 'Lavado' AND c.diagnostico = 'EQUILIBRADA' ORDER BY c.id_calibracion;

\echo '[JN10] Pares de granos del mismo país (SELF JOIN)'
SELECT a.nombre_cafe AS grano_a, b.nombre_cafe AS grano_b, a.pais_origen
FROM granos a JOIN granos b ON a.pais_origen = b.pais_origen AND a.id_grano < b.id_grano
ORDER BY a.pais_origen;

\echo '[JN11] Combinaciones posibles de molino y máquina (CROSS JOIN)'
SELECT m.identificador_local AS molino, q.identificador_local AS maquina
FROM equipos m CROSS JOIN equipos q
WHERE m.tipo = 'molino' AND q.tipo = 'maquina' ORDER BY molino, maquina;

\echo '[JN12] Notas de cata con su lote (JOIN ... USING)'
SELECT codigo_lote, descriptor
FROM notas_cata JOIN lotes USING (id_lote) ORDER BY codigo_lote, descriptor;

\echo '[JN13] Ficha completa de cada calibración (cinco tablas)'
SELECT c.id_calibracion, g.nombre_cafe, l.codigo_lote, m.marca || ' ' || m.modelo AS molino,
       q.marca || ' ' || q.modelo AS maquina, c.ratio_calculado, c.diagnostico
FROM calibraciones c
JOIN lotes l ON l.id_lote = c.id_lote
JOIN granos g ON g.id_grano = l.id_grano
JOIN equipos m ON m.id_equipo = c.id_molino
JOIN equipos q ON q.id_equipo = c.id_maquina ORDER BY c.id_calibracion;

\echo '[JN14] Cada lote con su calibración más reciente (LEFT JOIN LATERAL)'
SELECT l.codigo_lote, u.fecha_hora AS ultima_calibracion, u.ey_porcentaje
FROM lotes l
LEFT JOIN LATERAL (
  SELECT c.fecha_hora, c.ey_porcentaje FROM calibraciones c
  WHERE c.id_lote = l.id_lote ORDER BY c.fecha_hora DESC LIMIT 1
) u ON TRUE ORDER BY l.codigo_lote;

\echo '[JN15] Calibraciones hechas más de 30 días después del tueste (JOIN con condición no igual)'
SELECT l.codigo_lote, l.fecha_tueste, c.fecha_hora
FROM lotes l
JOIN calibraciones c ON c.id_lote = l.id_lote AND c.fecha_hora > l.fecha_tueste + INTERVAL '30 days'
ORDER BY c.fecha_hora;


-- ===================== 5.3 FUNCIONES AGREGADAS (15) =====================

\echo '[AG01] Total de granos registrados (COUNT)'
SELECT COUNT(*) AS total_granos FROM granos;

\echo '[AG02] Granos por proceso (COUNT + GROUP BY)'
SELECT proceso, COUNT(*) AS granos FROM granos GROUP BY proceso ORDER BY granos DESC, proceso;

\echo '[AG03] Puntuación SCA promedio por país (AVG)'
SELECT pais_origen, ROUND(AVG(puntuacion_sca), 2) AS sca_promedio FROM granos GROUP BY pais_origen ORDER BY sca_promedio DESC;

\echo '[AG04] Puntuación SCA más alta y más baja (MAX / MIN)'
SELECT MAX(puntuacion_sca) AS sca_maxima, MIN(puntuacion_sca) AS sca_minima FROM granos;

\echo '[AG05] Gramos en existencia de los lotes activos (SUM)'
SELECT SUM(peso_actual_g) AS gramos_disponibles FROM lotes WHERE activo = TRUE;

\echo '[AG06] Calibraciones por diagnóstico'
SELECT diagnostico, COUNT(*) AS calibraciones FROM calibraciones GROUP BY diagnostico ORDER BY calibraciones DESC;

\echo '[AG07] EY y sabor promedio de cada lote calibrado'
SELECT l.codigo_lote, COUNT(*) AS calibraciones, ROUND(AVG(c.ey_porcentaje), 2) AS ey_promedio,
       ROUND(AVG(c.calificacion_sabor), 1) AS sabor_promedio
FROM calibraciones c JOIN lotes l ON l.id_lote = c.id_lote GROUP BY l.codigo_lote ORDER BY l.codigo_lote;

\echo '[AG08] Lotes con más de una calibración (HAVING)'
SELECT id_lote, COUNT(*) AS calibraciones FROM calibraciones GROUP BY id_lote HAVING COUNT(*) > 1 ORDER BY calibraciones DESC, id_lote;

\echo '[AG09] Número de baristas distintos (COUNT DISTINCT)'
SELECT COUNT(DISTINCT barista_nombre) AS baristas FROM calibraciones;

\echo '[AG10] Calibraciones y sabor promedio por barista'
SELECT barista_nombre, COUNT(*) AS calibraciones, ROUND(AVG(calificacion_sabor), 1) AS sabor_promedio
FROM calibraciones GROUP BY barista_nombre ORDER BY sabor_promedio DESC, barista_nombre;

\echo '[AG11] Veces que se usó cada molino, incluidos los que no (COUNT + LEFT JOIN)'
SELECT e.identificador_local, COUNT(c.id_calibracion) AS usos
FROM equipos e LEFT JOIN calibraciones c ON c.id_molino = e.id_equipo
WHERE e.tipo = 'molino' GROUP BY e.identificador_local ORDER BY usos DESC, e.identificador_local;

\echo '[AG12] Notas de cata de cada lote en una sola línea (STRING_AGG)'
SELECT l.codigo_lote, STRING_AGG(n.descriptor, ', ' ORDER BY n.descriptor) AS notas
FROM lotes l JOIN notas_cata n ON n.id_lote = l.id_lote GROUP BY l.codigo_lote ORDER BY l.codigo_lote;

\echo '[AG13] Receta promedio por máquina: dosis, bebida y tiempo'
SELECT e.identificador_local, ROUND(AVG(c.dosis_in_g), 2) AS dosis, ROUND(AVG(c.yield_out_g), 2) AS bebida,
       ROUND(AVG(c.tiempo_segundos), 1) AS tiempo
FROM calibraciones c JOIN equipos e ON e.id_equipo = c.id_maquina GROUP BY e.identificador_local ORDER BY e.identificador_local;

\echo '[AG14] Consumo por nivel de tueste: lotes, gramos iniciales, restantes y % consumido'
SELECT nivel_tueste, COUNT(*) AS lotes, SUM(peso_inicial_g) AS gramos_iniciales, SUM(peso_actual_g) AS gramos_restantes,
       ROUND((1 - SUM(peso_actual_g) / SUM(peso_inicial_g)) * 100, 1) AS porcentaje_consumido
FROM lotes GROUP BY nivel_tueste ORDER BY nivel_tueste;

\echo '[AG15] Calibraciones y EY promedio por mes (DATE_TRUNC)'
SELECT TO_CHAR(DATE_TRUNC('month', fecha_hora), 'YYYY-MM') AS mes, COUNT(*) AS calibraciones,
       ROUND(AVG(ey_porcentaje), 2) AS ey_promedio
FROM calibraciones GROUP BY mes ORDER BY mes;


-- ===================== 5.4 VISTAS (5) =====================

\echo '[VI01] Vista v_ficha_calibracion: cada calibración con su café, lote y equipos'
CREATE OR REPLACE VIEW v_ficha_calibracion AS
SELECT c.id_calibracion, c.fecha_hora, g.nombre_cafe, l.codigo_lote,
       m.marca || ' ' || m.modelo AS molino, q.marca || ' ' || q.modelo AS maquina,
       c.dosis_in_g, c.yield_out_g, c.ratio_calculado, c.ey_porcentaje, c.diagnostico,
       c.calificacion_sabor, c.barista_nombre
FROM calibraciones c
JOIN lotes l ON l.id_lote = c.id_lote
JOIN granos g ON g.id_grano = l.id_grano
JOIN equipos m ON m.id_equipo = c.id_molino
JOIN equipos q ON q.id_equipo = c.id_maquina;
SELECT id_calibracion, nombre_cafe, codigo_lote, ratio_calculado, diagnostico FROM v_ficha_calibracion ORDER BY id_calibracion;

\echo '[VI02] Vista v_existencia_lotes: porcentaje restante y estado de cada lote'
CREATE OR REPLACE VIEW v_existencia_lotes AS
SELECT l.codigo_lote, g.nombre_cafe, l.peso_actual_g, l.peso_inicial_g,
       ROUND(l.peso_actual_g / l.peso_inicial_g * 100, 1) AS porcentaje_restante,
       CASE WHEN l.peso_actual_g = 0 THEN 'Agotado'
            WHEN l.peso_actual_g / l.peso_inicial_g < 0.2 THEN 'Queda poco'
            ELSE 'Disponible' END AS estado
FROM lotes l JOIN granos g ON g.id_grano = l.id_grano;
SELECT * FROM v_existencia_lotes ORDER BY porcentaje_restante, codigo_lote;

\echo '[VI03] Vista v_resumen_grano: lotes, calibraciones y resultados por café'
CREATE OR REPLACE VIEW v_resumen_grano AS
SELECT g.id_grano, g.nombre_cafe, g.puntuacion_sca,
       COUNT(DISTINCT l.id_lote) AS lotes,
       COUNT(c.id_calibracion) AS calibraciones,
       ROUND(AVG(c.ey_porcentaje), 2) AS ey_promedio,
       MAX(c.calificacion_sabor) AS mejor_sabor
FROM granos g
LEFT JOIN lotes l ON l.id_grano = g.id_grano
LEFT JOIN calibraciones c ON c.id_lote = l.id_lote
GROUP BY g.id_grano, g.nombre_cafe, g.puntuacion_sca;
SELECT nombre_cafe, lotes, calibraciones, ey_promedio, mejor_sabor FROM v_resumen_grano ORDER BY id_grano;

\echo '[VI04] Vista v_mejor_receta_lote: la calibración con mejor sabor de cada lote'
CREATE OR REPLACE VIEW v_mejor_receta_lote AS
SELECT DISTINCT ON (c.id_lote) c.id_lote, l.codigo_lote, c.id_calibracion, c.dosis_in_g, c.yield_out_g,
       c.tiempo_segundos, c.ajuste_molienda, c.calificacion_sabor
FROM calibraciones c JOIN lotes l ON l.id_lote = c.id_lote
ORDER BY c.id_lote, c.calificacion_sabor DESC, c.fecha_hora DESC;
SELECT codigo_lote, id_calibracion, dosis_in_g, yield_out_g, calificacion_sabor FROM v_mejor_receta_lote ORDER BY codigo_lote;

\echo '[VI05] Vista v_uso_equipos: cuántas veces se ha usado cada equipo'
CREATE OR REPLACE VIEW v_uso_equipos AS
SELECT e.identificador_local, e.tipo, e.marca || ' ' || e.modelo AS equipo,
       (SELECT COUNT(*) FROM calibraciones c WHERE c.id_molino = e.id_equipo OR c.id_maquina = e.id_equipo) AS usos
FROM equipos e;
SELECT * FROM v_uso_equipos ORDER BY usos DESC, identificador_local;


-- ===================== 5.5 FUNCIONES Y DISPARADORES (5) =====================

\echo '[FN01] Función fn_calcular_ey(tds, bebida, dosis): porcentaje de extracción'
CREATE OR REPLACE FUNCTION fn_calcular_ey(tds NUMERIC, bebida NUMERIC, dosis NUMERIC)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT ROUND(tds * bebida / dosis, 2);
$$;
SELECT id_calibracion, ey_porcentaje AS ey_guardado,
       fn_calcular_ey(tds_porcentaje, yield_out_g, dosis_in_g) AS ey_funcion
FROM calibraciones ORDER BY id_calibracion;

\echo '[FN02] Función fn_porcentaje_existencia(id_lote): cuánto queda de un lote'
CREATE OR REPLACE FUNCTION fn_porcentaje_existencia(p_id_lote INT)
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
$$;
SELECT codigo_lote, fn_porcentaje_existencia(id_lote) AS porcentaje FROM lotes ORDER BY codigo_lote;

\echo '[FN03] Función fn_historial_lote(codigo): calibraciones de un lote como tabla'
CREATE OR REPLACE FUNCTION fn_historial_lote(p_codigo VARCHAR)
RETURNS TABLE (id_calibracion INT, fecha_hora TIMESTAMP, ey_porcentaje NUMERIC, diagnostico VARCHAR, calificacion_sabor NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT c.id_calibracion, c.fecha_hora, c.ey_porcentaje, c.diagnostico, c.calificacion_sabor
  FROM calibraciones c JOIN lotes l ON l.id_lote = c.id_lote
  WHERE l.codigo_lote = p_codigo ORDER BY c.fecha_hora;
$$;
SELECT * FROM fn_historial_lote('LT-2026-001');

\echo '[FN04] Disparador trg_bitacora_existencia: registra cada cambio de peso de un lote'
CREATE TABLE IF NOT EXISTS bitacora_existencia (
  id_bitacora   SERIAL PRIMARY KEY,
  id_lote       INT NOT NULL REFERENCES lotes (id_lote),
  peso_anterior DECIMAL(10,2) NOT NULL,
  peso_nuevo    DECIMAL(10,2) NOT NULL,
  diferencia    DECIMAL(10,2) NOT NULL,
  fecha         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE OR REPLACE FUNCTION fn_bitacora_existencia() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO bitacora_existencia (id_lote, peso_anterior, peso_nuevo, diferencia)
  VALUES (NEW.id_lote, OLD.peso_actual_g, NEW.peso_actual_g, NEW.peso_actual_g - OLD.peso_actual_g);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_bitacora_existencia ON lotes;
CREATE TRIGGER trg_bitacora_existencia
AFTER UPDATE OF peso_actual_g ON lotes
FOR EACH ROW WHEN (OLD.peso_actual_g IS DISTINCT FROM NEW.peso_actual_g)
EXECUTE FUNCTION fn_bitacora_existencia();
-- Prueba: se usan 18 g del lote LT-2026-002 para un shot.
UPDATE lotes SET peso_actual_g = peso_actual_g - 18 WHERE codigo_lote = 'LT-2026-002';
SELECT b.id_lote, b.peso_anterior, b.peso_nuevo, b.diferencia FROM bitacora_existencia b ORDER BY b.id_bitacora;

\echo '[FN05] Disparador trg_desactivar_lote_agotado: un lote sin existencia pasa a inactivo'
CREATE OR REPLACE FUNCTION fn_desactivar_lote_agotado() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.peso_actual_g = 0 THEN
    NEW.activo := FALSE;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_desactivar_lote_agotado ON lotes;
CREATE TRIGGER trg_desactivar_lote_agotado
BEFORE UPDATE OF peso_actual_g ON lotes
FOR EACH ROW EXECUTE FUNCTION fn_desactivar_lote_agotado();
-- Prueba: se termina el lote LT-2026-006 (le quedaban 180 g).
UPDATE lotes SET peso_actual_g = 0 WHERE codigo_lote = 'LT-2026-006';
SELECT codigo_lote, peso_actual_g, activo FROM lotes WHERE codigo_lote = 'LT-2026-006';

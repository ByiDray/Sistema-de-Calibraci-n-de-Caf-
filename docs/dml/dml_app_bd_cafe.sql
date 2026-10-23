-- =====================================================================
-- Actividad 3.2: Manipulación de datos (DML) · App BD Café
-- Base de datos: PostgreSQL 18, base "cafe" (tablas creadas por Prisma)
-- 25 consultas de actualización, 25 simples y 25 complejas.
-- =====================================================================


-- =====================================================================
-- PARTE A. 25 CONSULTAS DE ACTUALIZACIÓN (INSERT, UPDATE, DELETE)
-- Se ejecutan dentro de una transacción. Al final, ROLLBACK deshace
-- todo para no alterar los datos. Cambia ROLLBACK por COMMIT para guardar.
-- Solo modifican registros que el propio script crea (no tocan el seed).
-- =====================================================================
BEGIN;

-- [A01] INSERT: registrar un grano nuevo
INSERT INTO granos (nombre_cafe, finca, productor, pais_origen, region, varietal, proceso, puntuacion_sca)
VALUES ('Oaxaca Pluma Hidalgo', 'Finca Monte Alegre', 'Familia Cruz', 'México', 'Pluma Hidalgo', 'Pluma', 'Lavado', 85.75)
RETURNING id_grano, nombre_cafe, fecha_creacion;

-- [A02] INSERT de varias filas: dos granos en una sola sentencia
INSERT INTO granos (nombre_cafe, finca, productor, pais_origen, region, varietal, proceso, puntuacion_sca)
VALUES ('Guji Anaeróbico', 'Hambela', 'Cooperativa Guji', 'Etiopía', 'Guji', 'Heirloom', 'Anaeróbico', 88.25),
       ('Bourbon Rosado', 'Finca La Loma', 'Familia Ortiz', 'Colombia', 'Huila', 'Bourbon Rosado', 'Natural', 86.00)
RETURNING id_grano, nombre_cafe, proceso;

-- [A03] INSERT ... SELECT: lote nuevo buscando el grano por nombre (sin escribir su id)
INSERT INTO lotes (id_grano, codigo_lote, tostaduria, fecha_tueste, nivel_tueste, peso_inicial_g, peso_actual_g, activo)
SELECT id_grano, 'LT-2026-101', 'Tostaduría Local', DATE '2026-10-15', 'Medio', 1000, 1000, true
FROM granos
WHERE nombre_cafe = 'Oaxaca Pluma Hidalgo'
RETURNING id_lote, codigo_lote, peso_actual_g;

-- [A04] INSERT ... SELECT: segundo lote, del grano Guji
INSERT INTO lotes (id_grano, codigo_lote, tostaduria, fecha_tueste, nivel_tueste, peso_inicial_g, peso_actual_g, activo)
SELECT id_grano, 'LT-2026-102', 'Tostaduría Norte', DATE '2026-10-16', 'Claro', 500, 500, true
FROM granos
WHERE nombre_cafe = 'Guji Anaeróbico'
RETURNING id_lote, codigo_lote, nivel_tueste;

-- [A05] INSERT de varias filas: un molino y una máquina nuevos
INSERT INTO equipos (tipo, marca, modelo, identificador_local)
VALUES ('molino', 'Fellow', 'Ode Gen 2', 'MOL-07'),
       ('maquina', 'Gaggia', 'Classic Pro', 'MAQ-07')
RETURNING id_equipo, tipo, identificador_local;

-- [A06] INSERT con CROSS JOIN: tres notas de cata para el lote nuevo
INSERT INTO notas_cata (id_lote, descriptor)
SELECT l.id_lote, d.descriptor
FROM lotes l
CROSS JOIN (VALUES ('Chocolate oscuro'), ('Mandarina'), ('Panela')) AS d(descriptor)
WHERE l.codigo_lote = 'LT-2026-101'
RETURNING id_nota, id_lote, descriptor;

-- [A07] INSERT de una calibración. ratio, EY y diagnóstico se mandan vacíos:
-- el trigger calibraciones_derivados_trg los calcula (EY = 10 x 36 / 18 = 20).
INSERT INTO calibraciones (id_lote, id_molino, id_maquina, fecha_hora, dosis_in_g, ajuste_molienda, temperatura_c,
                           presion_bar, yield_out_g, tiempo_segundos, tds_porcentaje, calificacion_sabor,
                           notas_barista, barista_nombre, ratio_calculado, ey_porcentaje, diagnostico)
SELECT l.id_lote, m.id_equipo, q.id_equipo, TIMESTAMP '2026-10-21 09:00', 18, 11.5, 93, 9, 36, 28, 10.0, 8.5,
       'Chocolate y mandarina', 'Adriel Ordaz', '', 0, 'EQUILIBRADA'
FROM lotes l, equipos m, equipos q
WHERE l.codigo_lote = 'LT-2026-101' AND m.identificador_local = 'MOL-07' AND q.identificador_local = 'MAQ-07'
RETURNING id_calibracion, ratio_calculado, ey_porcentaje, diagnostico;

-- [A08] INSERT de una calibración subextraída (EY = 9 x 30 / 18 = 15)
INSERT INTO calibraciones (id_lote, id_molino, id_maquina, fecha_hora, dosis_in_g, ajuste_molienda, temperatura_c,
                           presion_bar, yield_out_g, tiempo_segundos, tds_porcentaje, calificacion_sabor,
                           notas_barista, barista_nombre, ratio_calculado, ey_porcentaje, diagnostico)
SELECT l.id_lote, m.id_equipo, q.id_equipo, TIMESTAMP '2026-10-21 09:30', 18, 13.0, 92, 9, 30, 22, 9.0, 5,
       'Ácido y ligero', 'Andy Plaza', '', 0, 'EQUILIBRADA'
FROM lotes l, equipos m, equipos q
WHERE l.codigo_lote = 'LT-2026-102' AND m.identificador_local = 'MOL-07' AND q.identificador_local = 'MAQ-07'
RETURNING id_calibracion, ratio_calculado, ey_porcentaje, diagnostico;

-- [A09] INSERT ... ON CONFLICT: no duplica una nota que ya existe en el lote (UNIQUE id_lote, descriptor)
INSERT INTO notas_cata (id_lote, descriptor)
SELECT id_lote, 'Mandarina' FROM lotes WHERE codigo_lote = 'LT-2026-101'
ON CONFLICT (id_lote, descriptor) DO NOTHING
RETURNING id_nota;

-- [A10] UPDATE: descontar del lote los 18 g usados en la calibración
UPDATE lotes
SET peso_actual_g = peso_actual_g - 18
WHERE codigo_lote = 'LT-2026-101'
RETURNING codigo_lote, peso_inicial_g, peso_actual_g;

-- [A11] UPDATE ... FROM: descontar la dosis de cada calibración del lote LT-2026-102
UPDATE lotes
SET peso_actual_g = lotes.peso_actual_g - c.dosis_in_g
FROM calibraciones c
WHERE c.id_lote = lotes.id_lote AND lotes.codigo_lote = 'LT-2026-102'
RETURNING lotes.codigo_lote, lotes.peso_actual_g;

-- [A12] UPDATE: corregir la puntuación SCA de un grano
UPDATE granos
SET puntuacion_sca = 86.50
WHERE nombre_cafe = 'Oaxaca Pluma Hidalgo'
RETURNING nombre_cafe, puntuacion_sca;

-- [A13] UPDATE con subconsulta: corregir el TDS; el trigger recalcula EY y diagnóstico (11.5 x 36 / 18 = 23)
UPDATE calibraciones
SET tds_porcentaje = 11.5
WHERE id_lote = (SELECT id_lote FROM lotes WHERE codigo_lote = 'LT-2026-101')
RETURNING id_calibracion, tds_porcentaje, ey_porcentaje, diagnostico;

-- [A14] UPDATE concatenando texto: agregar una indicación a las notas del barista
UPDATE calibraciones
SET notas_barista = COALESCE(notas_barista || '. ', '') || 'Recalibrar: moler más grueso'
WHERE diagnostico = 'SOBREEXTRAIDA'
  AND id_lote = (SELECT id_lote FROM lotes WHERE codigo_lote = 'LT-2026-101')
RETURNING id_calibracion, notas_barista;

-- [A15] UPDATE con CASE: calificación según el diagnóstico de las calibraciones nuevas
UPDATE calibraciones
SET calificacion_sabor = CASE diagnostico
                           WHEN 'EQUILIBRADA' THEN 8
                           WHEN 'SUBEXTRAIDA' THEN 5
                           ELSE 6
                         END
WHERE id_lote IN (SELECT id_lote FROM lotes WHERE codigo_lote IN ('LT-2026-101', 'LT-2026-102'))
RETURNING id_calibracion, diagnostico, calificacion_sabor;

-- [A16] UPDATE: cambiar el modelo de un equipo
UPDATE equipos
SET modelo = 'Classic Pro E24'
WHERE identificador_local = 'MAQ-07'
RETURNING identificador_local, marca, modelo;

-- [A17] UPDATE de dos columnas: marcar el lote LT-2026-102 como agotado
UPDATE lotes
SET activo = false, peso_actual_g = 0
WHERE codigo_lote = 'LT-2026-102'
RETURNING codigo_lote, peso_actual_g, activo;

-- [A18] UPDATE con subconsulta: cambiar la tostaduría de todos los lotes de un grano
UPDATE lotes
SET tostaduria = 'Tostaduría Central'
WHERE id_grano = (SELECT id_grano FROM granos WHERE nombre_cafe = 'Oaxaca Pluma Hidalgo')
RETURNING codigo_lote, tostaduria;

-- [A19] DELETE: quitar una nota de cata específica
DELETE FROM notas_cata
WHERE descriptor = 'Panela'
  AND id_lote = (SELECT id_lote FROM lotes WHERE codigo_lote = 'LT-2026-101')
RETURNING id_nota, descriptor;

-- [A20] DELETE con LIKE: quitar las notas que empiezan con "Mand"
DELETE FROM notas_cata
WHERE descriptor LIKE 'Mand%'
  AND id_lote IN (SELECT id_lote FROM lotes WHERE codigo_lote = 'LT-2026-101')
RETURNING id_nota, descriptor;

-- [A21] DELETE: eliminar la calibración subextraída del lote LT-2026-102
DELETE FROM calibraciones
WHERE diagnostico = 'SUBEXTRAIDA'
  AND id_lote = (SELECT id_lote FROM lotes WHERE codigo_lote = 'LT-2026-102')
RETURNING id_calibracion, diagnostico;

-- [A22] DELETE con NOT EXISTS: borrar el lote solo si ya no tiene calibraciones
DELETE FROM lotes l
WHERE l.codigo_lote = 'LT-2026-102'
  AND NOT EXISTS (SELECT 1 FROM calibraciones c WHERE c.id_lote = l.id_lote)
RETURNING l.id_lote, l.codigo_lote;

-- [A23] DELETE con NOT EXISTS: borrar los granos de prueba que no tienen lotes
DELETE FROM granos g
WHERE g.nombre_cafe IN ('Guji Anaeróbico', 'Bourbon Rosado')
  AND NOT EXISTS (SELECT 1 FROM lotes l WHERE l.id_grano = g.id_grano)
RETURNING g.id_grano, g.nombre_cafe;

-- [A24] DELETE ... USING: borrar las calibraciones del lote LT-2026-101 uniendo con lotes
DELETE FROM calibraciones
USING lotes
WHERE calibraciones.id_lote = lotes.id_lote AND lotes.codigo_lote = 'LT-2026-101'
RETURNING calibraciones.id_calibracion;

-- [A25] DELETE con NOT EXISTS: borrar los equipos nuevos que no se usan en ninguna calibración
DELETE FROM equipos e
WHERE e.identificador_local IN ('MOL-07', 'MAQ-07')
  AND NOT EXISTS (SELECT 1 FROM calibraciones c WHERE c.id_molino = e.id_equipo OR c.id_maquina = e.id_equipo)
RETURNING e.id_equipo, e.identificador_local;

ROLLBACK;  -- cambiar por COMMIT para conservar los cambios


-- =====================================================================
-- PARTE B. 25 CONSULTAS SIMPLES (una sola tabla)
-- =====================================================================

-- [B01] Todos los granos con todas sus columnas
SELECT * FROM granos;

-- [B02] Columnas específicas, ordenadas por nombre
SELECT nombre_cafe, pais_origen, puntuacion_sca FROM granos ORDER BY nombre_cafe;

-- [B03] Filtro por igualdad: granos de Etiopía
SELECT nombre_cafe, region FROM granos WHERE pais_origen = 'Etiopía';

-- [B04] Filtro por comparación: granos con SCA de 88 o más
SELECT nombre_cafe, puntuacion_sca FROM granos WHERE puntuacion_sca >= 88 ORDER BY puntuacion_sca DESC;

-- [B05] BETWEEN: granos con SCA entre 85 y 88
SELECT nombre_cafe, puntuacion_sca FROM granos WHERE puntuacion_sca BETWEEN 85 AND 88 ORDER BY puntuacion_sca;

-- [B06] IN: granos de proceso Natural o Honey
SELECT nombre_cafe, proceso FROM granos WHERE proceso IN ('Natural', 'Honey') ORDER BY proceso, nombre_cafe;

-- [B07] ILIKE: fincas cuyo nombre empieza con "Finca" (sin distinguir mayúsculas)
SELECT nombre_cafe, finca FROM granos WHERE finca ILIKE 'finca%';

-- [B08] DISTINCT: países de origen sin repetir
SELECT DISTINCT pais_origen FROM granos ORDER BY pais_origen;

-- [B09] Funciones de agregado sobre una tabla
SELECT COUNT(*) AS total_granos, ROUND(AVG(puntuacion_sca), 2) AS sca_promedio, MAX(puntuacion_sca) AS sca_maxima
FROM granos;

-- [B10] Lotes activos
SELECT codigo_lote, tostaduria, peso_actual_g FROM lotes WHERE activo = true ORDER BY codigo_lote;

-- [B11] AND: lotes activos con menos de 500 g
SELECT codigo_lote, peso_actual_g FROM lotes WHERE activo AND peso_actual_g < 500;

-- [B12] ORDER BY + LIMIT: los 3 lotes tostados más recientemente
SELECT codigo_lote, fecha_tueste, nivel_tueste FROM lotes ORDER BY fecha_tueste DESC LIMIT 3;

-- [B13] Columna calculada con alias: porcentaje de café que queda en cada lote
SELECT codigo_lote, peso_inicial_g, peso_actual_g,
       ROUND(peso_actual_g / peso_inicial_g * 100, 1) AS porcentaje_restante
FROM lotes
ORDER BY porcentaje_restante;

-- [B14] Rango de fechas: lotes tostados en octubre de 2026
SELECT codigo_lote, fecha_tueste FROM lotes
WHERE fecha_tueste >= DATE '2026-10-01' AND fecha_tueste < DATE '2026-11-01';

-- [B15] GROUP BY: número de lotes por nivel de tueste
SELECT nivel_tueste, COUNT(*) AS lotes FROM lotes GROUP BY nivel_tueste ORDER BY lotes DESC;

-- [B16] Molinos registrados
SELECT identificador_local, marca, modelo FROM equipos WHERE tipo = 'molino' ORDER BY identificador_local;

-- [B17] Concatenación: máquinas de espresso con marca y modelo en una columna
SELECT identificador_local, marca || ' ' || modelo AS equipo FROM equipos WHERE tipo = 'maquina' ORDER BY marca, modelo;

-- [B18] GROUP BY + HAVING: marcas con más de un equipo
SELECT marca, COUNT(*) AS equipos FROM equipos GROUP BY marca HAVING COUNT(*) > 1;

-- [B19] Calibraciones equilibradas, en orden cronológico
SELECT id_calibracion, fecha_hora, ey_porcentaje FROM calibraciones WHERE diagnostico = 'EQUILIBRADA' ORDER BY fecha_hora;

-- [B20] Mínimo, máximo y promedio del EY
SELECT MIN(ey_porcentaje) AS ey_min, MAX(ey_porcentaje) AS ey_max, ROUND(AVG(ey_porcentaje), 2) AS ey_promedio
FROM calibraciones;

-- [B21] Número de calibraciones por diagnóstico
SELECT diagnostico, COUNT(*) AS calibraciones FROM calibraciones GROUP BY diagnostico ORDER BY calibraciones DESC;

-- [B22] ILIKE: calibraciones hechas por Ana
SELECT id_calibracion, barista_nombre, calificacion_sabor FROM calibraciones WHERE barista_nombre ILIKE 'ana%';

-- [B23] Varias condiciones: extracciones de 25 a 30 s a 9 bar
SELECT id_calibracion, tiempo_segundos, presion_bar FROM calibraciones
WHERE tiempo_segundos BETWEEN 25 AND 30 AND presion_bar = 9;

-- [B24] IS NULL: calibraciones sin notas del barista
SELECT id_calibracion, barista_nombre FROM calibraciones WHERE notas_barista IS NULL;

-- [B25] LIMIT + OFFSET: segunda página de notas de cata (5 por página)
SELECT id_nota, descriptor FROM notas_cata ORDER BY descriptor LIMIT 5 OFFSET 5;


-- =====================================================================
-- PARTE C. 25 CONSULTAS COMPLEJAS (JOIN, agregados, subconsultas, CTE, ventanas)
-- =====================================================================

-- [C01] INNER JOIN: cada lote con el nombre y país de su grano
SELECT l.codigo_lote, g.nombre_cafe, g.pais_origen, l.nivel_tueste, l.peso_actual_g
FROM lotes l
JOIN granos g ON g.id_grano = l.id_grano
ORDER BY l.codigo_lote;

-- [C02] JOIN de tres tablas: calibraciones con su lote y su café
SELECT c.id_calibracion, c.fecha_hora, g.nombre_cafe, l.codigo_lote, c.ey_porcentaje, c.diagnostico
FROM calibraciones c
JOIN lotes l ON l.id_lote = c.id_lote
JOIN granos g ON g.id_grano = l.id_grano
ORDER BY c.fecha_hora DESC;

-- [C03] Doble JOIN a la misma tabla con alias: molino y máquina de cada calibración
SELECT c.id_calibracion,
       m.marca || ' ' || m.modelo AS molino,
       q.marca || ' ' || q.modelo AS maquina,
       c.diagnostico
FROM calibraciones c
JOIN equipos m ON m.id_equipo = c.id_molino
JOIN equipos q ON q.id_equipo = c.id_maquina
ORDER BY c.id_calibracion;

-- [C04] LEFT JOIN + COUNT: número de lotes de cada grano (incluye granos sin lotes)
SELECT g.nombre_cafe, COUNT(l.id_lote) AS lotes
FROM granos g
LEFT JOIN lotes l ON l.id_grano = g.id_grano
GROUP BY g.id_grano, g.nombre_cafe
ORDER BY lotes DESC, g.nombre_cafe;

-- [C05] JOIN + GROUP BY: lotes activos y gramos disponibles por país
SELECT g.pais_origen, COUNT(l.id_lote) AS lotes_activos, SUM(l.peso_actual_g) AS gramos_disponibles
FROM granos g
JOIN lotes l ON l.id_grano = g.id_grano
WHERE l.activo
GROUP BY g.pais_origen
ORDER BY gramos_disponibles DESC;

-- [C06] JOIN + GROUP BY + HAVING: promedios por café con al menos 2 calibraciones
SELECT g.nombre_cafe, COUNT(*) AS calibraciones,
       ROUND(AVG(c.ey_porcentaje), 2) AS ey_promedio,
       ROUND(AVG(c.calificacion_sabor), 1) AS sabor_promedio
FROM calibraciones c
JOIN lotes l ON l.id_lote = c.id_lote
JOIN granos g ON g.id_grano = l.id_grano
GROUP BY g.nombre_cafe
HAVING COUNT(*) >= 2
ORDER BY sabor_promedio DESC;

-- [C07] Agregado con FILTER: desempeño de cada barista
SELECT barista_nombre,
       COUNT(*) AS calibraciones,
       COUNT(*) FILTER (WHERE diagnostico = 'EQUILIBRADA') AS equilibradas,
       ROUND(100.0 * COUNT(*) FILTER (WHERE diagnostico = 'EQUILIBRADA') / COUNT(*), 1) AS pct_equilibradas,
       ROUND(AVG(calificacion_sabor), 1) AS sabor_promedio
FROM calibraciones
GROUP BY barista_nombre
ORDER BY pct_equilibradas DESC, calibraciones DESC;

-- [C08] LEFT JOIN con OR: cuántas veces se ha usado cada equipo (incluye los que no se usan)
SELECT e.identificador_local, e.tipo, e.marca, COUNT(c.id_calibracion) AS usos
FROM equipos e
LEFT JOIN calibraciones c ON c.id_molino = e.id_equipo OR c.id_maquina = e.id_equipo
GROUP BY e.id_equipo, e.identificador_local, e.tipo, e.marca
ORDER BY usos DESC, e.identificador_local;

-- [C09] Subconsulta escalar: calibraciones con EY mayor al promedio general
SELECT id_calibracion, barista_nombre, ey_porcentaje
FROM calibraciones
WHERE ey_porcentaje > (SELECT AVG(ey_porcentaje) FROM calibraciones)
ORDER BY ey_porcentaje DESC;

-- [C10] Subconsulta con IN: cafés que han tenido alguna extracción sobreextraída
SELECT nombre_cafe
FROM granos
WHERE id_grano IN (SELECT l.id_grano
                   FROM lotes l
                   JOIN calibraciones c ON c.id_lote = l.id_lote
                   WHERE c.diagnostico = 'SOBREEXTRAIDA');

-- [C11] NOT EXISTS: lotes activos que todavía no se han calibrado
SELECT l.codigo_lote, g.nombre_cafe
FROM lotes l
JOIN granos g ON g.id_grano = l.id_grano
WHERE l.activo
  AND NOT EXISTS (SELECT 1 FROM calibraciones c WHERE c.id_lote = l.id_lote)
ORDER BY l.codigo_lote;

-- [C12] EXISTS: lotes con alguna nota de cata a chocolate
SELECT l.codigo_lote, g.nombre_cafe
FROM lotes l
JOIN granos g ON g.id_grano = l.id_grano
WHERE EXISTS (SELECT 1 FROM notas_cata n WHERE n.id_lote = l.id_lote AND n.descriptor ILIKE 'chocolate%')
ORDER BY l.codigo_lote;

-- [C13] string_agg: las notas de cata de cada lote en una sola columna
SELECT l.codigo_lote, g.nombre_cafe, string_agg(n.descriptor, ', ' ORDER BY n.descriptor) AS notas_de_cata
FROM lotes l
JOIN granos g ON g.id_grano = l.id_grano
LEFT JOIN notas_cata n ON n.id_lote = l.id_lote
GROUP BY l.codigo_lote, g.nombre_cafe
ORDER BY l.codigo_lote;

-- [C14] CTE (WITH): lotes cuyo EY promedio está en el rango equilibrado (18 a 22)
WITH resumen AS (
  SELECT id_lote, COUNT(*) AS calibraciones, AVG(ey_porcentaje) AS ey_promedio
  FROM calibraciones
  GROUP BY id_lote
)
SELECT l.codigo_lote, r.calibraciones, ROUND(r.ey_promedio, 2) AS ey_promedio
FROM resumen r
JOIN lotes l ON l.id_lote = r.id_lote
WHERE r.ey_promedio BETWEEN 18 AND 22
ORDER BY r.ey_promedio;

-- [C15] ROW_NUMBER: la mejor calibración (mayor calificación) de cada lote
SELECT codigo_lote, id_calibracion, calificacion_sabor, barista_nombre
FROM (
  SELECT l.codigo_lote, c.id_calibracion, c.calificacion_sabor, c.barista_nombre,
         ROW_NUMBER() OVER (PARTITION BY c.id_lote ORDER BY c.calificacion_sabor DESC, c.fecha_hora) AS posicion
  FROM calibraciones c
  JOIN lotes l ON l.id_lote = c.id_lote
) t
WHERE posicion = 1
ORDER BY codigo_lote;

-- [C16] DENSE_RANK y RANK: ranking de granos por SCA, general y dentro de su país
SELECT nombre_cafe, pais_origen, puntuacion_sca,
       DENSE_RANK() OVER (ORDER BY puntuacion_sca DESC) AS lugar_general,
       RANK() OVER (PARTITION BY pais_origen ORDER BY puntuacion_sca DESC) AS lugar_en_su_pais
FROM granos
ORDER BY lugar_general;

-- [C17] LAG: cambio de EY respecto a la calibración anterior del mismo lote
SELECT l.codigo_lote, c.fecha_hora, c.ey_porcentaje,
       c.ey_porcentaje - LAG(c.ey_porcentaje) OVER (PARTITION BY c.id_lote ORDER BY c.fecha_hora) AS cambio_ey
FROM calibraciones c
JOIN lotes l ON l.id_lote = c.id_lote
ORDER BY l.codigo_lote, c.fecha_hora;

-- [C18] Suma acumulada: gramos de café molido usados por día y acumulados
SELECT c.fecha_hora::date AS dia,
       SUM(c.dosis_in_g) AS gramos_del_dia,
       SUM(SUM(c.dosis_in_g)) OVER (ORDER BY c.fecha_hora::date) AS gramos_acumulados
FROM calibraciones c
GROUP BY c.fecha_hora::date
ORDER BY dia;

-- [C19] CASE + GROUP BY: clasificar los lotes por existencia
SELECT CASE
         WHEN peso_actual_g = 0 THEN 'Agotado'
         WHEN peso_actual_g < 300 THEN 'Bajo (menos de 300 g)'
         ELSE 'Suficiente'
       END AS existencia,
       COUNT(*) AS lotes,
       SUM(peso_actual_g) AS gramos
FROM lotes
GROUP BY 1
ORDER BY lotes DESC;

-- [C20] UNION ALL: línea de tiempo de trazabilidad (tuestes y calibraciones)
SELECT fecha, evento, detalle
FROM (
  SELECT l.fecha_tueste::timestamp AS fecha, 'Tueste' AS evento, l.codigo_lote || ' · ' || g.nombre_cafe AS detalle
  FROM lotes l
  JOIN granos g ON g.id_grano = l.id_grano
  UNION ALL
  SELECT c.fecha_hora, 'Calibración', l.codigo_lote || ' · ' || c.diagnostico
  FROM calibraciones c
  JOIN lotes l ON l.id_lote = c.id_lote
) eventos
ORDER BY fecha DESC
LIMIT 15;

-- [C21] EXTRACT: calibraciones y calificación promedio por día de la semana (1 = lunes)
SELECT EXTRACT(ISODOW FROM fecha_hora) AS dia_semana,
       COUNT(*) AS calibraciones,
       ROUND(AVG(calificacion_sabor), 1) AS sabor_promedio
FROM calibraciones
GROUP BY 1
ORDER BY 1;

-- [C22] Subconsultas correlacionadas: ficha de trazabilidad completa de un lote
SELECT l.codigo_lote, g.nombre_cafe, g.finca, g.pais_origen, l.fecha_tueste,
       (SELECT string_agg(n.descriptor, ', ') FROM notas_cata n WHERE n.id_lote = l.id_lote) AS notas_de_cata,
       (SELECT COUNT(*) FROM calibraciones c WHERE c.id_lote = l.id_lote) AS calibraciones,
       (SELECT c.diagnostico FROM calibraciones c WHERE c.id_lote = l.id_lote
        ORDER BY c.fecha_hora DESC LIMIT 1) AS ultimo_diagnostico
FROM lotes l
JOIN granos g ON g.id_grano = l.id_grano
WHERE l.codigo_lote = 'LT-2026-001';

-- [C23] Dos CTE: SCA promedio y EY promedio por proceso de beneficio
-- (se agregan por separado para que las calibraciones no repitan granos en el promedio de SCA)
WITH sca AS (
  SELECT proceso, COUNT(*) AS granos, AVG(puntuacion_sca) AS sca_promedio
  FROM granos
  GROUP BY proceso
), ey AS (
  SELECT g.proceso, AVG(c.ey_porcentaje) AS ey_promedio
  FROM calibraciones c
  JOIN lotes l ON l.id_lote = c.id_lote
  JOIN granos g ON g.id_grano = l.id_grano
  GROUP BY g.proceso
)
SELECT s.proceso, s.granos, ROUND(s.sca_promedio, 2) AS sca_promedio, ROUND(e.ey_promedio, 2) AS ey_promedio
FROM sca s
LEFT JOIN ey e ON e.proceso = s.proceso
ORDER BY s.sca_promedio DESC;

-- [C24] Aritmética de fechas: días de reposo entre el tueste y cada calibración, por lote
SELECT l.codigo_lote,
       MIN(c.fecha_hora::date - l.fecha_tueste) AS dias_min,
       MAX(c.fecha_hora::date - l.fecha_tueste) AS dias_max,
       ROUND(AVG(c.fecha_hora::date - l.fecha_tueste), 1) AS dias_promedio
FROM calibraciones c
JOIN lotes l ON l.id_lote = c.id_lote
GROUP BY l.codigo_lote
ORDER BY l.codigo_lote;

-- [C25] CTE + DISTINCT ON: molino recomendado para cada lote (mejor calificación promedio)
WITH por_molino AS (
  SELECT id_lote, id_molino, AVG(calificacion_sabor) AS sabor_promedio, COUNT(*) AS calibraciones
  FROM calibraciones
  GROUP BY id_lote, id_molino
)
SELECT DISTINCT ON (p.id_lote)
       l.codigo_lote, e.marca || ' ' || e.modelo AS molino_recomendado,
       ROUND(p.sabor_promedio, 1) AS sabor_promedio, p.calibraciones
FROM por_molino p
JOIN lotes l ON l.id_lote = p.id_lote
JOIN equipos e ON e.id_equipo = p.id_molino
ORDER BY p.id_lote, p.sabor_promedio DESC, p.calibraciones DESC;

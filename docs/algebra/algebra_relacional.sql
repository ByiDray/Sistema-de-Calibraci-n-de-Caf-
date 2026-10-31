-- =====================================================================
-- Álgebra relacional y SQL · App BD Café
-- 5 consultas por cada operación del álgebra relacional (45 en total).
-- Encima de cada consulta va su expresión en álgebra relacional.
-- Solo lectura: ninguna consulta modifica datos.
-- =====================================================================


-- ===================== SELECCIÓN (σ) → WHERE =========================

-- [SEL1] σ pais_origen = 'Etiopía' (granos)
SELECT * FROM granos WHERE pais_origen = 'Etiopía';

-- [SEL2] σ puntuacion_sca ≥ 88 (granos)
SELECT * FROM granos WHERE puntuacion_sca >= 88;

-- [SEL3] σ activo = true ∧ peso_actual_g < 500 (lotes)
SELECT * FROM lotes WHERE activo = true AND peso_actual_g < 500;

-- [SEL4] σ diagnostico = 'SUBEXTRAIDA' ∨ diagnostico = 'SOBREEXTRAIDA' (calibraciones)
SELECT * FROM calibraciones WHERE diagnostico = 'SUBEXTRAIDA' OR diagnostico = 'SOBREEXTRAIDA';

-- [SEL5] σ tipo = 'molino' ∧ marca = 'Eureka' (equipos)
SELECT * FROM equipos WHERE tipo = 'molino' AND marca = 'Eureka';


-- ===================== PROYECCIÓN (π) → SELECT DISTINCT ===============

-- [PRO1] π nombre_cafe, pais_origen (granos)
SELECT DISTINCT nombre_cafe, pais_origen FROM granos;

-- [PRO2] π pais_origen (granos)
SELECT DISTINCT pais_origen FROM granos;

-- [PRO3] π codigo_lote, peso_actual_g (lotes)
SELECT DISTINCT codigo_lote, peso_actual_g FROM lotes;

-- [PRO4] π marca (equipos)
SELECT DISTINCT marca FROM equipos;

-- [PRO5] π barista_nombre (σ diagnostico = 'EQUILIBRADA' (calibraciones))
SELECT DISTINCT barista_nombre FROM calibraciones WHERE diagnostico = 'EQUILIBRADA';


-- ===================== RENOMBRAR (ρ) → AS =============================

-- [REN1] ρ cafe (granos)
SELECT cafe.nombre_cafe, cafe.pais_origen FROM granos AS cafe;

-- [REN2] ρ (id, nombre, pais) (π id_grano, nombre_cafe, pais_origen (granos))
SELECT id_grano AS id, nombre_cafe AS nombre, pais_origen AS pais FROM granos;

-- [REN3] π molino.marca, molino.modelo (σ molino.tipo = 'molino' (ρ molino (equipos)))
SELECT DISTINCT molino.marca, molino.modelo FROM equipos AS molino WHERE molino.tipo = 'molino';

-- [REN4] ρ existencia (codigo, gramos) (π codigo_lote, peso_actual_g (σ activo = true (lotes)))
SELECT codigo_lote AS codigo, peso_actual_g AS gramos FROM lotes WHERE activo = true;

-- [REN5] π g1.nombre_cafe, g2.nombre_cafe, g1.pais_origen (ρ g1 (granos) ⋈ g1.pais_origen = g2.pais_origen ∧ g1.id_grano < g2.id_grano ρ g2 (granos))
SELECT g1.nombre_cafe AS cafe_1, g2.nombre_cafe AS cafe_2, g1.pais_origen AS pais
FROM granos AS g1
JOIN granos AS g2 ON g1.pais_origen = g2.pais_origen AND g1.id_grano < g2.id_grano;


-- ===================== UNIÓN (∪) → UNION ==============================

-- [UNI1] π id_lote (notas_cata) ∪ π id_lote (calibraciones)
SELECT id_lote FROM notas_cata
UNION
SELECT id_lote FROM calibraciones;

-- [UNI2] π nombre_cafe (σ proceso = 'Natural' (granos)) ∪ π nombre_cafe (σ proceso = 'Honey' (granos))
SELECT nombre_cafe FROM granos WHERE proceso = 'Natural'
UNION
SELECT nombre_cafe FROM granos WHERE proceso = 'Honey';

-- [UNI3] ρ (id_equipo) (π id_molino (calibraciones)) ∪ ρ (id_equipo) (π id_maquina (calibraciones))
SELECT id_molino AS id_equipo FROM calibraciones
UNION
SELECT id_maquina AS id_equipo FROM calibraciones;

-- [UNI4] π codigo_lote (σ peso_actual_g = 0 (lotes)) ∪ π codigo_lote (σ activo = false (lotes))
SELECT codigo_lote FROM lotes WHERE peso_actual_g = 0
UNION
SELECT codigo_lote FROM lotes WHERE activo = false;

-- [UNI5] π pais_origen (σ puntuacion_sca ≥ 88 (granos)) ∪ π pais_origen (σ proceso = 'Honey' (granos))
SELECT pais_origen FROM granos WHERE puntuacion_sca >= 88
UNION
SELECT pais_origen FROM granos WHERE proceso = 'Honey';


-- ===================== INTERSECCIÓN (∩) → INTERSECT ===================

-- [INT1] π id_lote (notas_cata) ∩ π id_lote (calibraciones)
SELECT id_lote FROM notas_cata
INTERSECT
SELECT id_lote FROM calibraciones;

-- [INT2] π barista_nombre (σ diagnostico = 'EQUILIBRADA' (calibraciones)) ∩ π barista_nombre (σ diagnostico = 'SUBEXTRAIDA' (calibraciones))
SELECT barista_nombre FROM calibraciones WHERE diagnostico = 'EQUILIBRADA'
INTERSECT
SELECT barista_nombre FROM calibraciones WHERE diagnostico = 'SUBEXTRAIDA';

-- [INT3] π pais_origen (σ proceso = 'Lavado' (granos)) ∩ π pais_origen (σ proceso = 'Natural' (granos))
SELECT pais_origen FROM granos WHERE proceso = 'Lavado'
INTERSECT
SELECT pais_origen FROM granos WHERE proceso = 'Natural';

-- [INT4] π id_lote (σ activo = true (lotes)) ∩ π id_lote (calibraciones)
SELECT id_lote FROM lotes WHERE activo = true
INTERSECT
SELECT id_lote FROM calibraciones;

-- [INT5] π id_molino (σ diagnostico = 'EQUILIBRADA' (calibraciones)) ∩ π id_molino (σ diagnostico ≠ 'EQUILIBRADA' (calibraciones))
SELECT id_molino FROM calibraciones WHERE diagnostico = 'EQUILIBRADA'
INTERSECT
SELECT id_molino FROM calibraciones WHERE diagnostico <> 'EQUILIBRADA';


-- ===================== DIFERENCIA (−) → EXCEPT ========================

-- [DIF1] π id_lote (lotes) − π id_lote (calibraciones)
SELECT id_lote FROM lotes
EXCEPT
SELECT id_lote FROM calibraciones;

-- [DIF2] π id_lote (lotes) − π id_lote (notas_cata)
SELECT id_lote FROM lotes
EXCEPT
SELECT id_lote FROM notas_cata;

-- [DIF3] π pais_origen (granos) − π pais_origen (σ proceso = 'Lavado' (granos))
SELECT pais_origen FROM granos
EXCEPT
SELECT pais_origen FROM granos WHERE proceso = 'Lavado';

-- [DIF4] π barista_nombre (calibraciones) − π barista_nombre (σ diagnostico = 'EQUILIBRADA' (calibraciones))
SELECT barista_nombre FROM calibraciones
EXCEPT
SELECT barista_nombre FROM calibraciones WHERE diagnostico = 'EQUILIBRADA';

-- [DIF5] π id_lote (σ activo = true (lotes)) − π id_lote (σ diagnostico = 'EQUILIBRADA' (calibraciones))
SELECT id_lote FROM lotes WHERE activo = true
EXCEPT
SELECT id_lote FROM calibraciones WHERE diagnostico = 'EQUILIBRADA';


-- ===================== PRODUCTO CARTESIANO (×) → CROSS JOIN ===========

-- [PRC1] π m.identificador_local, q.identificador_local (σ m.tipo = 'molino' (ρ m (equipos)) × σ q.tipo = 'maquina' (ρ q (equipos)))
SELECT m.identificador_local AS molino, q.identificador_local AS maquina
FROM equipos AS m CROSS JOIN equipos AS q
WHERE m.tipo = 'molino' AND q.tipo = 'maquina';

-- [PRC2] π nombre_cafe, codigo_lote (granos × lotes)
SELECT g.nombre_cafe, l.codigo_lote FROM granos AS g CROSS JOIN lotes AS l;

-- [PRC3] π nombre_cafe, codigo_lote (σ granos.id_grano = lotes.id_grano (granos × lotes))
SELECT g.nombre_cafe, l.codigo_lote
FROM granos AS g CROSS JOIN lotes AS l
WHERE g.id_grano = l.id_grano;

-- [PRC4] π codigo_lote, identificador_local (σ activo = true (lotes) × σ tipo = 'maquina' (equipos))
SELECT l.codigo_lote, e.identificador_local
FROM lotes AS l CROSS JOIN equipos AS e
WHERE l.activo = true AND e.tipo = 'maquina';

-- [PRC5] π barista_nombre (calibraciones) × π codigo_lote (σ activo = true (lotes))
SELECT b.barista_nombre, l.codigo_lote
FROM (SELECT DISTINCT barista_nombre FROM calibraciones) AS b
CROSS JOIN (SELECT codigo_lote FROM lotes WHERE activo = true) AS l;


-- ===================== REUNIÓN / JOIN (⋈) → JOIN ======================

-- [JOI1] π nombre_cafe, codigo_lote, nivel_tueste (granos ⋈ lotes)   (reunión natural por id_grano)
SELECT nombre_cafe, codigo_lote, nivel_tueste FROM granos NATURAL JOIN lotes;

-- [JOI2] π codigo_lote, descriptor (lotes ⋈ notas_cata)   (reunión natural por id_lote)
SELECT codigo_lote, descriptor FROM lotes NATURAL JOIN notas_cata;

-- [JOI3] π id_calibracion, marca, modelo (calibraciones ⋈ id_molino = id_equipo equipos)   (theta-join)
SELECT c.id_calibracion, e.marca, e.modelo
FROM calibraciones AS c
JOIN equipos AS e ON c.id_molino = e.id_equipo;

-- [JOI4] π nombre_cafe, codigo_lote, diagnostico (granos ⋈ lotes ⋈ calibraciones)
SELECT g.nombre_cafe, l.codigo_lote, c.diagnostico
FROM granos AS g
JOIN lotes AS l ON l.id_grano = g.id_grano
JOIN calibraciones AS c ON c.id_lote = l.id_lote;

-- [JOI5] π codigo_lote, descriptor (lotes ⟕ notas_cata)   (reunión externa izquierda)
SELECT l.codigo_lote, n.descriptor
FROM lotes AS l
LEFT JOIN notas_cata AS n ON n.id_lote = l.id_lote;


-- ===================== DIVISIÓN (÷) → doble NOT EXISTS / HAVING =======

-- [DIV1] π id_lote, descriptor (notas_cata) ÷ π descriptor (σ descriptor = 'Chocolate amargo' ∨ descriptor = 'Caramelo' (notas_cata))
SELECT l.codigo_lote
FROM lotes AS l
WHERE NOT EXISTS (
  SELECT 1 FROM notas_cata AS d
  WHERE d.descriptor IN ('Chocolate amargo', 'Caramelo')
    AND NOT EXISTS (SELECT 1 FROM notas_cata AS n WHERE n.id_lote = l.id_lote AND n.descriptor = d.descriptor)
);

-- [DIV2] π barista_nombre, id_lote (calibraciones) ÷ π id_lote (σ nombre_cafe = 'Geisha Boquete' (granos ⋈ lotes))
SELECT c.barista_nombre
FROM calibraciones AS c
JOIN lotes AS l ON l.id_lote = c.id_lote
JOIN granos AS g ON g.id_grano = l.id_grano
WHERE g.nombre_cafe = 'Geisha Boquete'
GROUP BY c.barista_nombre
HAVING COUNT(DISTINCT c.id_lote) = (SELECT COUNT(*) FROM lotes AS l2 JOIN granos AS g2 ON g2.id_grano = l2.id_grano
                                    WHERE g2.nombre_cafe = 'Geisha Boquete');

-- [DIV3] π id_lote, barista_nombre (calibraciones) ÷ π barista_nombre (σ barista_nombre = 'Adriel' ∨ barista_nombre = 'Sofia' (calibraciones))
SELECT l.codigo_lote
FROM lotes AS l
WHERE NOT EXISTS (
  SELECT 1 FROM calibraciones AS b
  WHERE b.barista_nombre IN ('Adriel', 'Sofia')
    AND NOT EXISTS (SELECT 1 FROM calibraciones AS c WHERE c.id_lote = l.id_lote AND c.barista_nombre = b.barista_nombre)
);

-- [DIV4] π barista_nombre, id_molino (calibraciones) ÷ ρ (id_molino) (π id_equipo (σ tipo = 'molino' ∧ marca = 'Eureka' (equipos)))
SELECT DISTINCT c0.barista_nombre
FROM calibraciones AS c0
WHERE NOT EXISTS (
  SELECT 1 FROM equipos AS e
  WHERE e.tipo = 'molino' AND e.marca = 'Eureka'
    AND NOT EXISTS (SELECT 1 FROM calibraciones AS c WHERE c.barista_nombre = c0.barista_nombre AND c.id_molino = e.id_equipo)
);

-- [DIV5] π barista_nombre, id_maquina (calibraciones) ÷ ρ (id_maquina) (π id_equipo (σ tipo = 'maquina' ∧ marca = 'La Marzocco' (equipos)))
SELECT c.barista_nombre
FROM calibraciones AS c
JOIN equipos AS e ON e.id_equipo = c.id_maquina
WHERE e.marca = 'La Marzocco'
GROUP BY c.barista_nombre
HAVING COUNT(DISTINCT c.id_maquina) = (SELECT COUNT(*) FROM equipos WHERE tipo = 'maquina' AND marca = 'La Marzocco');

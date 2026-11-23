-- Unidad 5 · SQL generado por Knex (scripts/unidad5-knex.mjs) sobre cafe_u5_knex

-- [CS01]
select * from "granos" order by "nombre_cafe" asc;

-- [CS02]
select "nombre_cafe", "pais_origen", "puntuacion_sca" from "granos" order by "id_grano" asc;

-- [CS03]
select "nombre_cafe", "pais_origen" from "granos" where "proceso" = 'Natural' order by "nombre_cafe" asc;

-- [CS04]
select "nombre_cafe", "puntuacion_sca" from "granos" where "puntuacion_sca" >= 88 order by "puntuacion_sca" desc;

-- [CS05]
select "nombre_cafe", "puntuacion_sca" from "granos" where "puntuacion_sca" between 85 and 88 order by "puntuacion_sca" asc;

-- [CS06]
select "nombre_cafe", "pais_origen" from "granos" where "pais_origen" in ('México', 'Colombia', 'Perú') order by "pais_origen" asc, "nombre_cafe" asc;

-- [CS07]
select "nombre_cafe", "proceso" from "granos" where "nombre_cafe" ilike '%natural%' order by "nombre_cafe" asc;

-- [CS08]
select "id_calibracion", "barista_nombre", "fecha_hora" from "calibraciones" where "notas_barista" is null order by "id_calibracion" asc;

-- [CS09]
select "nombre_cafe", "puntuacion_sca" from "granos" order by "puntuacion_sca" desc limit 3;

-- [CS10]
select distinct "pais_origen" from "granos" order by "pais_origen" asc;

-- [CS11]
select "codigo_lote", "peso_actual_g", "peso_inicial_g", ROUND(peso_actual_g / peso_inicial_g * 100, 1) AS porcentaje_restante from "lotes" order by "porcentaje_restante" desc, "codigo_lote" asc;

-- [CS12]
select "codigo_lote", "nivel_tueste" from "lotes" where "activo" = true and ("nivel_tueste" = 'Medio' or "nivel_tueste" = 'Oscuro') order by "codigo_lote" asc;

-- [CS13]
select "identificador_local", "marca", "modelo" from "equipos" where not "tipo" = 'molino' order by "identificador_local" asc;

-- [CS14]
select "codigo_lote", "fecha_tueste" from "lotes" where "fecha_tueste" >= '2026-10-01' order by "fecha_tueste" asc;

-- [CS15]
select "id_calibracion", "fecha_hora", EXTRACT(HOUR FROM fecha_hora) AS hora from "calibraciones" where EXTRACT(HOUR FROM fecha_hora) >= 15 order by "fecha_hora" asc;

-- [CS16]
select "nombre_cafe", "puntuacion_sca", CASE WHEN puntuacion_sca >= 90 THEN 'Excepcional' WHEN puntuacion_sca >= 85 THEN 'Excelente' ELSE 'Muy bueno' END AS clasificacion from "granos" order by "puntuacion_sca" desc;

-- [CS17]
select "id_calibracion", "ey_porcentaje", "barista_nombre" from "calibraciones" where "diagnostico" = 'SOBREEXTRAIDA' order by "ey_porcentaje" desc;

-- [CS18]
select "id_calibracion", "ey_porcentaje", "calificacion_sabor" from "calibraciones" where "ey_porcentaje" between 18 and 22 order by "calificacion_sabor" desc, "id_calibracion" asc;

-- [CS19]
select "id_calibracion", "fecha_hora", "barista_nombre" from "calibraciones" order by "fecha_hora" asc limit 5 offset 5;

-- [CS20]
select "codigo_lote", "peso_actual_g" from "lotes" where "activo" = false order by "codigo_lote" asc;

-- [CS21]
select "identificador_local", UPPER(marca || ' ' || modelo) AS equipo, LENGTH(modelo) AS largo_modelo from "equipos" order by "identificador_local" asc;

-- [CS22]
select "nombre_cafe", "finca", "region" from "granos" where "finca" is not null order by "region" asc nulls last, "nombre_cafe" asc;

-- [CS23]
select "id_lote", "descriptor" from "notas_cata" where "descriptor" ilike '%chocolate%' order by "id_nota" asc;

-- [CS24]
select "id_calibracion", COALESCE(notas_barista, 'Sin notas') AS notas from "calibraciones" order by "id_calibracion" asc;

-- [CS25]
select "id_calibracion", "tiempo_segundos", "presion_bar" from "calibraciones" where "tiempo_segundos" between 25 and 30 and "presion_bar" = 9 order by "id_calibracion" asc;

-- [JN01]
select "l"."codigo_lote", "g"."nombre_cafe", "l"."tostaduria" from "lotes" as "l" inner join "granos" as "g" on "g"."id_grano" = "l"."id_grano" order by "l"."codigo_lote" asc;

-- [JN02]
select "c"."id_calibracion", "l"."codigo_lote", "g"."nombre_cafe", "c"."ey_porcentaje" from "calibraciones" as "c" inner join "lotes" as "l" on "l"."id_lote" = "c"."id_lote" inner join "granos" as "g" on "g"."id_grano" = "l"."id_grano" order by "c"."id_calibracion" asc;

-- [JN03]
select "c"."id_calibracion", "m"."identificador_local" as "molino", "q"."identificador_local" as "maquina" from "calibraciones" as "c" inner join "equipos" as "m" on "m"."id_equipo" = "c"."id_molino" inner join "equipos" as "q" on "q"."id_equipo" = "c"."id_maquina" order by "c"."id_calibracion" asc;

-- [JN04]
select "g"."nombre_cafe", "l"."codigo_lote" from "granos" as "g" left join "lotes" as "l" on "l"."id_grano" = "g"."id_grano" order by "g"."nombre_cafe" asc, "l"."codigo_lote" asc;

-- [JN05]
select "l"."codigo_lote" from "lotes" as "l" left join "calibraciones" as "c" on "c"."id_lote" = "l"."id_lote" where "c"."id_calibracion" is null order by "l"."codigo_lote" asc;

-- [JN06]
select "e"."identificador_local", "c"."id_calibracion" from "calibraciones" as "c" right join "equipos" as "e" on "e"."id_equipo" = "c"."id_molino" where "e"."tipo" = 'molino' order by "e"."identificador_local" asc, "c"."id_calibracion" asc;

-- [JN07]
select "l"."codigo_lote", "n"."descriptor" from "lotes" as "l" full outer join "notas_cata" as "n" on "n"."id_lote" = "l"."id_lote" order by "l"."codigo_lote" asc, "n"."descriptor" asc;

-- [JN08]
select "n"."descriptor", "l"."codigo_lote", "g"."nombre_cafe" from "notas_cata" as "n" inner join "lotes" as "l" on "l"."id_lote" = "n"."id_lote" inner join "granos" as "g" on "g"."id_grano" = "l"."id_grano" order by "g"."nombre_cafe" asc, "n"."descriptor" asc;

-- [JN09]
select "c"."id_calibracion", "g"."nombre_cafe", "c"."ey_porcentaje" from "calibraciones" as "c" inner join "lotes" as "l" on "l"."id_lote" = "c"."id_lote" inner join "granos" as "g" on "g"."id_grano" = "l"."id_grano" where "g"."proceso" = 'Lavado' and "c"."diagnostico" = 'EQUILIBRADA' order by "c"."id_calibracion" asc;

-- [JN10]
select "a"."nombre_cafe" as "grano_a", "b"."nombre_cafe" as "grano_b", "a"."pais_origen" from "granos" as "a" inner join "granos" as "b" on "a"."pais_origen" = "b"."pais_origen" and "a"."id_grano" < "b"."id_grano" order by "a"."pais_origen" asc;

-- [JN11]
select "m"."identificador_local" as "molino", "q"."identificador_local" as "maquina" from "equipos" as "m" cross join "equipos" as "q" where "m"."tipo" = 'molino' and "q"."tipo" = 'maquina' order by "molino" asc, "maquina" asc;

-- [JN12]
select "codigo_lote", "descriptor" from "notas_cata" JOIN lotes USING (id_lote) order by "codigo_lote" asc, "descriptor" asc;

-- [JN13]
select "c"."id_calibracion", "g"."nombre_cafe", "l"."codigo_lote", m.marca || ' ' || m.modelo AS molino, q.marca || ' ' || q.modelo AS maquina, "c"."ratio_calculado", "c"."diagnostico" from "calibraciones" as "c" inner join "lotes" as "l" on "l"."id_lote" = "c"."id_lote" inner join "granos" as "g" on "g"."id_grano" = "l"."id_grano" inner join "equipos" as "m" on "m"."id_equipo" = "c"."id_molino" inner join "equipos" as "q" on "q"."id_equipo" = "c"."id_maquina" order by "c"."id_calibracion" asc;

-- [JN14]
select "l"."codigo_lote", "u"."fecha_hora" as "ultima_calibracion", "u"."ey_porcentaje" from "lotes" as "l" LEFT JOIN LATERAL (select "c"."fecha_hora", "c"."ey_porcentaje" from "calibraciones" as "c" where c.id_lote = l.id_lote order by "c"."fecha_hora" desc limit 1) u ON TRUE order by "l"."codigo_lote" asc;

-- [JN15]
select "l"."codigo_lote", "l"."fecha_tueste", "c"."fecha_hora" from "lotes" as "l" inner join "calibraciones" as "c" on "c"."id_lote" = "l"."id_lote" and "c"."fecha_hora" > l.fecha_tueste + INTERVAL '30 days' order by "c"."fecha_hora" asc;

-- [AG01]
select count(*) as "total_granos" from "granos";

-- [AG02]
select "proceso", count(*) as "granos" from "granos" group by "proceso" order by "granos" desc, "proceso" asc;

-- [AG03]
select "pais_origen", ROUND(AVG(puntuacion_sca), 2) AS sca_promedio from "granos" group by "pais_origen" order by "sca_promedio" desc;

-- [AG04]
select max("puntuacion_sca") as "sca_maxima", min("puntuacion_sca") as "sca_minima" from "granos";

-- [AG05]
select sum("peso_actual_g") as "gramos_disponibles" from "lotes" where "activo" = true;

-- [AG06]
select "diagnostico", count(*) as "calibraciones" from "calibraciones" group by "diagnostico" order by "calibraciones" desc;

-- [AG07]
select "l"."codigo_lote", COUNT(*) AS calibraciones, ROUND(AVG(c.ey_porcentaje), 2) AS ey_promedio, ROUND(AVG(c.calificacion_sabor), 1) AS sabor_promedio from "calibraciones" as "c" inner join "lotes" as "l" on "l"."id_lote" = "c"."id_lote" group by "l"."codigo_lote" order by "l"."codigo_lote" asc;

-- [AG08]
select "id_lote", count(*) as "calibraciones" from "calibraciones" group by "id_lote" having COUNT(*) > 1 order by "calibraciones" desc, "id_lote" asc;

-- [AG09]
select count(distinct "barista_nombre") as "baristas" from "calibraciones";

-- [AG10]
select "barista_nombre", COUNT(*) AS calibraciones, ROUND(AVG(calificacion_sabor), 1) AS sabor_promedio from "calibraciones" group by "barista_nombre" order by "sabor_promedio" desc, "barista_nombre" asc;

-- [AG11]
select "e"."identificador_local", count("c"."id_calibracion") as "usos" from "equipos" as "e" left join "calibraciones" as "c" on "c"."id_molino" = "e"."id_equipo" where "e"."tipo" = 'molino' group by "e"."identificador_local" order by "usos" desc, "e"."identificador_local" asc;

-- [AG12]
select "l"."codigo_lote", STRING_AGG(n.descriptor, ', ' ORDER BY n.descriptor) AS notas from "lotes" as "l" inner join "notas_cata" as "n" on "n"."id_lote" = "l"."id_lote" group by "l"."codigo_lote" order by "l"."codigo_lote" asc;

-- [AG13]
select "e"."identificador_local", ROUND(AVG(c.dosis_in_g), 2) AS dosis, ROUND(AVG(c.yield_out_g), 2) AS bebida, ROUND(AVG(c.tiempo_segundos), 1) AS tiempo from "calibraciones" as "c" inner join "equipos" as "e" on "e"."id_equipo" = "c"."id_maquina" group by "e"."identificador_local" order by "e"."identificador_local" asc;

-- [AG14]
select "nivel_tueste", count(*) as "lotes", sum("peso_inicial_g") as "gramos_iniciales", sum("peso_actual_g") as "gramos_restantes", ROUND((1 - SUM(peso_actual_g) / SUM(peso_inicial_g)) * 100, 1) AS porcentaje_consumido from "lotes" group by "nivel_tueste" order by "nivel_tueste" asc;

-- [AG15]
select TO_CHAR(DATE_TRUNC('month', fecha_hora), 'YYYY-MM') AS mes, COUNT(*) AS calibraciones, ROUND(AVG(ey_porcentaje), 2) AS ey_promedio from "calibraciones" group by "mes" order by "mes" asc;

-- [VI01] crear vista
create or replace view "v_ficha_calibracion" as select "c"."id_calibracion", "c"."fecha_hora", "g"."nombre_cafe", "l"."codigo_lote", m.marca || ' ' || m.modelo AS molino, q.marca || ' ' || q.modelo AS maquina, "c"."dosis_in_g", "c"."yield_out_g", "c"."ratio_calculado", "c"."ey_porcentaje", "c"."diagnostico", "c"."calificacion_sabor", "c"."barista_nombre" from "calibraciones" as "c" inner join "lotes" as "l" on "l"."id_lote" = "c"."id_lote" inner join "granos" as "g" on "g"."id_grano" = "l"."id_grano" inner join "equipos" as "m" on "m"."id_equipo" = "c"."id_molino" inner join "equipos" as "q" on "q"."id_equipo" = "c"."id_maquina";

-- [VI01]
select "id_calibracion", "nombre_cafe", "codigo_lote", "ratio_calculado", "diagnostico" from "v_ficha_calibracion" order by "id_calibracion" asc;

-- [VI02] crear vista
create or replace view "v_existencia_lotes" as select "l"."codigo_lote", "g"."nombre_cafe", "l"."peso_actual_g", "l"."peso_inicial_g", ROUND(l.peso_actual_g / l.peso_inicial_g * 100, 1) AS porcentaje_restante, CASE WHEN l.peso_actual_g = 0 THEN 'Agotado' WHEN l.peso_actual_g / l.peso_inicial_g < 0.2 THEN 'Queda poco' ELSE 'Disponible' END AS estado from "lotes" as "l" inner join "granos" as "g" on "g"."id_grano" = "l"."id_grano";

-- [VI02]
select * from "v_existencia_lotes" order by "porcentaje_restante" asc, "codigo_lote" asc;

-- [VI03] crear vista
create or replace view "v_resumen_grano" as select "g"."id_grano", "g"."nombre_cafe", "g"."puntuacion_sca", count(distinct "l"."id_lote") as "lotes", count("c"."id_calibracion") as "calibraciones", ROUND(AVG(c.ey_porcentaje), 2) AS ey_promedio, max("c"."calificacion_sabor") as "mejor_sabor" from "granos" as "g" left join "lotes" as "l" on "l"."id_grano" = "g"."id_grano" left join "calibraciones" as "c" on "c"."id_lote" = "l"."id_lote" group by "g"."id_grano", "g"."nombre_cafe", "g"."puntuacion_sca";

-- [VI03]
select "nombre_cafe", "lotes", "calibraciones", "ey_promedio", "mejor_sabor" from "v_resumen_grano" order by "id_grano" asc;

-- [VI04] crear vista
create or replace view "v_mejor_receta_lote" as select distinct on ("c"."id_lote") "c"."id_lote", "l"."codigo_lote", "c"."id_calibracion", "c"."dosis_in_g", "c"."yield_out_g", "c"."tiempo_segundos", "c"."ajuste_molienda", "c"."calificacion_sabor" from "calibraciones" as "c" inner join "lotes" as "l" on "l"."id_lote" = "c"."id_lote" order by "c"."id_lote" asc, "c"."calificacion_sabor" desc, "c"."fecha_hora" desc;

-- [VI04]
select "codigo_lote", "id_calibracion", "dosis_in_g", "yield_out_g", "calificacion_sabor" from "v_mejor_receta_lote" order by "codigo_lote" asc;

-- [VI05] crear vista
create or replace view "v_uso_equipos" as select "e"."identificador_local", "e"."tipo", e.marca || ' ' || e.modelo AS equipo, (select count(*) from "calibraciones" as "c" where c.id_molino = e.id_equipo OR c.id_maquina = e.id_equipo) as "usos" from "equipos" as "e";

-- [VI05]
select * from "v_uso_equipos" order by "usos" desc, "identificador_local" asc;

-- [FN01]
CREATE OR REPLACE FUNCTION fn_calcular_ey(tds NUMERIC, bebida NUMERIC, dosis NUMERIC)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT ROUND(tds * bebida / dosis, 2);
$$;

-- [FN01]
select "id_calibracion", "ey_porcentaje" as "ey_guardado", fn_calcular_ey(tds_porcentaje, yield_out_g, dosis_in_g) AS ey_funcion from "calibraciones" order by "id_calibracion" asc;

-- [FN02]
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

-- [FN02]
select "codigo_lote", fn_porcentaje_existencia(id_lote) AS porcentaje from "lotes" order by "codigo_lote" asc;

-- [FN03]
CREATE OR REPLACE FUNCTION fn_historial_lote(p_codigo VARCHAR)
RETURNS TABLE (id_calibracion INT, fecha_hora TIMESTAMP, ey_porcentaje NUMERIC, diagnostico VARCHAR, calificacion_sabor NUMERIC)
LANGUAGE sql STABLE AS $$
  SELECT c.id_calibracion, c.fecha_hora, c.ey_porcentaje, c.diagnostico, c.calificacion_sabor
  FROM calibraciones c JOIN lotes l ON l.id_lote = c.id_lote
  WHERE l.codigo_lote = p_codigo ORDER BY c.fecha_hora;
$$;

-- [FN03]
select * from fn_historial_lote('LT-2026-001');

-- [FN04]
CREATE TABLE IF NOT EXISTS bitacora_existencia (
  id_bitacora   SERIAL PRIMARY KEY,
  id_lote       INT NOT NULL REFERENCES lotes (id_lote),
  peso_anterior DECIMAL(10,2) NOT NULL,
  peso_nuevo    DECIMAL(10,2) NOT NULL,
  diferencia    DECIMAL(10,2) NOT NULL,
  fecha         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- [FN04]
CREATE OR REPLACE FUNCTION fn_bitacora_existencia() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO bitacora_existencia (id_lote, peso_anterior, peso_nuevo, diferencia)
  VALUES (NEW.id_lote, OLD.peso_actual_g, NEW.peso_actual_g, NEW.peso_actual_g - OLD.peso_actual_g);
  RETURN NEW;
END;
$$;

-- [FN04]
DROP TRIGGER IF EXISTS trg_bitacora_existencia ON lotes;

-- [FN04]
CREATE TRIGGER trg_bitacora_existencia
AFTER UPDATE OF peso_actual_g ON lotes
FOR EACH ROW WHEN (OLD.peso_actual_g IS DISTINCT FROM NEW.peso_actual_g)
EXECUTE FUNCTION fn_bitacora_existencia();

-- [FN04 prueba]
update "lotes" set "peso_actual_g" = "peso_actual_g" - 18 where "codigo_lote" = 'LT-2026-002';

-- [FN04]
select "b"."id_lote", "b"."peso_anterior", "b"."peso_nuevo", "b"."diferencia" from "bitacora_existencia" as "b" order by "b"."id_bitacora" asc;

-- [FN05]
CREATE OR REPLACE FUNCTION fn_desactivar_lote_agotado() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.peso_actual_g = 0 THEN
    NEW.activo := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

-- [FN05]
DROP TRIGGER IF EXISTS trg_desactivar_lote_agotado ON lotes;

-- [FN05]
CREATE TRIGGER trg_desactivar_lote_agotado
BEFORE UPDATE OF peso_actual_g ON lotes
FOR EACH ROW EXECUTE FUNCTION fn_desactivar_lote_agotado();

-- [FN05 prueba]
update "lotes" set "peso_actual_g" = 0 where "codigo_lote" = 'LT-2026-006';

-- [FN05]
select "codigo_lote", "peso_actual_g", "activo" from "lotes" where "codigo_lote" = 'LT-2026-006';

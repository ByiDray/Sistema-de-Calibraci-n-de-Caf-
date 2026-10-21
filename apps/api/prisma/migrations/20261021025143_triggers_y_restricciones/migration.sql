-- Restricciones CHECK según el diccionario de datos (documento A2)

ALTER TABLE "granos"
  ADD CONSTRAINT "granos_puntuacion_sca_rango" CHECK ("puntuacion_sca" BETWEEN 0 AND 100),
  ADD CONSTRAINT "granos_proceso_catalogo" CHECK ("proceso" IN ('Lavado', 'Natural', 'Honey', 'Anaeróbico'));

ALTER TABLE "lotes"
  ADD CONSTRAINT "lotes_peso_inicial_positivo" CHECK ("peso_inicial_g" > 0),
  ADD CONSTRAINT "lotes_peso_actual_rango" CHECK ("peso_actual_g" >= 0 AND "peso_actual_g" <= "peso_inicial_g"),
  ADD CONSTRAINT "lotes_nivel_tueste_catalogo" CHECK ("nivel_tueste" IN ('Claro', 'Medio', 'Oscuro'));

ALTER TABLE "equipos"
  ADD CONSTRAINT "equipos_tipo_catalogo" CHECK ("tipo" IN ('molino', 'maquina'));

ALTER TABLE "calibraciones"
  ADD CONSTRAINT "calibraciones_dosis_positiva" CHECK ("dosis_in_g" > 0),
  ADD CONSTRAINT "calibraciones_yield_positivo" CHECK ("yield_out_g" > 0),
  ADD CONSTRAINT "calibraciones_ajuste_positivo" CHECK ("ajuste_molienda" > 0),
  ADD CONSTRAINT "calibraciones_tiempo_positivo" CHECK ("tiempo_segundos" > 0),
  ADD CONSTRAINT "calibraciones_temperatura_rango" CHECK ("temperatura_c" BETWEEN 0 AND 100),
  ADD CONSTRAINT "calibraciones_presion_rango" CHECK ("presion_bar" BETWEEN 0 AND 15),
  ADD CONSTRAINT "calibraciones_tds_rango" CHECK ("tds_porcentaje" > 0 AND "tds_porcentaje" <= 100),
  ADD CONSTRAINT "calibraciones_calificacion_rango" CHECK ("calificacion_sabor" BETWEEN 0 AND 10),
  ADD CONSTRAINT "calibraciones_diagnostico_catalogo" CHECK ("diagnostico" IN ('EQUILIBRADA', 'SUBEXTRAIDA', 'SOBREEXTRAIDA'));

-- Trigger: recalcula los campos derivados de CALIBRACIONES (redundancia controlada).
--   ratio = yield_out_g / dosis_in_g
--   EY    = tds_porcentaje * yield_out_g / dosis_in_g
--   diagnóstico: EQUILIBRADA si 18 <= EY <= 22; SUBEXTRAIDA si EY < 18; SOBREEXTRAIDA si EY > 22
CREATE OR REPLACE FUNCTION calibraciones_calcular_derivados() RETURNS trigger AS $$
DECLARE
  ey numeric;
  tipo_molino text;
  tipo_maquina text;
BEGIN
  NEW."ratio_calculado" := '1:' || to_char(round(NEW."yield_out_g" / NEW."dosis_in_g", 1), 'FM999990.0');
  ey := round(NEW."tds_porcentaje" * NEW."yield_out_g" / NEW."dosis_in_g", 2);
  IF ey > 999.99 THEN
    RAISE EXCEPTION 'EY fuera de rango: %', ey;
  END IF;
  NEW."ey_porcentaje" := ey;
  NEW."diagnostico" := CASE
    WHEN ey < 18 THEN 'SUBEXTRAIDA'
    WHEN ey > 22 THEN 'SOBREEXTRAIDA'
    ELSE 'EQUILIBRADA'
  END;

  -- Regla: id_molino debe ser un equipo de tipo molino e id_maquina uno de tipo maquina.
  SELECT "tipo" INTO tipo_molino FROM "equipos" WHERE "id_equipo" = NEW."id_molino";
  SELECT "tipo" INTO tipo_maquina FROM "equipos" WHERE "id_equipo" = NEW."id_maquina";
  IF tipo_molino IS DISTINCT FROM 'molino' THEN
    RAISE EXCEPTION 'id_molino debe ser un equipo de tipo molino';
  END IF;
  IF tipo_maquina IS DISTINCT FROM 'maquina' THEN
    RAISE EXCEPTION 'id_maquina debe ser un equipo de tipo maquina';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calibraciones_derivados_trg
  BEFORE INSERT OR UPDATE ON "calibraciones"
  FOR EACH ROW EXECUTE FUNCTION calibraciones_calcular_derivados();

-- Unidad 4.5 · 10 usuarios y sus permisos en consola (psql). Generado por scripts/usuarios-frameworks.ts
-- Uso: psql -h localhost -U postgres -d cafe -f docs/unidad4/usuarios_consola.sql
-- Las contraseñas son solo de práctica.

-- Borra los usuarios de práctica anteriores con este prefijo (si existen)
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT rolname FROM pg_roles WHERE rolname LIKE 'con\_%' ORDER BY rolcanlogin DESC LOOP
    EXECUTE format('DROP OWNED BY %I', r.rolname);
    EXECUTE format('DROP ROLE %I', r.rolname);
  END LOOP; END $$;

CREATE ROLE con_rol_barista NOLOGIN;
CREATE ROLE con_rol_tostador NOLOGIN;
CREATE ROLE con_rol_calidad NOLOGIN;
CREATE ROLE con_rol_lectura NOLOGIN;
CREATE ROLE con_admin_cafe LOGIN PASSWORD 'Practica#con_admin_cafe';
CREATE ROLE con_api_cafe LOGIN PASSWORD 'Practica#con_api_cafe' CONNECTION LIMIT 20;
CREATE ROLE con_barista_ana LOGIN PASSWORD 'Practica#con_barista_ana' IN ROLE con_rol_barista;
CREATE ROLE con_barista_carlos LOGIN PASSWORD 'Practica#con_barista_carlos' IN ROLE con_rol_barista;
CREATE ROLE con_barista_sofia LOGIN PASSWORD 'Practica#con_barista_sofia' IN ROLE con_rol_barista;
CREATE ROLE con_practicante_juan LOGIN PASSWORD 'Practica#con_practicante_juan' VALID UNTIL '2026-12-31' IN ROLE con_rol_barista;
CREATE ROLE con_tostador_norte LOGIN PASSWORD 'Practica#con_tostador_norte' IN ROLE con_rol_tostador;
CREATE ROLE con_tostador_local LOGIN PASSWORD 'Practica#con_tostador_local' IN ROLE con_rol_tostador;
CREATE ROLE con_calidad_andy LOGIN PASSWORD 'Practica#con_calidad_andy' IN ROLE con_rol_calidad;
CREATE ROLE con_auditor_uni LOGIN PASSWORD 'Practica#con_auditor_uni' IN ROLE con_rol_lectura;
GRANT CONNECT ON DATABASE cafe TO con_rol_barista, con_rol_tostador, con_rol_calidad, con_rol_lectura, con_api_cafe, con_admin_cafe;
GRANT USAGE ON SCHEMA public TO con_rol_barista, con_rol_tostador, con_rol_calidad, con_rol_lectura, con_api_cafe, con_admin_cafe;
GRANT SELECT ON granos, lotes, equipos, notas_cata TO con_rol_barista;
GRANT SELECT, INSERT ON calibraciones TO con_rol_barista;
GRANT USAGE ON SEQUENCE calibraciones_id_calibracion_seq TO con_rol_barista;
GRANT SELECT, INSERT, UPDATE ON granos, lotes TO con_rol_tostador;
GRANT USAGE ON SEQUENCE granos_id_grano_seq, lotes_id_lote_seq TO con_rol_tostador;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO con_rol_lectura;
GRANT con_rol_lectura TO con_rol_calidad;
GRANT INSERT, DELETE ON notas_cata TO con_rol_calidad;
GRANT USAGE ON SEQUENCE notas_cata_id_nota_seq TO con_rol_calidad;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO con_api_cafe;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO con_api_cafe;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO con_admin_cafe WITH GRANT OPTION;

\du con_*

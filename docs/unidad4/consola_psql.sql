-- =====================================================================
-- Unidad 4 · Modo consola (psql) · App BD Café
-- 4.1 crea la base, 4.2 crea las tablas y gestiona registros,
-- 4.3 crea las restricciones (NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY,
-- CHECK, DEFAULT e INDEX).
--
-- Ejecutar desde la consola:
--   psql -h localhost -U postgres -d postgres -f docs/unidad4/consola_psql.sql
-- Crea una base aparte (cafe_consola); no toca la base "cafe" de la app.
-- =====================================================================

-- ===================== 4.1 CREAR LA BASE DE DATOS =====================
DROP DATABASE IF EXISTS cafe_consola;

CREATE DATABASE cafe_consola
  WITH OWNER = postgres
       ENCODING = 'UTF8'
       TEMPLATE = template0
       CONNECTION LIMIT = 20;

COMMENT ON DATABASE cafe_consola IS 'App BD Café: trazabilidad y calibración de café de especialidad';

\l cafe_consola
\c cafe_consola


-- ===================== 4.2 y 4.3 CREAR LAS TABLAS CON SUS RESTRICCIONES =====================

CREATE TABLE granos (
  id_grano        SERIAL        CONSTRAINT granos_pkey PRIMARY KEY,
  nombre_cafe     VARCHAR(100)  NOT NULL,
  finca           VARCHAR(100),
  productor       VARCHAR(100),
  pais_origen     VARCHAR(50)   NOT NULL,
  region          VARCHAR(100),
  varietal        VARCHAR(50),
  proceso         VARCHAR(50)   NOT NULL
                  CONSTRAINT granos_proceso_catalogo CHECK (proceso IN ('Lavado', 'Natural', 'Honey', 'Anaeróbico')),
  puntuacion_sca  DECIMAL(5,2)  NOT NULL
                  CONSTRAINT granos_puntuacion_sca_rango CHECK (puntuacion_sca BETWEEN 0 AND 100),
  fecha_creacion  TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipos (
  id_equipo           SERIAL       CONSTRAINT equipos_pkey PRIMARY KEY,
  tipo                VARCHAR(50)  NOT NULL
                      CONSTRAINT equipos_tipo_catalogo CHECK (tipo IN ('molino', 'maquina')),
  marca               VARCHAR(50)  NOT NULL,
  modelo              VARCHAR(50)  NOT NULL,
  identificador_local VARCHAR(20)  NOT NULL CONSTRAINT equipos_identificador_local_key UNIQUE
);

CREATE TABLE lotes (
  id_lote         SERIAL         CONSTRAINT lotes_pkey PRIMARY KEY,
  id_grano        INTEGER        NOT NULL
                  CONSTRAINT lotes_id_grano_fkey REFERENCES granos (id_grano) ON DELETE RESTRICT ON UPDATE CASCADE,
  codigo_lote     VARCHAR(30)    NOT NULL CONSTRAINT lotes_codigo_lote_key UNIQUE,
  tostaduria      VARCHAR(100)   NOT NULL,
  fecha_tueste    DATE           NOT NULL,
  nivel_tueste    VARCHAR(30)    NOT NULL
                  CONSTRAINT lotes_nivel_tueste_catalogo CHECK (nivel_tueste IN ('Claro', 'Medio', 'Oscuro')),
  peso_inicial_g  DECIMAL(10,2)  NOT NULL CONSTRAINT lotes_peso_inicial_positivo CHECK (peso_inicial_g > 0),
  peso_actual_g   DECIMAL(10,2)  NOT NULL,
  activo          BOOLEAN        NOT NULL DEFAULT true,
  -- CHECK de tabla: compara dos columnas
  CONSTRAINT lotes_peso_actual_rango CHECK (peso_actual_g >= 0 AND peso_actual_g <= peso_inicial_g)
);

CREATE TABLE calibraciones (
  id_calibracion     SERIAL        CONSTRAINT calibraciones_pkey PRIMARY KEY,
  id_lote            INTEGER       NOT NULL
                     CONSTRAINT calibraciones_id_lote_fkey REFERENCES lotes (id_lote) ON DELETE RESTRICT ON UPDATE CASCADE,
  id_molino          INTEGER       NOT NULL
                     CONSTRAINT calibraciones_id_molino_fkey REFERENCES equipos (id_equipo) ON DELETE RESTRICT ON UPDATE CASCADE,
  id_maquina         INTEGER       NOT NULL
                     CONSTRAINT calibraciones_id_maquina_fkey REFERENCES equipos (id_equipo) ON DELETE RESTRICT ON UPDATE CASCADE,
  fecha_hora         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dosis_in_g         DECIMAL(5,2)  NOT NULL CONSTRAINT calibraciones_dosis_positiva CHECK (dosis_in_g > 0),
  ajuste_molienda    DECIMAL(4,2)  NOT NULL CONSTRAINT calibraciones_ajuste_positivo CHECK (ajuste_molienda > 0),
  temperatura_c      DECIMAL(4,1)  NOT NULL CONSTRAINT calibraciones_temperatura_rango CHECK (temperatura_c BETWEEN 0 AND 100),
  presion_bar        DECIMAL(3,1)  NOT NULL CONSTRAINT calibraciones_presion_rango CHECK (presion_bar BETWEEN 0 AND 15),
  yield_out_g        DECIMAL(5,2)  NOT NULL CONSTRAINT calibraciones_yield_positivo CHECK (yield_out_g > 0),
  tiempo_segundos    DECIMAL(5,1)  NOT NULL CONSTRAINT calibraciones_tiempo_positivo CHECK (tiempo_segundos > 0),
  ratio_calculado    VARCHAR(10)   NOT NULL,
  tds_porcentaje     DECIMAL(5,2)  NOT NULL CONSTRAINT calibraciones_tds_rango CHECK (tds_porcentaje > 0 AND tds_porcentaje <= 100),
  ey_porcentaje      DECIMAL(5,2)  NOT NULL,
  diagnostico        VARCHAR(150)  NOT NULL
                     CONSTRAINT calibraciones_diagnostico_catalogo CHECK (diagnostico IN ('EQUILIBRADA', 'SUBEXTRAIDA', 'SOBREEXTRAIDA')),
  calificacion_sabor DECIMAL(3,1)  NOT NULL CONSTRAINT calibraciones_calificacion_rango CHECK (calificacion_sabor BETWEEN 0 AND 10),
  notas_barista      VARCHAR(255),
  barista_nombre     VARCHAR(100)  NOT NULL
);

CREATE TABLE notas_cata (
  id_nota     SERIAL       CONSTRAINT notas_cata_pkey PRIMARY KEY,
  id_lote     INTEGER      NOT NULL
              CONSTRAINT notas_cata_id_lote_fkey REFERENCES lotes (id_lote) ON DELETE RESTRICT ON UPDATE CASCADE,
  descriptor  VARCHAR(80)  NOT NULL,
  -- UNIQUE compuesto: no se repite un descriptor en el mismo lote
  CONSTRAINT notas_cata_id_lote_descriptor_key UNIQUE (id_lote, descriptor)
);

-- INDEX: las llaves foráneas no se indexan solas
CREATE INDEX lotes_id_grano_idx ON lotes (id_grano);
CREATE INDEX calibraciones_id_lote_idx ON calibraciones (id_lote);

\dt
\d lotes


-- ===================== 4.2 GESTIONAR REGISTROS =====================

-- Alta
INSERT INTO granos (nombre_cafe, finca, productor, pais_origen, region, varietal, proceso, puntuacion_sca) VALUES
  ('Chiapas Altura Selecta', 'Finca La Esperanza', 'Cooperativa Sierra Madre', 'México', 'Chiapas', 'Typica', 'Lavado', 86.50),
  ('Geisha Boquete', 'Finca Lérida', 'Hacienda La Esmeralda', 'Panamá', 'Boquete', 'Geisha', 'Lavado', 92.50),
  ('Sidama Natural', 'Bombe', 'Unión Sidama', 'Etiopía', 'Sidama', 'Heirloom', 'Natural', 87.75);

INSERT INTO equipos (tipo, marca, modelo, identificador_local) VALUES
  ('molino', 'Eureka', 'Mignon Specialita', 'MOL-01'),
  ('maquina', 'La Marzocco', 'Linea Mini', 'MAQ-01');

-- activo no se envía: toma su DEFAULT (true)
INSERT INTO lotes (id_grano, codigo_lote, tostaduria, fecha_tueste, nivel_tueste, peso_inicial_g, peso_actual_g) VALUES
  (1, 'LT-2026-001', 'Tostaduría Local', '2026-09-20', 'Medio', 1000, 1000),
  (2, 'LT-2026-002', 'Tostaduría Local', '2026-09-22', 'Claro', 1000, 1000),
  (3, 'LT-2026-003', 'Tostaduría Norte', '2026-09-25', 'Medio', 1000, 1000);

-- fecha_hora no se envía: toma su DEFAULT (CURRENT_TIMESTAMP)
INSERT INTO calibraciones (id_lote, id_molino, id_maquina, dosis_in_g, ajuste_molienda, temperatura_c, presion_bar,
                           yield_out_g, tiempo_segundos, ratio_calculado, tds_porcentaje, ey_porcentaje, diagnostico,
                           calificacion_sabor, notas_barista, barista_nombre) VALUES
  (1, 1, 2, 18, 12, 93, 9, 36, 28, '1:2.0', 9.90, 19.80, 'EQUILIBRADA', 8, 'Chocolate y caramelo', 'Carlos Ramírez');

INSERT INTO notas_cata (id_lote, descriptor) VALUES
  (1, 'Chocolate amargo'), (1, 'Caramelo'), (2, 'Jazmín'), (3, 'Arándano');

-- Modificación: descontar los 18 g usados en la calibración
UPDATE lotes SET peso_actual_g = peso_actual_g - 18 WHERE codigo_lote = 'LT-2026-001';

-- Baja: quitar una nota de cata
DELETE FROM notas_cata WHERE id_lote = 3 AND descriptor = 'Arándano';

-- Consulta
SELECT l.codigo_lote, g.nombre_cafe, l.peso_actual_g, l.activo
FROM lotes l JOIN granos g ON g.id_grano = l.id_grano
ORDER BY l.codigo_lote;

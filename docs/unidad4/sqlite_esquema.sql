-- =====================================================================
-- Unidad 4.6 · Esquema de App BD Café traducido de PostgreSQL a SQLite
-- SERIAL → INTEGER PRIMARY KEY AUTOINCREMENT · VARCHAR/DECIMAL → TEXT/NUMERIC
-- BOOLEAN → INTEGER (0/1) · DATE/TIMESTAMP → TEXT en formato ISO 8601
-- Las llaves foráneas solo se aplican con PRAGMA foreign_keys = ON.
-- El trigger de calibraciones no se traslada: ratio, EY y diagnóstico llegan como datos.
-- =====================================================================
PRAGMA foreign_keys = ON;

CREATE TABLE granos (
  id_grano        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_cafe     TEXT    NOT NULL,
  finca           TEXT,
  productor       TEXT,
  pais_origen     TEXT    NOT NULL,
  region          TEXT,
  varietal        TEXT,
  proceso         TEXT    NOT NULL CHECK (proceso IN ('Lavado', 'Natural', 'Honey', 'Anaeróbico')),
  puntuacion_sca  NUMERIC NOT NULL CHECK (puntuacion_sca BETWEEN 0 AND 100),
  fecha_creacion  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipos (
  id_equipo           INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo                TEXT NOT NULL CHECK (tipo IN ('molino', 'maquina')),
  marca               TEXT NOT NULL,
  modelo              TEXT NOT NULL,
  identificador_local TEXT NOT NULL UNIQUE
);

CREATE TABLE lotes (
  id_lote         INTEGER PRIMARY KEY AUTOINCREMENT,
  id_grano        INTEGER NOT NULL REFERENCES granos (id_grano) ON DELETE RESTRICT ON UPDATE CASCADE,
  codigo_lote     TEXT    NOT NULL UNIQUE,
  tostaduria      TEXT    NOT NULL,
  fecha_tueste    TEXT    NOT NULL,
  nivel_tueste    TEXT    NOT NULL CHECK (nivel_tueste IN ('Claro', 'Medio', 'Oscuro')),
  peso_inicial_g  NUMERIC NOT NULL CHECK (peso_inicial_g > 0),
  peso_actual_g   NUMERIC NOT NULL,
  activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  CHECK (peso_actual_g >= 0 AND peso_actual_g <= peso_inicial_g)
);

CREATE TABLE calibraciones (
  id_calibracion     INTEGER PRIMARY KEY AUTOINCREMENT,
  id_lote            INTEGER NOT NULL REFERENCES lotes (id_lote) ON DELETE RESTRICT ON UPDATE CASCADE,
  id_molino          INTEGER NOT NULL REFERENCES equipos (id_equipo) ON DELETE RESTRICT ON UPDATE CASCADE,
  id_maquina         INTEGER NOT NULL REFERENCES equipos (id_equipo) ON DELETE RESTRICT ON UPDATE CASCADE,
  fecha_hora         TEXT    NOT NULL,
  dosis_in_g         NUMERIC NOT NULL CHECK (dosis_in_g > 0),
  ajuste_molienda    NUMERIC NOT NULL CHECK (ajuste_molienda > 0),
  temperatura_c      NUMERIC NOT NULL CHECK (temperatura_c BETWEEN 0 AND 100),
  presion_bar        NUMERIC NOT NULL CHECK (presion_bar BETWEEN 0 AND 15),
  yield_out_g        NUMERIC NOT NULL CHECK (yield_out_g > 0),
  tiempo_segundos    NUMERIC NOT NULL CHECK (tiempo_segundos > 0),
  ratio_calculado    TEXT    NOT NULL,
  tds_porcentaje     NUMERIC NOT NULL CHECK (tds_porcentaje > 0 AND tds_porcentaje <= 100),
  ey_porcentaje      NUMERIC NOT NULL,
  diagnostico        TEXT    NOT NULL CHECK (diagnostico IN ('EQUILIBRADA', 'SUBEXTRAIDA', 'SOBREEXTRAIDA')),
  calificacion_sabor NUMERIC NOT NULL CHECK (calificacion_sabor BETWEEN 0 AND 10),
  notas_barista      TEXT,
  barista_nombre     TEXT    NOT NULL
);

CREATE TABLE notas_cata (
  id_nota     INTEGER PRIMARY KEY AUTOINCREMENT,
  id_lote     INTEGER NOT NULL REFERENCES lotes (id_lote) ON DELETE RESTRICT ON UPDATE CASCADE,
  descriptor  TEXT    NOT NULL,
  UNIQUE (id_lote, descriptor)
);

CREATE INDEX lotes_id_grano_idx ON lotes (id_grano);
CREATE INDEX calibraciones_id_lote_idx ON calibraciones (id_lote);

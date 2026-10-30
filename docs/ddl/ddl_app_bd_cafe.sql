-- =====================================================================
-- Actividad: Lenguaje de definición de datos (DDL) · App BD Café
-- 5 CREATE TABLE, 5 ALTER TABLE y 5 DROP TABLE.
--
-- El DDL de las tablas lo genera el framework Prisma a partir de
-- apps/api/prisma/schema.prisma (npx prisma migrate diff ... --script).
--
-- Todo corre en un esquema aparte (practica_ddl) dentro de una transacción
-- que termina en ROLLBACK: la base real del proyecto (esquema public) no cambia.
-- =====================================================================
BEGIN;

CREATE SCHEMA practica_ddl;
SET search_path TO practica_ddl;


-- ===================== CREATE TABLE ==================================

-- [CT1] Tabla granos (modelo Grano)
CREATE TABLE "granos" (
    "id_grano" SERIAL NOT NULL,
    "nombre_cafe" VARCHAR(100) NOT NULL,
    "finca" VARCHAR(100),
    "productor" VARCHAR(100),
    "pais_origen" VARCHAR(50) NOT NULL,
    "region" VARCHAR(100),
    "varietal" VARCHAR(50),
    "proceso" VARCHAR(50) NOT NULL,
    "puntuacion_sca" DECIMAL(5,2) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "granos_pkey" PRIMARY KEY ("id_grano")
);

-- [CT2] Tabla lotes (modelo Lote)
CREATE TABLE "lotes" (
    "id_lote" SERIAL NOT NULL,
    "id_grano" INTEGER NOT NULL,
    "codigo_lote" VARCHAR(30) NOT NULL,
    "tostaduria" VARCHAR(100) NOT NULL,
    "fecha_tueste" DATE NOT NULL,
    "nivel_tueste" VARCHAR(30) NOT NULL,
    "peso_inicial_g" DECIMAL(10,2) NOT NULL,
    "peso_actual_g" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id_lote")
);

-- [CT3] Tabla equipos (modelo Equipo)
CREATE TABLE "equipos" (
    "id_equipo" SERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "marca" VARCHAR(50) NOT NULL,
    "modelo" VARCHAR(50) NOT NULL,
    "identificador_local" VARCHAR(20) NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id_equipo")
);

-- [CT4] Tabla calibraciones (modelo Calibracion)
CREATE TABLE "calibraciones" (
    "id_calibracion" SERIAL NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "id_molino" INTEGER NOT NULL,
    "id_maquina" INTEGER NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "dosis_in_g" DECIMAL(5,2) NOT NULL,
    "ajuste_molienda" DECIMAL(4,2) NOT NULL,
    "temperatura_c" DECIMAL(4,1) NOT NULL,
    "presion_bar" DECIMAL(3,1) NOT NULL,
    "yield_out_g" DECIMAL(5,2) NOT NULL,
    "tiempo_segundos" DECIMAL(5,1) NOT NULL,
    "ratio_calculado" VARCHAR(10) NOT NULL,
    "tds_porcentaje" DECIMAL(5,2) NOT NULL,
    "ey_porcentaje" DECIMAL(5,2) NOT NULL,
    "diagnostico" VARCHAR(150) NOT NULL,
    "calificacion_sabor" DECIMAL(3,1) NOT NULL,
    "notas_barista" VARCHAR(255),
    "barista_nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "calibraciones_pkey" PRIMARY KEY ("id_calibracion")
);

-- [CT5] Tabla notas_cata (modelo NotaCata), ligada a lotes
CREATE TABLE "notas_cata" (
    "id_nota" SERIAL NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "descriptor" VARCHAR(80) NOT NULL,

    CONSTRAINT "notas_cata_pkey" PRIMARY KEY ("id_nota")
);


-- ===================== ALTER TABLE ===================================

-- [AT1] Llave foránea de lotes hacia granos (migración init)
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_id_grano_fkey"
  FOREIGN KEY ("id_grano") REFERENCES "granos"("id_grano") ON DELETE RESTRICT ON UPDATE CASCADE;

-- [AT2] Restricción CHECK: el peso actual va de 0 al peso inicial (migración triggers_y_restricciones)
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_peso_actual_rango"
  CHECK ("peso_actual_g" >= 0 AND "peso_actual_g" <= "peso_inicial_g");

-- [AT3] Agregar una columna: altitud de la finca (Prisma: altitudMsnm Int? @map("altitud_msnm"))
ALTER TABLE "granos" ADD COLUMN "altitud_msnm" INTEGER;

-- [AT4] Valor por defecto (Prisma: @default("Tostaduría Local"))
ALTER TABLE "lotes" ALTER COLUMN "tostaduria" SET DEFAULT 'Tostaduría Local';

-- [AT5] Quitar la columna agregada en AT3 (Prisma: se borra el campo del modelo)
ALTER TABLE "granos" DROP COLUMN "altitud_msnm";


-- ===================== DROP TABLE ====================================

-- [DT1] notas_cata con IF EXISTS (Prisma: se borra el modelo NotaCata)
DROP TABLE IF EXISTS "notas_cata";

-- [DT2] calibraciones (ninguna tabla depende de ella)
DROP TABLE "calibraciones";

-- Nota: "DROP TABLE granos;" sin CASCADE falla aquí, porque la llave
-- foránea lotes_id_grano_fkey (AT1) depende de granos (RESTRICT por defecto).

-- [DT3] granos con CASCADE: elimina granos y la llave foránea de lotes, pero no la tabla lotes
DROP TABLE "granos" CASCADE;

-- [DT4] lotes
DROP TABLE "lotes";

-- [DT5] equipos
DROP TABLE "equipos";

ROLLBACK;  -- deshace todo: el esquema practica_ddl no queda creado

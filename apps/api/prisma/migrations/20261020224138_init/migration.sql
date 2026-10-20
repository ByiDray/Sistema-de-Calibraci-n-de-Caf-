-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "equipos" (
    "id_equipo" SERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "marca" VARCHAR(50) NOT NULL,
    "modelo" VARCHAR(50) NOT NULL,
    "identificador_local" VARCHAR(20) NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id_equipo")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "notas_cata" (
    "id_nota" SERIAL NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "descriptor" VARCHAR(80) NOT NULL,

    CONSTRAINT "notas_cata_pkey" PRIMARY KEY ("id_nota")
);

-- CreateIndex
CREATE UNIQUE INDEX "lotes_codigo_lote_key" ON "lotes"("codigo_lote");

-- CreateIndex
CREATE INDEX "lotes_id_grano_idx" ON "lotes"("id_grano");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_identificador_local_key" ON "equipos"("identificador_local");

-- CreateIndex
CREATE INDEX "calibraciones_id_lote_idx" ON "calibraciones"("id_lote");

-- CreateIndex
CREATE UNIQUE INDEX "notas_cata_id_lote_descriptor_key" ON "notas_cata"("id_lote", "descriptor");

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_id_grano_fkey" FOREIGN KEY ("id_grano") REFERENCES "granos"("id_grano") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibraciones" ADD CONSTRAINT "calibraciones_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lotes"("id_lote") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibraciones" ADD CONSTRAINT "calibraciones_id_molino_fkey" FOREIGN KEY ("id_molino") REFERENCES "equipos"("id_equipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibraciones" ADD CONSTRAINT "calibraciones_id_maquina_fkey" FOREIGN KEY ("id_maquina") REFERENCES "equipos"("id_equipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_cata" ADD CONSTRAINT "notas_cata_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lotes"("id_lote") ON DELETE RESTRICT ON UPDATE CASCADE;

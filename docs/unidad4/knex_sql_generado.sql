-- SQL generado por el schema builder de Knex (scripts/crear-con-knex.mjs)

-- Tabla granos
create table "granos" ("id_grano" serial primary key, "nombre_cafe" varchar(100) not null, "finca" varchar(100), "productor" varchar(100), "pais_origen" varchar(50) not null, "region" varchar(100), "varietal" varchar(50), "proceso" varchar(50) not null constraint granos_proceso_catalogo check ("proceso" in ('Lavado','Natural','Honey','Anaeróbico')), "puntuacion_sca" decimal(5, 2) not null constraint granos_puntuacion_sca_rango check ("puntuacion_sca" between 0 and 100), "fecha_creacion" timestamp(3) not null default CURRENT_TIMESTAMP);

-- Tabla equipos
create table "equipos" ("id_equipo" serial primary key, "tipo" varchar(50) not null constraint equipos_tipo_catalogo check ("tipo" in ('molino','maquina')), "marca" varchar(50) not null, "modelo" varchar(50) not null, "identificador_local" varchar(20) not null);
alter table "equipos" add constraint "equipos_identificador_local_key" unique ("identificador_local");

-- Tabla lotes
create table "lotes" ("id_lote" serial primary key, "id_grano" integer not null, "codigo_lote" varchar(30) not null, "tostaduria" varchar(100) not null, "fecha_tueste" date not null, "nivel_tueste" varchar(30) not null constraint lotes_nivel_tueste_catalogo check ("nivel_tueste" in ('Claro','Medio','Oscuro')), "peso_inicial_g" decimal(10, 2) not null constraint lotes_peso_inicial_positivo check ("peso_inicial_g" > 0), "peso_actual_g" decimal(10, 2) not null, "activo" boolean not null default '1', constraint lotes_peso_actual_rango check ("peso_actual_g" >= 0 AND "peso_actual_g" <= "peso_inicial_g"));
alter table "lotes" add constraint "lotes_id_grano_fkey" foreign key ("id_grano") references "granos" ("id_grano") on update CASCADE on delete RESTRICT;
alter table "lotes" add constraint "lotes_codigo_lote_key" unique ("codigo_lote");
create index "lotes_id_grano_idx" on "lotes" ("id_grano");

-- Tabla calibraciones
create table "calibraciones" ("id_calibracion" serial primary key, "id_lote" integer not null, "id_molino" integer not null, "id_maquina" integer not null, "fecha_hora" timestamp(3) not null default CURRENT_TIMESTAMP, "dosis_in_g" decimal(5, 2) not null constraint calibraciones_dosis_positiva check ("dosis_in_g" > 0), "ajuste_molienda" decimal(4, 2) not null constraint calibraciones_ajuste_positivo check ("ajuste_molienda" > 0), "temperatura_c" decimal(4, 1) not null constraint calibraciones_temperatura_rango check ("temperatura_c" between 0 and 100), "presion_bar" decimal(3, 1) not null constraint calibraciones_presion_rango check ("presion_bar" between 0 and 15), "yield_out_g" decimal(5, 2) not null constraint calibraciones_yield_positivo check ("yield_out_g" > 0), "tiempo_segundos" decimal(5, 1) not null constraint calibraciones_tiempo_positivo check ("tiempo_segundos" > 0), "ratio_calculado" varchar(10) not null, "tds_porcentaje" decimal(5, 2) not null, "ey_porcentaje" decimal(5, 2) not null, "diagnostico" varchar(150) not null constraint calibraciones_diagnostico_catalogo check ("diagnostico" in ('EQUILIBRADA','SUBEXTRAIDA','SOBREEXTRAIDA')), "calificacion_sabor" decimal(3, 1) not null constraint calibraciones_calificacion_rango check ("calificacion_sabor" between 0 and 10), "notas_barista" varchar(255), "barista_nombre" varchar(100) not null, constraint calibraciones_tds_rango check ("tds_porcentaje" > 0 AND "tds_porcentaje" <= 100));
alter table "calibraciones" add constraint "calibraciones_id_lote_fkey" foreign key ("id_lote") references "lotes" ("id_lote") on update CASCADE on delete RESTRICT;
alter table "calibraciones" add constraint "calibraciones_id_molino_fkey" foreign key ("id_molino") references "equipos" ("id_equipo") on update CASCADE on delete RESTRICT;
alter table "calibraciones" add constraint "calibraciones_id_maquina_fkey" foreign key ("id_maquina") references "equipos" ("id_equipo") on update CASCADE on delete RESTRICT;
create index "calibraciones_id_lote_idx" on "calibraciones" ("id_lote");

-- Tabla notas_cata
create table "notas_cata" ("id_nota" serial primary key, "id_lote" integer not null, "descriptor" varchar(80) not null);
alter table "notas_cata" add constraint "notas_cata_id_lote_fkey" foreign key ("id_lote") references "lotes" ("id_lote") on update CASCADE on delete RESTRICT;
alter table "notas_cata" add constraint "notas_cata_id_lote_descriptor_key" unique ("id_lote", "descriptor");

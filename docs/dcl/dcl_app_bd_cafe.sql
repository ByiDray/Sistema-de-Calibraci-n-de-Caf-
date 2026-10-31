-- =====================================================================
-- Actividad: Lenguaje de control de datos (DCL) · App BD Café
-- 15 usuarios, 15 GRANT y 15 REVOKE sobre la base "cafe".
--
-- Se ejecuta con un superusuario (postgres) dentro de una transacción
-- que termina en ROLLBACK: los roles y permisos no quedan creados.
-- Para dejarlos, cambia ROLLBACK por COMMIT (y cambia las contraseñas).
-- Las contraseñas son solo de práctica.
--
-- El framework (Prisma) ejecuta este mismo archivo y comprueba los
-- permisos: apps/api/scripts/practica-dcl.ts
-- =====================================================================
BEGIN;

-- ===================== ROLES DE GRUPO (sin LOGIN) =====================

-- [RG01] Baristas: consultan y registran calibraciones
CREATE ROLE rol_barista NOLOGIN;

-- [RG02] Tostadores: dan de alta granos y lotes
CREATE ROLE rol_tostador NOLOGIN;

-- [RG03] Control de calidad: registran notas de cata
CREATE ROLE rol_calidad NOLOGIN;

-- [RG04] Solo lectura: auditoría, reportes y respaldos
CREATE ROLE rol_lectura NOLOGIN;


-- ===================== 15 USUARIOS (roles con LOGIN) ==================

-- [US01] Administrador de la base de la app
CREATE ROLE admin_cafe LOGIN PASSWORD 'Practica#Admin1';

-- [US02] Usuario con el que se conecta la API (Express + Prisma)
CREATE ROLE api_cafe LOGIN PASSWORD 'Practica#Api1' CONNECTION LIMIT 20;

-- [US03] Barista Ana Pérez
CREATE ROLE barista_ana LOGIN PASSWORD 'Practica#Ana1' IN ROLE rol_barista;

-- [US04] Barista Carlos Ramírez
CREATE ROLE barista_carlos LOGIN PASSWORD 'Practica#Carlos1' IN ROLE rol_barista;

-- [US05] Barista Luis Torres
CREATE ROLE barista_luis LOGIN PASSWORD 'Practica#Luis1' IN ROLE rol_barista;

-- [US06] Barista Sofía
CREATE ROLE barista_sofia LOGIN PASSWORD 'Practica#Sofia1' IN ROLE rol_barista;

-- [US07] Practicante con acceso temporal (vence el 31 de diciembre de 2026)
CREATE ROLE practicante_juan LOGIN PASSWORD 'Practica#Juan1' VALID UNTIL '2026-12-31' IN ROLE rol_barista;

-- [US08] Responsable de la Tostaduría Norte
CREATE ROLE tostador_norte LOGIN PASSWORD 'Practica#Norte1' IN ROLE rol_tostador;

-- [US09] Responsable de la Tostaduría Local
CREATE ROLE tostador_local LOGIN PASSWORD 'Practica#Local1' IN ROLE rol_tostador;

-- [US10] Catador de control de calidad (Andy)
CREATE ROLE calidad_andy LOGIN PASSWORD 'Practica#Andy1' IN ROLE rol_calidad;

-- [US11] Catador de control de calidad (Adriel)
CREATE ROLE calidad_adriel LOGIN PASSWORD 'Practica#Adriel1' IN ROLE rol_calidad;

-- [US12] Encargada de inventario
CREATE ROLE inventario_rosa LOGIN PASSWORD 'Practica#Rosa1' IN ROLE rol_lectura;

-- [US13] Auditor externo de la universidad
CREATE ROLE auditor_uni LOGIN PASSWORD 'Practica#Auditor1' IN ROLE rol_lectura;

-- [US14] Herramienta de reportes
CREATE ROLE reportes_bi LOGIN PASSWORD 'Practica#Reportes1' IN ROLE rol_lectura;

-- [US15] Usuario para respaldos
CREATE ROLE respaldo_backup LOGIN PASSWORD 'Practica#Respaldo1' IN ROLE rol_lectura;


-- ===================== 15 GRANT ======================================

-- [GR01] Conectarse a la base
GRANT CONNECT ON DATABASE cafe TO rol_barista, rol_tostador, rol_calidad, rol_lectura, api_cafe, admin_cafe;

-- [GR02] Usar el esquema public
GRANT USAGE ON SCHEMA public TO rol_barista, rol_tostador, rol_calidad, rol_lectura, api_cafe, admin_cafe;

-- [GR03] Baristas: leer el catálogo
GRANT SELECT ON granos, lotes, equipos, notas_cata TO rol_barista;

-- [GR04] Baristas: leer y registrar calibraciones
GRANT SELECT, INSERT ON calibraciones TO rol_barista;

-- [GR05] Baristas: generar el id de una calibración nueva (SERIAL)
GRANT USAGE ON SEQUENCE calibraciones_id_calibracion_seq TO rol_barista;

-- [GR06] Baristas: modificar solo el peso actual de los lotes (privilegio por columna)
GRANT UPDATE (peso_actual_g) ON lotes TO rol_barista;

-- [GR07] Tostadores: leer, dar de alta y editar granos y lotes
GRANT SELECT, INSERT, UPDATE ON granos, lotes TO rol_tostador;

-- [GR08] Tostadores: generar ids de granos y lotes
GRANT USAGE ON SEQUENCE granos_id_grano_seq, lotes_id_lote_seq TO rol_tostador;

-- [GR09] Solo lectura: leer todas las tablas del esquema
GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_lectura;

-- [GR10] Calidad hereda la lectura completa (un grupo dentro de otro)
GRANT rol_lectura TO rol_calidad;

-- [GR11] Calidad: agregar y quitar notas de cata
GRANT INSERT, DELETE ON notas_cata TO rol_calidad;

-- [GR12] Calidad: generar ids de notas de cata
GRANT USAGE ON SEQUENCE notas_cata_id_nota_seq TO rol_calidad;

-- [GR13] API: leer y escribir en todas las tablas (lo que hace la app)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO api_cafe;

-- [GR14] API: usar todas las secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO api_cafe;

-- [GR15] Administrador: todo sobre las tablas, y poder otorgarlo a otros
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin_cafe WITH GRANT OPTION;


-- ===================== 15 REVOKE =====================================

-- [RV01] Endurecer: ningún rol se conecta solo por existir (quita el default de PUBLIC)
REVOKE CONNECT ON DATABASE cafe FROM PUBLIC;

-- [RV02] Endurecer: nadie crea tablas temporales por defecto
REVOKE TEMPORARY ON DATABASE cafe FROM PUBLIC;

-- [RV03] Endurecer: quitar a PUBLIC el uso del esquema public
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- [RV04] Luis Torres dejó la cafetería
REVOKE rol_barista FROM barista_luis;

-- [RV05] Terminó el periodo del practicante
REVOKE rol_barista FROM practicante_juan;

-- [RV06] El peso del lote ya lo descuenta la app; los baristas no lo editan directo
REVOKE UPDATE (peso_actual_g) ON lotes FROM rol_barista;

-- [RV07] Las calibraciones se registran solo desde la app (usuario api_cafe)
REVOKE INSERT ON calibraciones FROM rol_barista;

-- [RV08] Sin INSERT, los baristas tampoco necesitan la secuencia
REVOKE USAGE ON SEQUENCE calibraciones_id_calibracion_seq FROM rol_barista;

-- [RV09] Calidad agrega notas, pero ya no las borra
REVOKE DELETE ON notas_cata FROM rol_calidad;

-- [RV10] Los granos los corrige el administrador, no la tostaduría
REVOKE UPDATE ON granos FROM rol_tostador;

-- [RV11] Rosa cambió de puesto y ya no consulta la base
REVOKE rol_lectura FROM inventario_rosa;

-- [RV12] Terminó la auditoría
REVOKE rol_lectura FROM auditor_uni;

-- [RV13] El administrador conserva sus privilegios, pero ya no puede otorgarlos
REVOKE GRANT OPTION FOR ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM admin_cafe;

-- [RV14] Intento de quitar a reportes_bi la lectura de granos: no tiene efecto,
-- porque ese privilegio no se le dio directo, lo hereda de rol_lectura
REVOKE SELECT ON granos FROM reportes_bi;

-- [RV15] La forma correcta: sacarlo del grupo
REVOKE rol_lectura FROM reportes_bi;

ROLLBACK;  -- cambiar por COMMIT para conservar los roles y permisos

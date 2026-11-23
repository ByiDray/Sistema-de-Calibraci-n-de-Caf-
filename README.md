# App BD Café

Trazabilidad y calibración de café de especialidad: granos → lotes → calibraciones, equipos y notas de cata por lote.

## Stack
- **apps/mobile**: React Native + Expo (TypeScript)
- **apps/api**: Express + Prisma 7 + PostgreSQL 18
- **docs/**: documento A2 (modelo E-R, diccionario de datos) y las actividades de cada unidad

## La app
Tres pestañas:
- **Inicio**: resumen con lotes activos, café disponible, porcentaje de shots equilibrados, lotes que se están acabando, últimas calibraciones y ranking de baristas por sabor (`GET /resumen`).
- **Cafés**: granos con búsqueda y filtro por proceso → lotes (filtros por estado y nivel de tueste, barra de existencia) → detalle del lote con notas de cata, gráfica del EY de cada calibración y su historial.
- **Equipos**: molinos y máquinas de espresso.

La calibración se captura en cuatro pasos, parte de la última receta del lote y calcula ratio, EY y diagnóstico mientras se escribe. Las calibraciones guardadas se pueden corregir o eliminar. La base de datos recalcula esos campos con un trigger, así que siempre es la fuente de verdad.

## Actividades por unidad
| Unidad | Qué contiene | Dónde |
| --- | --- | --- |
| Modelo | Modelo E-R, modelo relacional y diccionario de datos | `docs/Ordaz_Bravo_A2.pdf`, `docs/modelo/` |
| DDL | 5 CREATE, 5 ALTER y 5 DROP TABLE generados con Prisma | `docs/ddl/` |
| DML (3.2) | 25 consultas de actualización, 25 simples y 25 complejas | `docs/dml/` |
| Álgebra relacional | 45 consultas (5 por operación) con su expresión y su SQL | `docs/algebra/` |
| DCL | 15 usuarios, 15 GRANT y 15 REVOKE | `docs/dcl/`, `apps/api/scripts/practica-dcl.ts` |
| Unidad 4 | Crear base, tablas y restricciones; respaldo y restauración; usuarios; exportar a SQLite (consola, Prisma y Knex) | `docs/unidad4/`, `apps/api/scripts/` |
| Unidad 5 | 25 consultas simples, 15 JOIN, 15 agregadas, 5 vistas, 5 funciones y disparadores (consola, Prisma y Knex) | `docs/unidad5/`, `apps/api/scripts/unidad5-*` |
| Diseño | Capturas del primer y segundo avance de la app | `docs/reporte-avance/` |

### Correr la unidad 5
```powershell
$env:PGPASSWORD = "<contraseña de postgres>"
.\docs\unidad5\preparar_bases.ps1                  # copias cafe_u5_consola, cafe_u5_prisma y cafe_u5_knex
psql -h localhost -U postgres -d cafe_u5_consola -f docs/unidad5/consola_unidad5.sql
cd apps\api
npx tsx scripts/unidad5-prisma.ts
node scripts/unidad5-knex.mjs
node scripts/unidad5-comparar.mjs                  # comprueba que las tres formas dan las mismas filas
```

## Arranque
```bash
npm install
docker compose up -d            # o PostgreSQL local con una base "cafe"
cd apps/api && npx prisma migrate dev --name init
cd ../.. && npm run api         # API en :3000
npm run mobile                  # Expo
```
En un dispositivo físico la app debe apuntar a la IP de tu PC, no a `localhost`.

## Flujo de trabajo
Ramas `feature/*` → Pull Request a `main`. Sin push directo a `main`.

## Cambio respecto al documento A2
`NOTAS_CATA` se relaciona con `LOTES` (FK `id_lote`) en lugar de `GRANOS`. UNIQUE(`id_lote`, `descriptor`).

## Despliegue (Neon + Render)
- **Base de datos:** Neon (PostgreSQL). Se usa su cadena de conexión como `DATABASE_URL`.
- **API:** Render (web service gratuito), configurado en `render.yaml`. Variables de entorno: `DATABASE_URL` y `API_KEY`.
  Al iniciar ejecuta `prisma migrate deploy`, así que las migraciones se aplican solas.
- **Datos iniciales (una sola vez):** el seed borra las tablas, por eso fuera de localhost exige `SEED_CONFIRM=si`.
- **App:** `EXPO_PUBLIC_API_URL` apunta a la URL pública de Render.
- El plan gratuito de Render duerme la API tras 15 minutos sin uso; la primera petición tarda cerca de un minuto.

### Producción
- API: https://api-cafe-wvht.onrender.com (requiere el header `x-api-key`; `/health` es público).
- Base de datos: Neon. Las migraciones se aplican solas en cada deploy de Render.
- La app móvil apunta a producción con `EXPO_PUBLIC_API_URL` en `apps/mobile/.env` (ver `.env.example`).

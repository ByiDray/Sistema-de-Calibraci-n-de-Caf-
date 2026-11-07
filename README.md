# App BD Café

Trazabilidad y calibración de café de especialidad: granos → lotes → calibraciones, equipos y notas de cata por lote.

## Stack
- **apps/mobile**: React Native + Expo (TypeScript)
- **apps/api**: Express + Prisma 7 + PostgreSQL 18
- **docs/**: documento A2 (modelo E-R, diccionario de datos)

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

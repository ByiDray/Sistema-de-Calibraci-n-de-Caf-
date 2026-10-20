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

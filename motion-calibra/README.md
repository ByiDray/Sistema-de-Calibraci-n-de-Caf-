# Calibra · Video de motion graphics (Remotion)

Video de presentación de la app (90 s, 1920 × 1080, 30 fps). Sigue la marca de `comercial/`: paleta, Fraunces e Inter,
isotipo con la aguja que llega a la zona verde y el eslogan "Cada shot, en su punto.".
La música y los efectos se sintetizan con código (`audio/`); no usa audio de terceros.

Render final: `Renders/Calibra_motion_90s.mp4` (H.264 + AAC 320 kbps).

## Placas
Música a 100 BPM: un tiempo = 18 cuadros, un compás = 72. Los cortes y los efectos caen en tiempo.
Los tiempos viven en `src/tiempos.json`, que comparten el video y `audio/musica.mjs`.

| Placa | Tiempo | Qué pasa | Sonido clave |
| --- | --- | --- | --- |
| P01 · La prueba de cada mañana | 0:00 | "Moler. Pesar. Probar… y otra vez." Tres intentos fallidos | toques, pops graves |
| P02 · La pregunta | 0:09.6 | "¿Y si cada shot te dijera qué corregir?" | subida |
| P03 · Revelado del logo | 0:14.4 | La aguja sube a la zona verde; "Calibra" + eslogan | impacto + **tic** |
| P04 · Cafés y lotes | 0:21.6 | Grabación real de cafés → lote; existencia en gramos | toques |
| P05 · Ratio y EY mientras escribes | 0:31.2 | Grabación de la calibración + fórmulas 1:2.3 y 20.7 % | toque, campanita |
| P06 · Diagnóstico | 0:43.2 | Medidor y panel: verde → ámbar (16.88 %, consejo) → verde | **pops** en cada cambio de color |
| P07 · Gráfica del lote | 0:52.8 | Las 5 calibraciones de LT-2026-001 y la zona ideal | bloques de madera afinados |
| P08 · Inicio y ranking | 1:02.4 | Indicadores, extracciones y ranking de baristas | toques |
| P09 · Beneficio | 1:14.4 | "Menos café desperdiciado. Más tazas en su punto." | música baja |
| P10 · Cierre | 1:19.2 | Tres teléfonos, logo, eslogan y "Disponible pronto en iOS y Android" | **tic** + acorde final |

## Cómo volver a generarlo
```
cd motion-calibra
npm install
npm run audio      # regenera public/audio/musica.wav y los sfx_*.wav
npm run dev        # Remotion Studio para previsualizar y ajustar
npm run render     # Renders/Calibra_motion_90s.mp4
npm run cuadro -- 1300   # un cuadro suelto en Renders/cuadros/cuadro.png
```
Si cambias la duración de una placa en `src/tiempos.json`, vuelve a correr `npm run audio` para que la música siga los nuevos compases.

## Estructura
- `src/Calibra.tsx`: la composición; una pista con las 10 placas, los barridos entre placas y la música.
- `src/placas/`: una placa por archivo, con sus propios efectos de sonido.
- `src/componentes/`: isotipo animable, teléfono con la grabación real y piezas comunes (tarjetas, íconos).
- `src/marca.ts`: colores, tipografías, diagnósticos y consejos (copiados de la app y de `comercial/herramientas/config.mjs`).
- `audio/`: sintetizador (`sintesis.mjs`), música (`musica.mjs`) y efectos (`efectos.mjs`).
- `public/app/`: copias de `comercial/03_mockups` (marco y tres teléfonos) y `comercial/04_video_app` (grabaciones reales).
- `public/audio/`: la música y los efectos generados.

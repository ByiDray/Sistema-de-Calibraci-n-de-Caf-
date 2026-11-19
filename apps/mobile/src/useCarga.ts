import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { mensajeError } from './utilidades';

// Carga datos cada vez que la pantalla recibe el foco y expone los estados de carga y error.
// Al volver a una pantalla ya cargada, refresca en segundo plano sin mostrar el indicador de nuevo.
export function useCarga<T>(cargar: () => Promise<T>, deps: unknown[]) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const vigente = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(async (manual = false) => {
    const n = ++vigente.current;
    setError(null);
    if (manual) setRefrescando(true);
    try {
      const r = await cargar();
      if (n === vigente.current) setDatos(r);
    } catch (e) {
      if (n === vigente.current) setError(mensajeError(e));
    } finally {
      if (n === vigente.current) setRefrescando(false);
    }
  }, deps);

  useFocusEffect(useCallback(() => { ejecutar(); }, [ejecutar]));

  return { datos, error, refrescando, recargar: () => ejecutar(true), setDatos };
}

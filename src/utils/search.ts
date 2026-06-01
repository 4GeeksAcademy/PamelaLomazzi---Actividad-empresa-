/**
 * Busca el primer elemento que cumpla el criterio en una colección desordenada.
 * Devuelve null cuando no hay resultados.
 */
export function busquedaLineal<T>(array: T[], criterio: (item: T) => boolean): T | null {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }

  const encontrado = array.find(criterio);
  return encontrado ?? null;
}

/**
 * Busca un elemento en una colección ordenada por el campo especificado.
 * Retorna null si el elemento no existe o la colección está vacía.
 */
export function busquedaBinaria<T>(array: T[], campoId: keyof T, valorId: string | number): number {
  if (!Array.isArray(array) || array.length === 0) {
    return -1;
  }

  let inicio = 0;
  let fin = array.length - 1;

  while (inicio <= fin) {
    const medio = Math.floor((inicio + fin) / 2);
    const item = array[medio];
    const valorActual = item[campoId];

    if (valorActual === valorId) {
      return medio;
    }

    if (typeof valorActual === 'number' && typeof valorId === 'number') {
      if (valorActual < valorId) {
        inicio = medio + 1;
      } else {
        fin = medio - 1;
      }
    } else {
      const cadenaActual = String(valorActual);
      const cadenaObjetivo = String(valorId);

      if (cadenaActual < cadenaObjetivo) {
        inicio = medio + 1;
      } else {
        fin = medio - 1;
      }
    }
  }

  return -1;
}

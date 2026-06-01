/**
 * Filtra una colección usando un conjunto de criterios estrictos.
 * Se compara igualdad estricta para cada par clave-valor.
 */
export function filtrarColeccion<T>(array: T[], criterios: Partial<Record<keyof T, any>>): T[] {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  const criteriosEntries = Object.entries(criterios) as [keyof T, any][];

  return array.filter((item) =>
    criteriosEntries.every(([clave, valor]) => {
      if (valor === undefined) {
        return true;
      }

      return item[clave] === valor;
    })
  );
}

/**
 * Ordena una colección por un campo determinado en orden ascendente o descendente.
 */
function compararValores(valorA: unknown, valorB: unknown): number {
  if (valorA === valorB) {
    return 0;
  }

  if (valorA instanceof Date && valorB instanceof Date) {
    return valorA.getTime() - valorB.getTime();
  }

  if (typeof valorA === 'number' && typeof valorB === 'number') {
    return valorA - valorB;
  }

  const cadenaA = valorA !== undefined && valorA !== null ? String(valorA) : '';
  const cadenaB = valorB !== undefined && valorB !== null ? String(valorB) : '';

  if (cadenaA === cadenaB) {
    return 0;
  }

  return cadenaA > cadenaB ? 1 : -1;
}

export function ordenarColeccion<T>(array: T[], campo: keyof T, orden: 'asc' | 'desc'): T[] {
  return [...array].sort((a, b) => {
    const valorA = a[campo];
    const valorB = b[campo];
    const comparacion = compararValores(valorA, valorB);
    return orden === 'asc' ? comparacion : -comparacion;
  });
}

/**
 * Agrupa una colección por la clave especificada y devuelve un objeto indexado.
 */
export function agruparPor<T>(array: T[], clave: keyof T): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const llave = String(item[clave]);
    const grupo = acc[llave] ?? [];
    return {
      ...acc,
      [llave]: [...grupo, item],
    };
  }, {});
}

import { Cita, Empleado, Factura } from '../types/models';

/**
 * Porcentaje de citas perdidas (estado 'no_asistio') sobre el total de citas.
 */
export function calcularTasaInasistenciaGlobal(citas: Cita[]): number {
  if (citas.length === 0) {
    return 0;
  }

  const totalNoAsistio = citas.reduce<number>((contador, cita) => {
    return cita.estado === 'no_asistio' ? contador + 1 : contador;
  }, 0);

  return (totalNoAsistio / citas.length) * 100;
}

/**
 * Porcentaje de facturas denegadas sobre el total de facturas procesadas.
 */
export function calcularTasaDenegacionFacturas(facturas: Factura[]): number {
  if (facturas.length === 0) {
    return 0;
  }

  const totalDenegadas = facturas.reduce<number>((contador, factura) => {
    return factura.estado === 'denegada' ? contador + 1 : contador;
  }, 0);

  return (totalDenegadas / facturas.length) * 100;
}

/**
 * Promedio de días en el proceso de contratación para empleados de HealthCore.
 */
export function calcularPromedioDiasContratacion(empleados: Empleado[]): number {
  if (empleados.length === 0) {
    return 0;
  }

  const totalDias = empleados.reduce<number>((suma, empleado) => suma + empleado.diasProcesoContratacion, 0);
  return totalDias / empleados.length;
}

/**
 * Tiempo total en minutos que puede resumirse como documentación clínica.
 */
export function calcularTiempoDocumentacionAhorrable(citas: Cita[]): number {
  return citas.reduce<number>((total, cita) => total + cita.duracionDocumentacionMinutos, 0);
}

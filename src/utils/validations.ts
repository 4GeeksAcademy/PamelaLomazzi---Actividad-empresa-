import { Cita, Clinica, Empleado, Paciente } from '../types/models';

/**
 * Valida que los pacientes se procesen con el cumplimiento regulatorios adecuados.
 */
export function validarCumplimientoNormativo(paciente: Paciente, clinica: Clinica): boolean {
  const sistemaEHR = clinica.sistemaEHR.toUpperCase();

  if (paciente.region === 'US') {
    return sistemaEHR.includes('HIPAA');
  }

  if (paciente.region === 'UK') {
    return sistemaEHR.includes('RGPD') || sistemaEHR.includes('GDPR');
  }

  return false;
}

/**
 * Verifica que el número de horas de formación continua sea un valor numérico válido y no negativo.
 */
export function validarRangoHorasFormacion(empleado: Empleado): boolean {
  const horas = empleado.horasFormacionContinua;
  return typeof horas === 'number' && Number.isFinite(horas) && horas >= 0;
}

/**
 * Comprueba que los campos obligatorios de una cita existan antes de procesarla.
 */
export function validarCamposObligatoriosCita(cita: Partial<Cita>): boolean {
  const camposRequeridos: Array<keyof Partial<Cita>> = ['id', 'pacienteId', 'clinicaId', 'fecha', 'estado'];

  return camposRequeridos.every((campo) => cita[campo] !== undefined && cita[campo] !== null && cita[campo] !== '');
}

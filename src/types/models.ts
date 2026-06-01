export type Region = 'US' | 'UK';

export type EstadoCita = 'completada' | 'no_asistio' | 'programada';
export type TipoCobro = 'seguro_comercial' | 'medicare' | 'medicaid' | 'pago_privado' | 'nhs';
export type EstadoFactura = 'aprobada' | 'denegada';
export type RolEmpleado = 'clinico' | 'operaciones' | 'administracion' | 'tecnologia';

export interface Clinica {
  id: string;
  nombre: string;
  region: Region;
  ubicacion: string;
  sistemaEHR: string;
}

export interface Paciente {
  id: string;
  nombre: string;
  idioma: string;
  region: Region;
}

export interface Cita {
  id: string;
  pacienteId: string;
  clinicaId: string;
  especialista: string;
  fecha: string | Date;
  estado: EstadoCita;
  duracionDocumentacionMinutos: number;
}

export interface Factura {
  id: string;
  citaId: string;
  region: Region;
  tipoCobro: TipoCobro;
  monto: number;
  estado: EstadoFactura;
}

export interface Empleado {
  id: string;
  nombre: string;
  rol: RolEmpleado;
  diasProcesoContratacion: number;
  horasFormacionContinua: number;
}

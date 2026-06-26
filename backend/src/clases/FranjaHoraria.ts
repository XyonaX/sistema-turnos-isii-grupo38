// src/clases/FranjaHoraria.ts

export class FranjaHoraria {
  // Atributos privados encapsulados
  private id?: string;
  private fecha: string;
  private horaInicio: string;
  private horaFin: string;
  private estado: string; // 'Libre', 'Bloqueada', 'Ocupada'
  private motivoBloqueo?: string;

  constructor(
    fecha: string,
    horaInicio: string,
    horaFin: string,
    estado: string,
    motivoBloqueo?: string,
    id?: string
  ) {
    this.id = id;
    this.fecha = fecha;
    this.horaInicio = horaInicio;
    this.horaFin = horaFin;
    this.estado = estado;
    this.motivoBloqueo = motivoBloqueo;
  }

  // =========================================================================
  // GETTERS (Encapsulamiento de datos)
  // =========================================================================
  public obtenerId(): string | undefined {
    return this.id;
  }
  public obtenerFecha(): string {
    return this.fecha;
  }
  public obtenerHoraInicio(): string {
    return this.horaInicio;
  }
  public obtenerHoraFin(): string {
    return this.horaFin;
  }
  public obtenerEstado(): string {
    return this.estado;
  }
  public obtenerMotivoBloqueo(): string | undefined {
    return this.motivoBloqueo;
  }

  // =========================================================================
  // COMPORTAMIENTO / REGLAS DE NEGOCIO
  // =========================================================================

  // Mueve la lógica que estaba suelta en HorarioService.toggleDisponibilidad
  public alternarDisponibilidad(): void {
    // REGLA DE ORO: Si ya tiene un turno encima, no se puede tocar desde la agenda general
    if (this.estado.toLowerCase() === 'ocupada') {
      throw new Error(
        'No se puede modificar la disponibilidad de una franja horaria que ya está ocupada por un turno activo.'
      );
    }

    if (this.estado.toLowerCase() === 'libre') {
      this.estado = 'Bloqueada';
      this.motivoBloqueo = 'Bloqueada manualmente por el profesional';
    } else {
      this.estado = 'Libre';
      this.motivoBloqueo = undefined;
    }
  }

  // Comportamiento interno cuando el TurnoService intenta asociarla a una reserva
  public ocupar(): void {
    if (this.estado.toLowerCase() !== 'libre') {
      throw new Error('La franja horaria no se encuentra disponible para ser reservada.');
    }
    this.estado = 'Ocupada';
  }

  // Comportamiento cuando un turno se cancela y la franja debe volver a mostrarse
  public liberar(): void {
    this.estado = 'Libre';
    this.motivoBloqueo = undefined;
  }
}

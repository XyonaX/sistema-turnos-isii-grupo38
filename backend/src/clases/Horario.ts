// src/clases/Horario.ts

export class Horario {
  // Atributos privados encapsulados
  private id?: string;
  private fechaInicio: string;
  private fechaFin: string;
  private horaApertura: string;
  private horaCierre: string;

  constructor(fechaInicio: string, fechaFin: string, horaApertura: string, horaCierre: string, id?: string) {
    this.id = id;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.horaApertura = horaApertura;
    this.horaCierre = horaCierre;

    // Al instanciarse el objeto, se auto-valida (Estilo Java)
    this.validarReglasDeNegocio();
  }

  // =========================================================================
  // GETTERS (Encapsulamiento de datos)
  // =========================================================================
  public obtenerId(): string | undefined { return this.id; }
  public obtenerFechaInicio(): string { return this.fechaInicio; }
  public obtenerFechaFin(): string { return this.fechaFin; }
  public obtenerHoraApertura(): string { return this.horaApertura; }
  public obtenerHoraCierre(): string { return this.horaCierre; }

  // =========================================================================
  // REGLAS DE NEGOCIO EN MEMORIA
  // =========================================================================
  private validarReglasDeNegocio(): void {
    const parseLocalDate = (str: string): Date => {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (parseLocalDate(this.fechaInicio) < hoy) {
      throw new Error('No se pueden crear horarios en fechas pasadas');
    }
    if (parseLocalDate(this.fechaFin) < parseLocalDate(this.fechaInicio)) {
      throw new Error('La fecha de fin debe ser mayor o igual a la fecha de inicio');
    }
    if (this.horaApertura >= this.horaCierre) {
      throw new Error('La hora de cierre debe ser mayor a la hora de apertura');
    }
  }

  // ALGORITMO PURO: Divide el rango de atención en bloques según los minutos del servicio
  public calcularFranjasHorarias(duracionMinutos: number): Array<{ fecha: string; horaInicio: string; horaFin: string }> {
    if (duracionMinutos <= 0) {
      throw new Error('La duración del servicio debe ser positiva');
    }

    const franjasCalculadas = [];
    
    const [y1, m1, d1] = this.fechaInicio.split('-').map(Number);
    const fechaActual = new Date(y1, m1 - 1, d1);
    
    const [y2, m2, d2] = this.fechaFin.split('-').map(Number);
    const fechaFinVal = new Date(y2, m2 - 1, d2);

    while (fechaActual <= fechaFinVal) {
      const y = fechaActual.getFullYear();
      const m = String(fechaActual.getMonth() + 1).padStart(2, '0');
      const d = String(fechaActual.getDate()).padStart(2, '0');
      const fechaStr = `${y}-${m}-${d}`;
      let horaActual = this.horaApertura;

      while (horaActual < this.horaCierre) {
        const horaFinCalculada = this.sumarMinutos(horaActual, duracionMinutos);
        if (horaFinCalculada > this.horaCierre) break;

        franjasCalculadas.push({
          fecha: fechaStr,
          horaInicio: horaActual,
          horaFin: horaFinCalculada,
        });
        
        horaActual = horaFinCalculada;
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return franjasCalculadas;
  }

  // Métodos auxiliares de cálculo matemático del tiempo
  private horaAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  private sumarMinutos(hora: string, minutos: number): string {
    let totalMinutos = this.horaAMinutos(hora) + minutos;
    if (totalMinutos >= 1440) totalMinutos = 0;
    const h = Math.floor(totalMinutos / 60).toString().padStart(2, '0');
    const m = (totalMinutos % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}

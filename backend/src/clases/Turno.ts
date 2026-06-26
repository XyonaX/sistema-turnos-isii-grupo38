// src/clases/Turno.ts
import { Usuario } from './Usuario';

export class Turno {
  private id?: string;
  private cliente: Usuario;
  private notas?: string;
  private creadoEn: Date;
  private estado: string;

  constructor(cliente: Usuario, estado: string, notas?: string, creadoEn?: Date, id?: string) {
    this.id = id;
    this.cliente = cliente;
    this.notas = notas;
    this.creadoEn = creadoEn || new Date();
    this.estado = estado;
  }

  public obtenerId(): string | undefined {
    return this.id;
  }
  public obtenerCliente(): Usuario {
    return this.cliente;
  }
  public obtenerNotas(): string | undefined {
    return this.notas;
  }
  public obtenerCreadoEn(): Date {
    return this.creadoEn;
  }
  public obtenerNombreEstado(): string {
    return this.estado;
  }

  public confirmar(): void {
    if (this.estado.toLowerCase() !== 'pendiente') {
      throw new Error(`No se puede confirmar un turno que está en estado: ${this.estado}`);
    }
    this.estado = 'Confirmado';
  }

  public cancelar(canceladoPor: 'Cliente' | 'Profesional'): void {
    if (
      this.estado.toLowerCase() === 'cancelado' ||
      this.estado.toLowerCase() === 'completado' ||
      this.estado.toLowerCase() === 'no asistio'
    ) {
      throw new Error(`No se puede cancelar un turno que ya está finalizado como: ${this.estado}`);
    }

    this.estado = 'Cancelado';
    this.notas = `${this.notas || ''} [Cancelado por: ${canceladoPor}]`.trim();
  }

  public completar(): void {
    if (this.estado.toLowerCase() !== 'confirmado') {
      throw new Error(`No se puede completar un turno que no haya sido confirmado primero.`);
    }
    this.estado = 'Completado';
  }

  public marcarAusente(): void {
    if (this.estado.toLowerCase() !== 'confirmado') {
      throw new Error(`No se puede marcar como ausente si el turno figuraba como: ${this.estado}`);
    }
    this.estado = 'No Asistio';
  }
}

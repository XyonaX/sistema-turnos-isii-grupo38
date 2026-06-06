// src/clases/Servicio.ts
import { Usuario } from './Usuario';

export class Servicio {
  // Atributos privados encapsulados
  private id?: string;
  private nombre: string;
  private descripcion?: string;
  private duracionMinutos: number;
  private precio: number;
  private profesional: Usuario; // Composición de objetos puros

  constructor(
    nombre: string, 
    profesional: Usuario, 
    duracionMinutos = 60, 
    precio = 0, 
    descripcion?: string, 
    id?: string
  ) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.duracionMinutos = duracionMinutos;
    this.precio = precio;
    this.profesional = profesional;

    // Al crearse el objeto, se ejecutan las reglas de negocio de la POO
    this.validarReglasDeNegocio();
  }

  // =========================================================================
  // GETTERS (Encapsulamiento puro)
  // =========================================================================
  public obtenerId(): string | undefined { return this.id; }
  public obtenerNombre(): string { return this.nombre; }
  public obtenerDescripcion(): string | undefined { return this.descripcion; }
  public obtenerDuracionMinutos(): number { return this.duracionMinutos; }
  public obtenerPrecio(): number { return this.precio; }
  public obtenerProfesional(): Usuario { return this.profesional; }

  // =========================================================================
  // REGLAS DE NEGOCIO EN MEMORIA
  // =========================================================================
  private validarReglasDeNegocio(): void {
    if (!this.nombre || this.nombre.trim() === '') {
      throw new Error('El nombre del servicio es requerido');
    }
    if (this.duracionMinutos <= 0) {
      throw new Error('La duración del servicio debe ser positiva');
    }
    if (this.precio < 0) {
      throw new Error('El precio del servicio no puede ser un valor negativo');
    }
    
    // Aprovechamos el método que creamos en el Paso 2 dentro de Usuario
    if (!this.profesional.puedeOfrecerServicios()) {
      throw new Error('Solo los profesionales pueden crear o tener servicios asignados');
    }
  }

  // Regla de seguridad: Verifica si un ID de profesional coincide con el dueño del servicio
  public validarSeguridadPropietario(profesionalIdInput: string): void {
    if (this.profesional.obtenerId() !== profesionalIdInput) {
      throw new Error('No tienes permiso para modificar o eliminar este servicio');
    }
  }
}

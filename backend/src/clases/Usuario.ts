// src/clases/Usuario.ts
import bcrypt from 'bcryptjs';

import type { Rol } from './Rol';

export class Usuario {
  // Atributos privados encapsulados
  private id?: string;
  private nombre: string;
  private email: string;
  private passwordHash: string;
  private rol: Rol; // Composición: El dominio usa objetos de dominio

  constructor(nombre: string, email: string, passwordHash: string, rol: Rol, id?: string) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.passwordHash = passwordHash;
    this.rol = rol;

    // Validación de negocio básica al instanciar (Estilo Java)
    if (!email.includes('@')) {
      throw new Error('El formato del correo electrónico no es válido');
    }
  }

  // ==========================================
  // GETTERS (Para exponer los datos de forma segura)
  // ==========================================
  public obtenerId(): string | undefined {
    return this.id;
  }
  public obtenerNombre(): string {
    return this.nombre;
  }
  public obtenerEmail(): string {
    return this.email;
  }
  public obtenerRol(): Rol {
    return this.rol;
  }

  // ==========================================
  // COMPORTAMIENTO / LÓGICA DE NEGOCIO
  // ==========================================

  // La clase sabe cómo validarse a sí misma frente a un intento de login
  public async verificarContrasenia(passwordInput: string): Promise<boolean> {
    return bcrypt.compare(passwordInput, this.passwordHash);
  }

  // Helper para saber si el usuario puede ofrecer servicios en Agendapp
  public puedeOfrecerServicios(): boolean {
    return this.rol.esProfesional();
  }
}


export class Rol {
  // Atributos privados encapsulados
  private id?: string;
  private nombre: string;
  private descripcion: string;

  constructor(nombre: string, descripcion: string, id?: string) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
  }

  // Métodos de comportamiento (Lógica pura de objetos)
  public obtenerNombre(): string {
    return this.nombre;
  }

  public obtenerDescripcion(): string {
    return this.descripcion;
  }

  public obtenerId(): string | undefined {
    return this.id;
  }

  public esAdministrador(): boolean {
    return this.nombre.toLowerCase() === 'admin';
  }

  public esProfesional(): boolean {
    return this.nombre.toLowerCase() === 'profesional';
  }
}
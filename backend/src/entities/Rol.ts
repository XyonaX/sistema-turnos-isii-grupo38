import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Usuario } from './Usuario';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  descripcion!: string;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios!: Usuario[];
}

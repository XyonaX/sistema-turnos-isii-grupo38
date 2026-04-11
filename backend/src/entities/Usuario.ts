import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Turno } from './Turno';

export enum RolUsuario {
  CLIENTE = 'cliente',
  ADMIN = 'admin',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.CLIENTE })
  rol!: RolUsuario;

  @CreateDateColumn()
  creadoEn!: Date;

  @OneToMany(() => Turno, (turno) => turno.cliente)
  turnos!: Turno[];
}

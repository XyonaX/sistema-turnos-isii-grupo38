import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

import { Rol } from './Rol';
import { Servicio } from './Servicio';
import { Turno } from './Turno';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @CreateDateColumn()
  creadoEn!: Date;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, { eager: false })
  @JoinColumn({ name: 'rolId' })
  rol!: Rol;

  @OneToMany(() => Turno, (turno) => turno.cliente)
  turnos!: Turno[];

  @OneToMany(() => Servicio, (servicio) => servicio.profesional)
  servicios!: Servicio[];
}

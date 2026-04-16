import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

import { Horario } from './Horario';
import { Usuario } from './Usuario';

export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
}

@Entity('turnos')
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // eager: false — se carga explícitamente para evitar exponer passwordHash
  @ManyToOne(() => Usuario, (usuario) => usuario.turnos, { eager: false })
  cliente!: Usuario;

  @ManyToOne(() => Horario, (horario) => horario.turnos, { eager: false })
  horario!: Horario;

  @Column({ type: 'enum', enum: EstadoTurno, default: EstadoTurno.PENDIENTE })
  estado!: EstadoTurno;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn()
  creadoEn!: Date;
}

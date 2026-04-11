import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Usuario } from './Usuario';
import { Horario } from './Horario';

export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
}

@Entity('turnos')
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.turnos, { eager: true })
  cliente!: Usuario;

  @ManyToOne(() => Horario, (horario) => horario.turnos, { eager: true })
  horario!: Horario;

  @Column({ type: 'enum', enum: EstadoTurno, default: EstadoTurno.PENDIENTE })
  estado!: EstadoTurno;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn()
  creadoEn!: Date;
}

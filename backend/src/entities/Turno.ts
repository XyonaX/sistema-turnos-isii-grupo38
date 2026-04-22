import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './Usuario';
import { FranjaHoraria } from './FranjaHoraria';
import { Notificacion } from './Notificacion';

export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
  COMPLETADO = 'completado',
}

@Entity('turnos')
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // eager: false — se carga explícitamente para evitar exponer passwordHash
  @ManyToOne(() => Usuario, (usuario) => usuario.turnos, { eager: false })
  @JoinColumn({ name: 'clienteId' })
  cliente!: Usuario;

  @OneToOne(() => FranjaHoraria, (franja) => franja.turno, { eager: false, nullable: true })
  @JoinColumn({ name: 'franjaId' })
  franja?: FranjaHoraria | null;

  @Column({ type: 'enum', enum: EstadoTurno, default: EstadoTurno.PENDIENTE })
  estado!: EstadoTurno;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn()
  creadoEn!: Date;

  @OneToMany(() => Notificacion, (notificacion) => notificacion.turno)
  notificaciones!: Notificacion[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Turno } from './Turno';
import { TipoNotificacion } from './TipoNotificacion';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TipoNotificacion, (tn) => tn.notificaciones, { eager: false, nullable: false })
  @JoinColumn({ name: 'tipoNotificacionId' })
  tipoNotificacion!: TipoNotificacion;

  @Column({ type: 'text' })
  mensaje!: string;

  @CreateDateColumn()
  fechaEnvio!: Date;

  @Column({ type: 'boolean', default: false })
  leida!: boolean;

  @ManyToOne(() => Turno, (turno) => turno.notificaciones, { eager: false })
  @JoinColumn({ name: 'turnoId' })
  turno!: Turno;
}

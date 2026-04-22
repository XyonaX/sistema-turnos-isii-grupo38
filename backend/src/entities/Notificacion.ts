import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Turno } from './Turno';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  tipo!: string;

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

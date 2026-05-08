import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Horario } from './Horario';
import { Turno } from './Turno';
import { EstadoFranja } from './EstadoFranja';

@Entity('franjas_horarias')
export class FranjaHoraria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'time' })
  horaInicio!: string;

  @Column({ type: 'time' })
  horaFin!: string;

  @Column({ type: 'text', nullable: true })
  motivoBloqueo?: string;

  @ManyToOne(() => EstadoFranja, (ef) => ef.franjas, { eager: false, nullable: false })
  @JoinColumn({ name: 'estadoFranjaId' })
  estadoFranja!: EstadoFranja;

  @ManyToOne(() => Horario, (horario) => horario.franjas, { eager: false })
  @JoinColumn({ name: 'horarioId' })
  horario!: Horario;

  @OneToOne(() => Turno, (turno) => turno.franja, { nullable: true, eager: false })
  turno?: Turno;
}

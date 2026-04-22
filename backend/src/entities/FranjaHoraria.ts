import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Horario } from './Horario';
import { Turno } from './Turno';

@Entity('franjas_horarias')
export class FranjaHoraria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'time' })
  horaInicio!: string;

  @Column({ type: 'time' })
  horaFin!: string;

  @Column({ type: 'boolean', default: true })
  disponible!: boolean;

  @ManyToOne(() => Horario, (horario) => horario.franjas, { eager: false })
  @JoinColumn({ name: 'horarioId' })
  horario!: Horario;

  @OneToOne(() => Turno, (turno) => turno.franja, { nullable: true, eager: false })
  turno?: Turno;
}

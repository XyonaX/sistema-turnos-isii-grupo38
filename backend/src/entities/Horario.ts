import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { FranjaHoraria } from './FranjaHoraria';
import { Servicio } from './Servicio';

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  fechaInicio!: string;

  @Column({ type: 'date' })
  fechaFin!: string;

  @Column({ type: 'time' })
  horaApertura!: string;

  @Column({ type: 'time' })
  horaCierre!: string;

  @ManyToOne(() => Servicio, (servicio) => servicio.horarios, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'servicioId' })
  servicio!: Servicio;

  @OneToMany(() => FranjaHoraria, (franja) => franja.horario)
  franjas!: FranjaHoraria[];
}

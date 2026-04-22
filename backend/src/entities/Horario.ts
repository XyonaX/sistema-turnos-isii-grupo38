import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Servicio } from './Servicio';
import { FranjaHoraria } from './FranjaHoraria';

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'int', default: 60 })
  lapsoMinutos!: number;

  @ManyToOne(() => Servicio, (servicio) => servicio.horarios, { eager: false, nullable: true })
  @JoinColumn({ name: 'servicioId' })
  servicio?: Servicio;

  @OneToMany(() => FranjaHoraria, (franja) => franja.horario)
  franjas!: FranjaHoraria[];
}

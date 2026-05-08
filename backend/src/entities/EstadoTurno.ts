import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Turno } from './Turno';

@Entity('estados_turno')
export class EstadoTurno {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombre!: string;

  @OneToMany(() => Turno, (t) => t.estadoTurno)
  turnos!: Turno[];
}

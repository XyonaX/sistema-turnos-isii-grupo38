import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FranjaHoraria } from './FranjaHoraria';

@Entity('estados_franja')
export class EstadoFranja {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombre!: string;

  @OneToMany(() => FranjaHoraria, (f) => f.estadoFranja)
  franjas!: FranjaHoraria[];
}

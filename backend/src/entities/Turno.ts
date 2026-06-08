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
import { EstadoTurno } from './EstadoTurno';

@Entity('turnos')
export class Turno {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.turnos, { eager: false })
  @JoinColumn({ name: 'clienteId' })
  cliente!: Usuario;

  @OneToOne(() => FranjaHoraria, (franja) => franja.turno, { eager: false, nullable: true })
  @JoinColumn({ name: 'franjaId' })
  franja?: FranjaHoraria | null;

  @ManyToOne(() => EstadoTurno, (et) => et.turnos, { eager: false, nullable: false })
  @JoinColumn({ name: 'estadoTurnoId' })
  estadoTurno!: EstadoTurno;

  @Column({ type: 'boolean', default: true })
  pagoPendiente!: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  franjaFecha?: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  franjaHoraInicio?: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  franjaHoraFin?: string;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn()
  creadoEn!: Date;

}

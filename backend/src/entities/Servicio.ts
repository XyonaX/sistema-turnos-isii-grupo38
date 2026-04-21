import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Usuario } from './Usuario';
import { Horario } from './Horario';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'int', default: 60 })
  duracion!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio?: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.servicios, { eager: false })
  @JoinColumn({ name: 'profesionalId' })
  profesional!: Usuario;

  @OneToMany(() => Horario, (horario) => horario.servicio)
  horarios!: Horario[];
}

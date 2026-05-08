import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Notificacion } from './Notificacion';

@Entity('tipos_notificacion')
export class TipoNotificacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombre!: string;

  @OneToMany(() => Notificacion, (n) => n.tipoNotificacion)
  notificaciones!: Notificacion[];
}

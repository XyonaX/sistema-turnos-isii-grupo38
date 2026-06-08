import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Turno } from './Turno';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Turno, { eager: false, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'turnoId' })
  turno!: Turno;

  @Column({ type: 'varchar', length: 20 })
  estado!: string; // 'ESPERANDO' | 'CONFIRMADO' | 'CANCELADO'

  @Column({ type: 'varchar', length: 30, nullable: true })
  metodoPago?: string;

  @Column({ type: 'int', default: 0 })
  intentos!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId?: string;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

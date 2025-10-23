import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  area: string;

  @Column()
  state: string;

  @Column({ nullable: true })
  zipcode: string;

  @Column({ type: 'date' })
  lastInteractionDate: string;

  @Column()
  platform: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  productId: string;

  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'text' })
  productDescription: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'simple-array' })
  category: string[];

  @Column({ type: 'varchar', length: 100 })
  brand: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  sellingPrice: string;

  @Column({ type: 'simple-array' })
  productImages: string[];

  @Column({ type: 'text' })
  ingredients: string;

  @Column({ type: 'simple-array' })
  suitableFor: string[];

  @Column({ type: 'json', nullable: true })
  reviews: any[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  salePercentage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

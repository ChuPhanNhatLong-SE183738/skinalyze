import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { productId: id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async findByCategory(category: string): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where(':category = ANY(product.category)', { category })
      .getMany();
  }

  async findByBrand(brand: string): Promise<Product[]> {
    return await this.productRepository.find({ where: { brand } });
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('product')
      .where('LOWER(product.productName) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(product.productDescription) LIKE LOWER(:query)', { query: `%${query}%` })
      .getMany();
  }
}

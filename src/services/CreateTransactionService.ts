import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category: categoryTitle,
  }: Request): Promise<Transaction> {
    if (!title) {
      throw new AppError('The transaction title is required');
    }

    if (!value || value <= 0) {
      throw new AppError(
        'The transaction value is required and must be greather than zero',
      );
    }

    if (!categoryTitle) {
      throw new AppError('The transaction category is required');
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError(
        'Invalid type. Accepted values are "income" or "outcome"',
      );
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      if (value > balance.total) {
        throw new AppError(
          `Invalid operation. You have only $${balance.total} in your balance`,
        );
      }
    }

    // get category or create new one
    let category = await categoriesRepository.findOne({
      where: { title: categoryTitle },
    });
    if (!category) {
      category = categoriesRepository.create({
        title: categoryTitle,
      });
      await categoriesRepository.save(category);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: category.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

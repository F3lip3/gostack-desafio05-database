// import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transaction = await transactionsRepository.findOne({ where: { id } });
    console.info('transaction:', transaction);
    if (!transaction) {
      throw new AppError(`Transaction with id ${id} not found!`, 404);
    }

    await transactionsRepository.delete(transaction);
  }
}

export default DeleteTransactionService;

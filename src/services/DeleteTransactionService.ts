import { getCustomRepository } from 'typeorm';
import { isUuid } from 'uuidv4';

import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    if (!isUuid(id)) {
      throw new AppError('The transaction id is invalid!');
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transaction = await transactionsRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new AppError(`Transaction with id ${id} not found!`, 404);
    }

    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;

import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    // const { income, outcome } = transactions.reduce((result, transaction) => {
    //   result[transaction.type] =
    //     (result[transaction.type] || 0) + transaction.value;
    //   return result;
    // }, {});

    const income = transactions.reduce(
      (total, transaction) =>
        total + (transaction.type === 'income' ? transaction.value : 0),
      0,
    );

    const outcome = transactions.reduce(
      (total, transaction) =>
        total + (transaction.type === 'outcome' ? transaction.value : 0),
      0,
    );

    return {
      income,
      outcome,
      total: income - outcome,
    };
  }
}

export default TransactionsRepository;

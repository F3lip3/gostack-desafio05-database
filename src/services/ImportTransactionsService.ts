import fs from 'fs';
import neatCsv from 'neat-csv';

import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  filePath: string;
}

interface CsvData {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
  error?: string;
}

class ImportTransactionsService {
  async execute({ filePath }: Request): Promise<Transaction[] | null> {
    const exists = fs.existsSync(filePath);
    if (!exists) {
      throw new AppError('File not found!', 400);
    }

    const fileContent = await fs.promises.readFile(filePath, {
      encoding: 'utf-8',
    });

    if (!fileContent) {
      throw new AppError('The file is empty', 400);
    }

    const csv = await neatCsv<CsvData>(fileContent, {
      mapHeaders: ({ header }) => header.trim(),
      mapValues: ({ header, value }) =>
        header === 'value' ? +value.trim() : value.trim(),
    });

    if (!csv.length) {
      throw new AppError('The file is empty', 400);
    }

    const createTransaction = new CreateTransactionService();

    const transactions: Transaction[] = [];
    const errors: CsvData[] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const row of csv.sort(x => (x.type === 'income' ? 1 : 0))) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const newTransaction = await createTransaction.execute({
          title: row.title,
          type: row.type,
          value: row.value,
          category: row.category,
        });

        transactions.push(newTransaction);
      } catch (err) {
        errors.push({ ...row, error: err.message } as CsvData);
      }
    }

    // const createResult = await Promise.all(
    //   csv.map(async row => {
    //     console.info('importing', row);
    //     try {
    //       const newTransaction = await createTransaction.execute({
    //         title: row.title,
    //         type: row.type,
    //         value: row.value,
    //         category: row.category,
    //       });

    //       return newTransaction;
    //     } catch (err) {
    //       return { ...row, error: err.message } as CsvData;
    //     }
    //   }),
    // );

    // const errors = createResult.filter(
    //   data => !(data instanceof Transaction),
    // ) as CsvData[];

    // const transactions = createResult.filter(
    //   data => data instanceof Transaction,
    // ) as Transaction[];

    if (errors.length) {
      // eslint-disable-next-line no-console
      console.error(errors);
    }

    return transactions;
  }
}

export default ImportTransactionsService;

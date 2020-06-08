import fs from 'fs';
import neatCsv from 'neat-csv';

import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  fileName: string;
  filePath: string;
}

interface CsvData {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
  line?: number;
  error?: string;
}

interface Errors {
  fileName: string;
  title: string;
  data: CsvData[];
}

class ImportTransactionsService {
  async execute({
    fileName,
    filePath,
  }: Request): Promise<Transaction[] | null> {
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
    const errors: Errors = {
      fileName,
      title: '',
      data: [],
    };

    let line = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const row of csv.sort(x => (x.type === 'income' ? 1 : 0))) {
      line += 1;
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
        errors.data.push({ ...row, error: err.message, line } as CsvData);
      }
    }

    if (transactions.length === 0) {
      errors.title = 'Failed to upload transactions!';
      throw new AppError(JSON.stringify(errors), 400);
    }

    if (errors.data.length) {
      errors.title = 'Failed to upload some transactions!';
      throw new AppError(JSON.stringify(errors), 400);
    }

    return transactions;
  }
}

export default ImportTransactionsService;

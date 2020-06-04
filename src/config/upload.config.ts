import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import AppError from '../errors/AppError';

const destination = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: destination,
  storage: multer.diskStorage({
    destination,
    filename(request, file, callback) {
      if (file.mimetype !== 'text/csv') {
        callback(
          new AppError('Invalid file type. Only csv files are accepted!', 400),
          '',
        );
      }

      const fileHash = crypto.randomBytes(10).toString('hex');
      const filename = `${fileHash}-${file.originalname}`;

      return callback(null, filename);
    },
  }),
};

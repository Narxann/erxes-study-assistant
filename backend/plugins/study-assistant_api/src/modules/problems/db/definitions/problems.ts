import { Schema } from 'mongoose';

import { mongooseStringRandomId } from 'erxes-api-shared/utils';

export const problemsSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    name: { type: String, label: 'Name' },
  },
  {
    timestamps: true,
  },
);

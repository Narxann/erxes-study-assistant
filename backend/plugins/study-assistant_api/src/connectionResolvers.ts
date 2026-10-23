import { createGenerateModels } from 'erxes-api-shared/utils';
import { IMainContext } from 'erxes-api-shared/core-types';
import { IProblemsDocument } from '@/problems/@types/problems';

import mongoose from 'mongoose';

import { loadProblemsClass, IProblemsModel } from '@/problems/db/models/Problems';

export interface IModels {
  Problems: IProblemsModel;
}

export interface IContext extends IMainContext {
  models: IModels;
}

export const loadClasses = (db: mongoose.Connection): IModels => {
  const models = {} as IModels;

  models.Problems = db.model<IProblemsDocument, IProblemsModel>(
    'problems',
    loadProblemsClass(models),
  );

  return models;
};

export const generateModels = createGenerateModels<IModels>(loadClasses);

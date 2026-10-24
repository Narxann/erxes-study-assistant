import { Schema } from 'mongoose';
import { mongooseStringRandomId, schemaWrapper } from 'erxes-api-shared/utils';

export const learningAttemptSchema = schemaWrapper(
  new Schema(
    {
      _id: mongooseStringRandomId,
      grade: { type: Number, required: true, min: 1, max: 12 },
      problem: { type: String, required: true },
      imageReference: { type: String },
      recognized: { type: String },
      topic: { type: String },
      answer: { type: String },
      steps: { type: [String], default: [] },
      hint: { type: String },
      practice: { type: String },
      practiceAnswer: { type: String },
      source: { type: String, enum: ['gemini', 'demo'], required: true },
    },
    { timestamps: true },
  ),
);

import mongoose, { Document, Schema } from 'mongoose';

export type EmploymentMode = 'salaried' | 'self-employed' | 'unemployed';
export type BREStatus = 'pending' | 'passed' | 'failed';

export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  fullName: string;
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipPath?: string;
  salarySlipOriginalName?: string;
  breStatus: BREStatus;
  breRejectionReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,            // This checks that every borrower have only one application open at a time
    },
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dob: { type: Date, required: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self-employed', 'unemployed'],
      required: true,
    },
    salarySlipPath: { type: String },
    salarySlipOriginalName: { type: String },
    breStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending',
    },
    breRejectionReasons: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IApplication>('Application', applicationSchema);
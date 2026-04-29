import mongoose, { Document, Schema } from 'mongoose';

export type LoanStatus = 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';

export interface ILoan extends Document {
  _id: mongoose.Types.ObjectId;
  application: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  amount: number;        // Amount range that can be borrowed (₹50K–₹5L)
  tenure: number;        // Days (30–365)
  interestRate: number;  // 12% p.a. Default
  si: number;            // CaLculated Simple Interest
  totalRepayment: number; // Repayment amount (Principal + SI)
  totalPaid: number;     // Amount paid till date
  status: LoanStatus;  
  rejectionReason?: string;
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: { type: Number, required: true, min: 50000, max: 500000 },
    tenure: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 },
    si: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    totalPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'],
      default: 'applied',
    },
    rejectionReason: { type: String },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', loanSchema);
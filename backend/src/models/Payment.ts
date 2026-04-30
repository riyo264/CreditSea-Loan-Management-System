import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {     // Collection Executive manually fills the details below for a repayment
  _id: mongoose.Types.ObjectId;
  loan: mongoose.Types.ObjectId;
  utr: string;          // Unique Transaction ID obtained from the borrower on making a repayment
  amount: number;
  date: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    utr: {
      type: String,
      required: true,
      unique: true,  
      trim: true,
      uppercase: true,
    },
    amount: { type: Number, required: true, min:  0.01 },
    date: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', paymentSchema);
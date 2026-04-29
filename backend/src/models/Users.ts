import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type Role = 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'borrower';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['admin', 'sales', 'sanction', 'disbursement', 'collection', 'borrower'],
      default: 'borrower',
    },
  },
  { timestamps: true }
);

// Hashes the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
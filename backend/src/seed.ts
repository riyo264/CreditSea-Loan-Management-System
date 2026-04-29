/**
 * Seed Script — Pre-creates one account per role for testing.
 *
 * Run: npm run seed
 *
 * CREDENTIALS (login with these):
 * ┌─────────────────┬──────────────────────────┬─────────────────┐
 * │ Role            │ Email                    │ Password        │
 * ├─────────────────┼──────────────────────────┼─────────────────┤
 * │ Admin           │ admin@lms.com            │ Admin@123       │
 * │ Sales           │ sales@lms.com            │ Sales@123       │
 * │ Sanction        │ sanction@lms.com         │ Sanction@123    │
 * │ Disbursement    │ disbursement@lms.com     │ Disburse@123    │
 * │ Collection      │ collection@lms.com       │ Collect@123     │
 * │ Borrower        │ borrower@lms.com         │ Borrower@123    │
 * └─────────────────┴──────────────────────────┴─────────────────┘
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/Users';

const seeds = [
  { name: 'Admin User',         email: 'admin@lms.com',         password: 'Admin@123',    role: 'admin' },
  { name: 'Sales Executive',    email: 'sales@lms.com',         password: 'Sales@123',    role: 'sales' },
  { name: 'Sanction Executive', email: 'sanction@lms.com',      password: 'Sanction@123', role: 'sanction' },
  { name: 'Disbursement Exec',  email: 'disbursement@lms.com',  password: 'Disburse@123', role: 'disbursement' },
  { name: 'Collection Exec',    email: 'collection@lms.com',    password: 'Collect@123',  role: 'collection' },
  { name: 'Test Borrower',      email: 'borrower@lms.com',      password: 'Borrower@123', role: 'borrower' },
] as const;

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
  console.log(`Connecting to MongoDB: ${uri}`);
  await mongoose.connect(uri);
  console.log('✅ Connected\n');

  for (const s of seeds) {
    const existing = await User.findOne({ email: s.email });
    if (existing) {
      console.log(`⏭  Skipped  [${s.role.padEnd(12)}] ${s.email} (already exists)`);
      continue;
    }
    await User.create(s);
    console.log(`✅ Created  [${s.role.padEnd(12)}] ${s.email}  /  ${s.password}`);
  }

  console.log('\nSeeding complete!\n');
  console.log('Login credentials:');
  console.log('┌─────────────────┬──────────────────────────┬─────────────────┐');
  console.log('│ Role            │ Email                    │ Password        │');
  console.log('├─────────────────┼──────────────────────────┼─────────────────┤');
  seeds.forEach(s => {
    console.log(`│ ${s.role.padEnd(15)} │ ${s.email.padEnd(24)} │ ${s.password.padEnd(15)} │`);
  });
  console.log('└─────────────────┴──────────────────────────┴─────────────────┘');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Application from '../models/Application';
import Loan from '../models/Loan';
import { runBRE, calculateLoanMath } from '../utils/BRE';

// Collects personal info and runs BRE. Borrowers cannot proceed if BRE fails.
export const submitPersonalDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const borrowerId = req.user!.id;
    const { fullName, pan, dob, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dob || monthlySalary === undefined || !employmentMode) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    // Run BRE on the server for security precautions
    const breResult = runBRE({ dob, monthlySalary: Number(monthlySalary), employmentMode, pan });

    // Update if the application already or create a new one if do not exist
    const application = await Application.findOneAndUpdate(
      { borrower: borrowerId },
      {
        borrower: borrowerId,
        fullName: fullName.trim(),
        pan: pan.trim().toUpperCase(),
        dob: new Date(dob),
        monthlySalary: Number(monthlySalary),
        employmentMode,
        breStatus: breResult.passed ? 'passed' : 'failed',
        breRejectionReasons: breResult.reasons,
        salarySlipPath: undefined,
        salarySlipOriginalName: undefined,
      },
      { upsert: true, new: true }
    );

    if (!breResult.passed) {
      res.status(422).json({
        message: 'Application rejected by Business Rule Engine.',
        breResult,
        application,
      });
      return;
    }

    res.json({
      message: 'Personal details saved. BRE check passed.',
      breResult,
      application,
    });
  } catch (error) {
    console.error('Personal details error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Multer handles the file, this controller validates and saves the path.
export const uploadSalarySlip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const borrowerId = req.user!.id;

    const application = await Application.findOne({ borrower: borrowerId });
    if (!application) {
      res.status(404).json({ message: 'Please complete personal details first.' });
      return;
    }

    if (application.breStatus !== 'passed') {
      res.status(403).json({ message: 'BRE check failed. You cannot upload documents.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded.' });
      return;
    }

    // req.file is set by multer middleware
    application.salarySlipPath = req.file.path;
    application.salarySlipOriginalName = req.file.originalname;
    await application.save();

    res.json({
      message: 'Salary slip uploaded successfully.',
      application,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Final step: configure loan and submit application.
export const applyForLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const borrowerId = req.user!.id;
    const { amount, tenure } = req.body;

    if (!amount || !tenure) {
      res.status(400).json({ message: 'Loan amount and tenure are required.' });
      return;
    }

    const principal = Number(amount);
    const tenureDays = Number(tenure);

    // Sets the range for different fields
    if (principal < 50000 || principal > 500000) {
      res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹5,00,000.' });
      return;
    }
    if (tenureDays < 30 || tenureDays > 365) {
      res.status(400).json({ message: 'Tenure must be between 30 and 365 days.' });
      return;
    }

    const application = await Application.findOne({ borrower: borrowerId });
    if (!application) {
      res.status(404).json({ message: 'Please complete personal details first.' });
      return;
    }

    if (application.breStatus !== 'passed') {
      res.status(403).json({ message: 'BRE check failed. You are not eligible to apply.' });
      return;
    }

    if (!application.salarySlipPath) {
      res.status(400).json({ message: 'Please upload your salary slip before applying.' });
      return;
    }

    // Check if already applied
    const existingLoan = await Loan.findOne({ borrower: borrowerId, status: { $in: ['applied', 'sanctioned', 'disbursed'] } });
    if (existingLoan) {
      res.status(409).json({
        message: 'You already have an active loan application.',
        loan: existingLoan,
      });
      return;
    }

    // Calculate SI and total repayment
    const { si, totalRepayment } = calculateLoanMath(principal, tenureDays);

    const loan = await Loan.create({
      application: application._id,
      borrower: borrowerId,
      amount: principal,
      tenure: tenureDays,
      interestRate: 12,
      si,
      totalRepayment,
      status: 'applied',
    });

    res.status(201).json({
      message: 'Loan application submitted successfully!',
      loan,
    });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/application/status  (Borrower's own application + loan status)
export const getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const borrowerId = req.user!.id;

    const application = await Application.findOne({ borrower: borrowerId });
    const loan = await Loan.findOne({ borrower: borrowerId })
      .sort({ createdAt: -1 })
      .populate('sanctionedBy', 'name')
      .populate('disbursedBy', 'name');

    res.json({ application, loan });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};
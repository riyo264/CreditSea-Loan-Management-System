import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/Users';
import Application from '../models/Application';
import Loan from '../models/Loan';
import Payment from '../models/Payment';

// Shows borrowers who have registered but not yet applied for a loan.
// Useful for lead tracking and follow-up.

// GET /api/dashboard/sales
export const getSalesLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const borrowers = await User.find({ role: 'borrower' }).select('-password').lean();

    // Find borrowers who have an active (non-rejected) loan
    const activeLoanBorrowerIds = await Loan.distinct('borrower', {
      status: { $ne: 'rejected' },
    });

    // Leads = borrowers without active loans (Helps the sales department so that no acciedental cold calls are made)
    const leads = borrowers.filter(
      (b) => !activeLoanBorrowerIds.some((id) => id.toString() === b._id.toString())
    );

    const enriched = await Promise.all(
      leads.map(async (lead) => {
        const application = await Application.findOne({ borrower: lead._id }).lean();
        return { ...lead, application };
      })
    );

    res.json({ leads: enriched, count: enriched.length });
  } catch (error) {
    console.error('Sales leads error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// SANCTION MODULE 
// Reviews applied loans and approves or rejects them.

// GET /api/dashboard/sanction
export const getSanctionQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'applied' })
      .populate('borrower', 'name email')
      .populate('application')
      .sort({ createdAt: 1 }) 
      .lean();

    res.json({ loans, count: loans.length });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/dashboard/sanction/:loanId
/**
 * This enforces rules that:
 * Sanction Module cannot approve loan if status is not applied
 * only approve and reject actions are acceptable
 * Rejection is only accepted with a Rejection Reason attached to it
 */

export const sanctionLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ message: 'Action must be "approve" or "reject".' });
      return;
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      res.status(400).json({ message: 'Rejection reason is required.' });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'applied') {
      res.status(409).json({
        message: `Cannot sanction a loan with status "${loan.status}". Only "applied" loans can be sanctioned.`,
      });
      return;
    }

    // Status transitions: applied → sanctioned OR applied → rejected
    loan.status = action === 'approve' ? 'sanctioned' : 'rejected';
    loan.sanctionedBy = req.user!.id as unknown as typeof loan.sanctionedBy;
    loan.sanctionedAt = new Date();
    if (action === 'reject') loan.rejectionReason = rejectionReason;

    await loan.save();

    res.json({
      message: `Loan ${action === 'approve' ? 'sanctioned' : 'rejected'} successfully.`,
      loan,
    });
  } catch (error) {
    console.error('Sanction error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// DISBURSEMENT MODULE
// Marks sanctioned loans as disbursed (funds released to borrower).

// GET /api/dashboard/disbursement
export const getDisbursementQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'sanctioned' })
      .populate('borrower', 'name email')
      .populate('application', 'fullName pan')
      .populate('sanctionedBy', 'name')
      .sort({ sanctionedAt: 1 })
      .lean();

    res.json({ loans, count: loans.length });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/dashboard/disbursement/:loanId
export const disburseLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'sanctioned') {
      res.status(409).json({
        message: `Cannot disburse a loan with status "${loan.status}". Only "sanctioned" loans can be disbursed.`,
      });
      return;
    }

    // Status transition: sanctioned → disbursed
    loan.status = 'disbursed';
    loan.disbursedBy = req.user!.id as unknown as typeof loan.disbursedBy;
    loan.disbursedAt = new Date();
    await loan.save();

    res.json({ message: 'Loan disbursed successfully.', loan });
  } catch (error) {
    console.error('Disburse error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// COLLECTION MODULE
// Tracks payments on disbursed loans and automatically closes when fully paid

// GET /api/dashboard/collection
export const getCollectionQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: { $in: ['disbursed', 'closed'] } })
      .populate('borrower', 'name email')
      .populate('application', 'fullName')
      .sort({ disbursedAt: 1 })
      .lean();

    // Attach payment history to each loan
    const enriched = await Promise.all(
      loans.map(async (loan) => {
        const payments = await Payment.find({ loan: loan._id })
          .populate('recordedBy', 'name')
          .sort({ date: -1 })
          .lean();
        const outstanding = loan.totalRepayment - loan.totalPaid;
        return { ...loan, payments, outstanding: Math.max(0, outstanding) };
      })
    );

    res.json({ loans: enriched, count: enriched.length });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/dashboard/collection/:loanId/payment
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const { utr, amount, date } = req.body;

    if (!utr || !amount || !date) {
      res.status(400).json({ message: 'UTR, amount and date are required.' });
      return;
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'disbursed') {
      res.status(409).json({
        message: `Cannot record payment for a loan with status "${loan.status}". Only "disbursed" loans accept payments.`,
      });
      return;
    }

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      res.status(400).json({ message: 'Payment amount must be greater than 0.' });
      return;
    }

    const outstanding = loan.totalRepayment - loan.totalPaid;
    if (paymentAmount > outstanding) {
      res.status(400).json({
        message: `Payment amount ₹${paymentAmount} exceeds outstanding balance ₹${outstanding.toFixed(2)}.`,
      });
      return;
    }

    // Create payment (UTR uniqueness enforced at DB level via unique index)
    let payment;
    try {
      payment = await Payment.create({
        loan: loanId,
        utr: utr.trim().toUpperCase(),
        amount: paymentAmount,
        date: new Date(date),
        recordedBy: req.user!.id,
      });
    } catch (err: unknown) {
      // MongoDB duplicate key error code
      if ((err as { code?: number }).code === 11000) {
        res.status(409).json({ message: `UTR "${utr}" already exists. Each payment must have a unique UTR.` });
        return;
      }
      throw err;
    }

    // Update loan's total paid
    loan.totalPaid += paymentAmount;

    // Auto-close when fully repaid 
    if (loan.totalPaid >= loan.totalRepayment - 0.01) {
      loan.status = 'closed';
      loan.closedAt = new Date();
    }

    await loan.save();

    res.status(201).json({
      message:
        loan.status === 'closed'
          ? 'Payment recorded. Loan is now CLOSED — fully repaid!'
          : 'Payment recorded successfully.',
      payment,
      loan: {
        status: loan.status,
        totalPaid: loan.totalPaid,
        totalRepayment: loan.totalRepayment,
        outstanding: Math.max(0, loan.totalRepayment - loan.totalPaid),
      },
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/dashboard/collection/:loanId/payments
export const getLoanPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const payments = await Payment.find({ loan: loanId })
      .populate('recordedBy', 'name')
      .sort({ date: -1 });
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};
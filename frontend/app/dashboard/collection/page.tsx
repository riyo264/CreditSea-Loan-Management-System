'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import axios from 'axios';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

interface Loan {
  _id: string;
  totalRepayment: number;
  totalPaid: number;
  borrower: { name: string };
}

interface PaymentModal {
  loanId: string;
  amount: string;
  utr: string;
  date: string;
}

export default function CollectionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<PaymentModal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    dashboardApi.getCollectionQueue()
      .then((res) => setLoans(res.data.loans))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal) return;
    
    setSubmitting(true);
    try {
      await dashboardApi.recordPayment(paymentModal.loanId, {
        amount: Number(paymentModal.amount),
        utr: paymentModal.utr,
        date: paymentModal.date,
      });
      showToast('💰 Payment recorded successfully!');
      setPaymentModal(null);
      load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showToast(`❌ ${err.response?.data?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm animate-pulse">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Collections</h1>
        <p className="text-slate-500 mt-1">Track active loans and record manual repayments.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Loading active loans...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Borrower</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Total Repayment</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Total Paid</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Outstanding</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Progress</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No active disbursed loans found.</td>
                </tr>
              )}
              {loans.map((loan) => {
                const outstanding = loan.totalRepayment - loan.totalPaid;
                const progressPct = Math.min(100, (loan.totalPaid / loan.totalRepayment) * 100);
                
                return (
                  <tr key={loan._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{loan.borrower.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatINR(loan.totalRepayment)}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{formatINR(loan.totalPaid)}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{formatINR(outstanding)}</td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${progressPct}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="btn-primary py-1.5 px-3 text-xs"
                        onClick={() => setPaymentModal({ loanId: loan._id, amount: outstanding.toString(), utr: '', date: new Date().toISOString().split('T')[0] })}
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Record Repayment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  className="input"
                  min="1"
                  value={paymentModal.amount}
                  onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Transaction UTR / Ref Number</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. UTR123456789"
                  value={paymentModal.utr}
                  onChange={(e) => setPaymentModal({ ...paymentModal, utr: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={paymentModal.date}
                  onChange={(e) => setPaymentModal({ ...paymentModal, date: e.target.value })}
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn-secondary flex-1" onClick={() => setPaymentModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
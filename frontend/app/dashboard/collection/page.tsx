'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import axios from 'axios';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(n);

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
      showToast(`💰 Payment recorded successfully!`);
      setPaymentModal(null);
      load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showToast(`❌ ${err.response?.data?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2 sm:p-6 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 text-sm font-medium animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-3">
          {toast}
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Collections</h1>
          <p className="text-slate-500 mt-2 font-medium">Track active loans and record manual repayments.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-2.5 shadow-sm text-sm font-medium flex items-center gap-3">
          <span className="text-slate-500">Active Accounts:</span>
          <span className="bg-brand-100 text-brand-700 py-1 px-3 rounded-md font-bold">{loans.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-500 font-medium p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Loading active loans...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Borrower</th>
                  <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Total Repayment</th>
                  <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Total Paid</th>
                  <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Outstanding</th>
                  <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs w-48">Progress</th>
                  <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">No active disbursed loans found.</td>
                  </tr>
                )}
                {loans.map((loan) => {
                  // Calculate the raw outstanding amount
                  const outstanding = loan.totalRepayment - loan.totalPaid;
                  
                  // Force JavaScript to clean up the decimal to exactly 2 places for the input field
                  const cleanOutstanding = Math.max(0, outstanding).toFixed(2); 
                  
                  const progressPct = Math.min(100, (loan.totalPaid / loan.totalRepayment) * 100);
                  
                  return (
                    <tr key={loan._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{loan.borrower.name}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">ID: {loan._id.slice(-6).toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{formatINR(loan.totalRepayment)}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">{formatINR(loan.totalPaid)}</td>
                      <td className="px-6 py-4 font-bold text-red-500">{formatINR(outstanding)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-slate-900 h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${progressPct}%` }}>
                              <div className="absolute inset-0 bg-white/20 w-full h-full" />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-9 text-right">{progressPct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:text-brand-700 hover:border-brand-300 hover:bg-brand-50 rounded-lg text-xs font-bold shadow-sm active:scale-95 transition-all"
                          onClick={() => setPaymentModal({ 
                            loanId: loan._id, 
                            amount: cleanOutstanding, // Pass the clean 2-decimal string here
                            utr: '', 
                            date: new Date().toISOString().split('T')[0] 
                          })}
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
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Record Repayment</h3>
              <p className="text-slate-500 text-sm mt-1 font-medium">Log a manual transaction for this account.</p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount Received (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    required
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all font-semibold"
                    min="0.01"
                    step="0.01"
                    value={paymentModal.amount}
                    onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Transaction UTR / Ref Number</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-slate-400"
                  placeholder="e.g. UTR123456789"
                  value={paymentModal.utr}
                  onChange={(e) => setPaymentModal({ ...paymentModal, utr: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  value={paymentModal.date}
                  onChange={(e) => setPaymentModal({ ...paymentModal, date: e.target.value })}
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors active:scale-95 flex-1" onClick={() => setPaymentModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all active:scale-95 flex-[2] shadow-lg shadow-slate-900/20 flex justify-center items-center" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import axios from 'axios';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

interface Loan {
  _id: string;
  amount: number;
  tenure: number;
  si: number;
  totalRepayment: number;
  borrower: { name: string; email: string };
  application: { pan: string };
}

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    dashboardApi.getDisbursementQueue()
      .then((res) => setLoans(res.data.loans))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDisburse = async (loanId: string) => {
    setProcessing(loanId);
    try {
      await dashboardApi.disburseLoan(loanId);
      showToast('💳 Funds disbursed successfully!');
      load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showToast(`❌ ${err.response?.data?.message}`);
    } finally {
      setProcessing(null);
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Disbursement Queue</h1>
          <p className="text-slate-500 mt-2 font-medium">Release funds for sanctioned loans.</p>
        </div>
        {!loading && (
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-2.5 shadow-sm text-sm font-medium flex items-center gap-3">
            <span className="text-slate-500">Ready to Disburse:</span>
            <span className="bg-purple-100 text-purple-700 py-1 px-3 rounded-md font-bold">{loans.length}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-500 font-medium p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Loading disbursement queue...
        </div>
      ) : (
        <>
          {loans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 border-dashed p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">
                🏦
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">All Caught Up</h3>
              <p className="text-slate-500 font-medium mt-2">No loans currently waiting for disbursement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loans.map((loan) => (
                <div key={loan._id} className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-brand-200 transition-all duration-300 group">
                  <div>
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="font-bold text-slate-900 text-lg group-hover:text-brand-700 transition-colors line-clamp-1" title={loan.borrower.name}>
                          {loan.borrower.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-1.5 bg-slate-50 inline-block px-2.5 py-1 rounded-md border border-slate-200/60">
                          PAN: <span className="font-semibold text-slate-700">{loan.application?.pan}</span>
                        </p>
                      </div>
                      <span className="bg-amber-50 text-amber-600 border border-amber-200/50 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shrink-0">
                        Sanctioned
                      </span>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 mb-6 relative overflow-hidden group-hover:bg-brand-50/30 transition-colors">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Approved Amount</p>
                      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatINR(loan.amount)}</p>
                    </div>
                  </div>

                  <button
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-slate-900/20 py-3.5 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={processing === loan._id}
                    onClick={() => handleDisburse(loan._id)}
                  >
                    {processing === loan._id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : '💳 Disburse Funds'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
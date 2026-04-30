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
      showToast('Funds disbursed successfully!');
      load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showToast(`❌ ${err.response?.data?.message}`);
    } finally {
      setProcessing(null);
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
        <h1 className="text-2xl font-bold text-slate-900">Disbursement Queue</h1>
        <p className="text-slate-500 mt-1">Release funds for sanctioned loans.</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Loading queue...
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-4">
            <span className="badge bg-purple-100 text-purple-700 text-sm">{loans.length} ready for disbursement</span>
          </div>

          {loans.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🏦</p>
              <p>No loans currently waiting for disbursement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.map((loan) => (
                <div key={loan._id} className="card flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-slate-800">{loan.borrower.name}</p>
                      <span className="badge badge-sanctioned">Sanctioned</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4 font-mono">PAN: {loan.application?.pan}</p>
                    
                    <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-slate-500 mb-1">Approved Amount to Disburse</p>
                      <p className="text-2xl font-bold text-slate-800">{formatINR(loan.amount)}</p>
                    </div>
                  </div>

                  <button
                    className="btn-primary w-full py-2.5 flex justify-center items-center gap-2"
                    disabled={processing === loan._id}
                    onClick={() => handleDisburse(loan._id)}
                  >
                    {processing === loan._id ? 'Processing...' : '💳 Disburse Funds'}
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
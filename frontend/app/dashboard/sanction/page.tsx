'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import axios from 'axios';

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

interface Loan {
  _id: string;
  amount: number;
  tenure: number;
  si: number;
  totalRepayment: number;
  createdAt: string;
  borrower: { name: string; email: string };
  application: { fullName: string; pan: string; employmentMode: string; monthlySalary: number };
}

interface RejectModal {
  loanId: string;
  reason: string;
}

export default function SanctionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<RejectModal | null>(null);
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    dashboardApi.getSanctionQueue()
      .then((res) => setLoans(res.data.loans))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleApprove = async (loanId: string) => {
    setProcessing(loanId);
    try {
      await dashboardApi.sanctionLoan(loanId, { action: 'approve' });
      showToast('✅ Loan sanctioned successfully!');
      load();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) showToast(`❌ ${err.response?.data?.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectModal.reason.trim()) return;
    setProcessing(rejectModal.loanId);
    try {
      await dashboardApi.sanctionLoan(rejectModal.loanId, { action: 'reject', rejectionReason: rejectModal.reason });
      setRejectModal(null);
      showToast('Loan rejected.');
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
        <h1 className="text-2xl font-bold text-slate-900">Sanction — Loan Review</h1>
        <p className="text-slate-500 mt-1">Review and approve or reject applied loans.</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Loading queue…
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-4">
            <span className="badge bg-blue-100 text-blue-700 text-sm">{loans.length} pending</span>
          </div>

          {loans.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">📭</p>
              <p>No loans pending sanction review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div key={loan._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-800">{loan.application?.fullName || loan.borrower.name}</p>
                        <span className="badge badge-applied">Applied</span>
                      </div>
                      <p className="text-slate-500 text-sm mb-3">{loan.borrower.email} · Applied {formatDate(loan.createdAt)}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          ['Loan Amount', formatINR(loan.amount)],
                          ['Tenure', `${loan.tenure} days`],
                          ['Interest (SI)', formatINR(loan.si)],
                          ['Total Repayment', formatINR(loan.totalRepayment)],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-slate-50 rounded-lg p-2.5">
                            <p className="text-xs text-slate-400">{k}</p>
                            <p className="font-semibold text-slate-800 text-sm mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>

                      {loan.application && (
                        <div className="mt-3 text-xs text-slate-500 flex gap-4">
                          <span>PAN: <span className="font-mono font-medium text-slate-700">{loan.application.pan}</span></span>
                          <span>Employment: <span className="capitalize font-medium text-slate-700">{loan.application.employmentMode}</span></span>
                          <span>Salary: <span className="font-medium text-slate-700">{formatINR(loan.application.monthlySalary)}/mo</span></span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 lg:flex-col">
                      <button
                        className="btn-success flex-1 lg:flex-none text-sm py-2"
                        disabled={processing === loan._id}
                        onClick={() => handleApprove(loan._id)}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="btn-danger flex-1 lg:flex-none text-sm py-2"
                        disabled={processing === loan._id}
                        onClick={() => setRejectModal({ loanId: loan._id, reason: '' })}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reject Loan</h3>
            <p className="text-slate-500 text-sm mb-4">Please provide a reason for rejection. This will be visible to the borrower.</p>
            <textarea
              className="input resize-none h-24"
              placeholder="e.g. Insufficient income documentation…"
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
            />
            <div className="flex gap-3 mt-4">
              <button className="btn-secondary flex-1" onClick={() => setRejectModal(null)}>Cancel</button>
              <button
                className="btn-danger flex-1"
                disabled={!rejectModal.reason.trim() || processing !== null}
                onClick={handleReject}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { applicationApi } from '@/lib/api';

const STATUS_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  applied:    { label: 'Applied',     color: 'bg-blue-100 text-blue-700',    desc: 'Your application is under review by our sanction team.' },
  sanctioned: { label: 'Sanctioned',  color: 'bg-amber-100 text-amber-700',  desc: 'Your loan has been approved! Waiting for disbursement.' },
  rejected:   { label: 'Rejected',    color: 'bg-red-100 text-red-700',      desc: 'Your loan application was not approved.' },
  disbursed:  { label: 'Disbursed',   color: 'bg-purple-100 text-purple-700', desc: 'Funds have been released to your account.' },
  closed:     { label: 'Closed',      color: 'bg-emerald-100 text-emerald-700', desc: 'Loan fully repaid. 🎉' },
};

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function StatusPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{ application: unknown; loan: unknown } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    if (!isLoading && user && user.role !== 'borrower') router.replace('/');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    applicationApi.getStatus()
      .then((res) => setData(res.data))
      .catch(() => router.replace('/apply'))
      .finally(() => setLoading(false));
  }, [user, router]);

  if (isLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const loan = data?.loan as Record<string, unknown> | null;
  const application = data?.application as Record<string, unknown> | null;

  if (!loan) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No active loan found.</p>
          <button className="btn-primary" onClick={() => router.push('/apply')}>Apply Now</button>
        </div>
      </div>
    );
  }

  const status = loan.status as string;
  const statusInfo = STATUS_LABELS[status] || { label: status, color: 'bg-slate-100 text-slate-700', desc: '' };
  const outstanding = Number(loan.totalRepayment) - Number(loan.totalPaid);
  const progressPct = Math.min(100, (Number(loan.totalPaid) / Number(loan.totalRepayment)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Loan Status</h1>
            <p className="text-slate-500 text-sm">Welcome, {user?.name}</p>
          </div>
          <button onClick={logout} className="btn-secondary text-sm py-1.5 px-4">Logout</button>
        </div>

        {/* Status Banner */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Current Status</h2>
            <span className={`badge text-sm px-3 py-1 ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
          <p className="text-slate-600">{statusInfo.desc}</p>
          {status === 'rejected' && Boolean(loan?.rejectionReason) && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              <strong>Reason:</strong> {String(loan?.rejectionReason)}
            </div>
          )}
        </div>

        {/* Loan Details */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Loan Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Principal', formatINR(Number(loan.amount))],
              ['Tenure', `${loan.tenure} days`],
              ['Interest Rate', `${loan.interestRate}% p.a.`],
              ['Simple Interest', formatINR(Number(loan.si))],
              ['Total Repayment', formatINR(Number(loan.totalRepayment))],
              ['Applied On', formatDate(String(loan.createdAt))],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="font-semibold text-slate-800 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Repayment Progress (disbursed/closed) */}
        {(status === 'disbursed' || status === 'closed') && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">Repayment Progress</h2>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Paid: {formatINR(Number(loan.totalPaid))}</span>
                <span className="text-slate-600">Outstanding: {formatINR(Math.max(0, outstanding))}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${status === 'closed' ? 'bg-emerald-500' : 'bg-brand-500'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">{progressPct.toFixed(1)}% repaid</p>
            </div>
          </div>
        )}

        {/* Applicant Info */}
        {application && (
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">Application Info</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Name:</span> <span className="font-medium">{String(application.fullName)}</span></div>
              <div><span className="text-slate-500">PAN:</span> <span className="font-medium font-mono">{String(application.pan)}</span></div>
              <div><span className="text-slate-500">Employment:</span> <span className="font-medium capitalize">{String(application.employmentMode)}</span></div>
              <div><span className="text-slate-500">Salary:</span> <span className="font-medium">{formatINR(Number(application.monthlySalary))}/mo</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
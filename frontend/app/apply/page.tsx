'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { applicationApi } from '@/lib/api';
import axios from 'axios';

// Types
type Step = 1 | 2 | 3 | 4;

interface PersonalForm {
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: string;
  employmentMode: string;
}

interface LoanForm {
  amount: number;
  tenure: number;
}

// Helpers 
const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function calcSI(principal: number, tenureDays: number, rate = 12) {
  const si = (principal * rate * tenureDays) / (365 * 100);
  return { si, totalRepayment: principal + si };
}

// Step Indicator
function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Personal Details' },
    { n: 2, label: 'BRE Check' },
    { n: 3, label: 'Salary Slip' },
    { n: 4, label: 'Loan Config' },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${current > s.n ? 'bg-emerald-500 text-white' : current === s.n ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-400'}`}
            >
              {current > s.n ? '✓' : s.n}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap ${current === s.n ? 'text-brand-600 font-semibold' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mt-[-1rem] transition-colors ${current > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Main Component 
export default function ApplyPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [personalForm, setPersonalForm] = useState<PersonalForm>({
    fullName: '', pan: '', dob: '', monthlySalary: '', employmentMode: 'salaried',
  });
  const [salarySlipFile, setSalarySlipFile] = useState<File | null>(null);
  const [loanForm, setLoanForm] = useState<LoanForm>({ amount: 100000, tenure: 90 });
  const [breResult, setBreResult] = useState<{ passed: boolean; reasons: string[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Check existing application status on mount
  useEffect(() => {
    if (!user || user.role !== 'borrower') return;
    applicationApi.getStatus().then((res) => {
      const { loan } = res.data;
      if (loan) router.replace('/status');
    }).catch(() => {/* no existing application */});
  }, [user, router]);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    if (!isLoading && user && user.role !== 'borrower') router.replace(`/dashboard/${user.role === 'admin' ? 'sales' : user.role}`);
  }, [user, isLoading, router]);

  // Step 1: Personal Details 
  const handlePersonalSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await applicationApi.submitPersonalDetails({
        ...personalForm,
        monthlySalary: Number(personalForm.monthlySalary),
      });
      setBreResult(res.data.breResult);
      setStep(2);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setBreResult(err.response.data.breResult);
        setStep(2); // Go to step 2 to show BRE failure
      } else if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to submit.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Salary Slip Upload 
  const handleUpload = async () => {
    if (!salarySlipFile) { setError('Please select a file.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await applicationApi.uploadSalarySlip(salarySlipFile);
      setStep(4);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 4: Apply
  const handleApply = async () => {
    setError('');
    setSubmitting(true);
    try {
      await applicationApi.applyForLoan(loanForm);
      setSuccess('Loan application submitted successfully!');
      setTimeout(() => router.push('/status'), 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.message || 'Application failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Live SI calculation
  const { si, totalRepayment } = calcSI(loanForm.amount, loanForm.tenure);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Loan Application</h1>
            <p className="text-slate-500 text-sm">Welcome, {user.name}</p>
          </div>
          <button onClick={logout} className="btn-secondary text-sm py-1.5 px-4">Logout</button>
        </div>

        <div className="card shadow-md">
          <StepIndicator current={step} />

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Personal Details</h2>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input className="input" placeholder="As per Aadhaar" value={personalForm.fullName}
                    onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PAN Number</label>
                  <input className="input uppercase" placeholder="ABCDE1234F" maxLength={10}
                    value={personalForm.pan}
                    onChange={(e) => setPersonalForm({ ...personalForm, pan: e.target.value.toUpperCase() })} />
                  <p className="text-xs text-slate-400 mt-1">Format: 5 letters + 4 digits + 1 letter</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input type="date" className="input" value={personalForm.dob}
                    onChange={(e) => setPersonalForm({ ...personalForm, dob: e.target.value })} />
                  <p className="text-xs text-slate-400 mt-1">Age must be 23–50</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Salary (₹)</label>
                  <input type="number" className="input" placeholder="e.g. 35000" min={0}
                    value={personalForm.monthlySalary}
                    onChange={(e) => setPersonalForm({ ...personalForm, monthlySalary: e.target.value })} />
                  <p className="text-xs text-slate-400 mt-1">Min. ₹25,000/month</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employment Mode</label>
                  <select className="input" value={personalForm.employmentMode}
                    onChange={(e) => setPersonalForm({ ...personalForm, employmentMode: e.target.value })}>
                    <option value="salaried">Salaried</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button className="btn-primary w-full" onClick={handlePersonalSubmit} disabled={submitting ||
                  !personalForm.fullName || !personalForm.pan || !personalForm.dob || !personalForm.monthlySalary}>
                  {submitting ? 'Checking eligibility…' : 'Check Eligibility →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BRE Result */}
          {step === 2 && breResult && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Eligibility Check Result</h2>

              {breResult.passed ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">✅</span>
                    <h3 className="text-emerald-800 font-bold text-lg">BRE Check Passed!</h3>
                  </div>
                  <p className="text-emerald-700 text-sm">All eligibility criteria are met. You may proceed.</p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">❌</span>
                    <h3 className="text-red-800 font-bold text-lg">Application Rejected</h3>
                  </div>
                  <p className="text-red-700 text-sm font-medium mb-2">Reasons:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {breResult.reasons.map((r, i) => (
                      <li key={i} className="text-red-600 text-sm">{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button className="btn-secondary flex-1" onClick={() => setStep(1)}>← Edit Details</button>
                {breResult.passed && (
                  <button className="btn-primary flex-1" onClick={() => setStep(3)}>Upload Salary Slip →</button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Upload Salary Slip */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Upload Salary Slip</h2>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all"
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 5 * 1024 * 1024) { setError('File size must be under 5 MB.'); return; }
                      setSalarySlipFile(f);
                      setError('');
                    }
                  }}
                />
                <div className="text-4xl mb-3">📄</div>
                {salarySlipFile ? (
                  <>
                    <p className="text-emerald-700 font-semibold">{salarySlipFile.name}</p>
                    <p className="text-slate-400 text-sm">{(salarySlipFile.size / 1024).toFixed(0)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-600 font-medium">Click to upload salary slip</p>
                    <p className="text-slate-400 text-sm mt-1">PDF, JPG, or PNG · Max 5 MB</p>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setStep(2)}>← Back</button>
                <button className="btn-primary flex-1" onClick={handleUpload} disabled={!salarySlipFile || submitting}>
                  {submitting ? 'Uploading…' : 'Upload & Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Loan Configuration */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800">Configure Your Loan</h2>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
              {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm font-medium">{success}</div>}

              {/* Loan Amount Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Loan Amount</label>
                  <span className="text-brand-600 font-bold">{formatINR(loanForm.amount)}</span>
                </div>
                <input type="range" className="w-full accent-brand-600" min={50000} max={500000} step={5000}
                  value={loanForm.amount}
                  onChange={(e) => setLoanForm({ ...loanForm, amount: Number(e.target.value) })} />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>₹50,000</span><span>₹5,00,000</span>
                </div>
              </div>

              {/* Tenure Slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Tenure</label>
                  <span className="text-brand-600 font-bold">{loanForm.tenure} days</span>
                </div>
                <input type="range" className="w-full accent-brand-600" min={30} max={365} step={1}
                  value={loanForm.tenure}
                  onChange={(e) => setLoanForm({ ...loanForm, tenure: Number(e.target.value) })} />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>30 days</span><span>365 days</span>
                </div>
              </div>

              {/* Live Calculation Panel */}
              <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-brand-800 uppercase tracking-wide">Loan Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Principal</p>
                    <p className="font-bold text-slate-800">{formatINR(loanForm.amount)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Interest Rate</p>
                    <p className="font-bold text-slate-800">12% p.a.</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Simple Interest</p>
                    <p className="font-bold text-amber-600">{formatINR(si)}</p>
                  </div>
                  <div className="bg-brand-600 rounded-lg p-3 text-center">
                    <p className="text-xs text-brand-200 mb-1">Total Repayment</p>
                    <p className="font-bold text-white text-lg">{formatINR(totalRepayment)}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  SI = (P × R × T) / (365 × 100) · Fixed rate, simple interest
                </p>
              </div>

              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setStep(3)}>← Back</button>
                <button className="btn-primary flex-1" onClick={handleApply} disabled={submitting}>
                  {submitting ? 'Submitting…' : '🚀 Apply Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
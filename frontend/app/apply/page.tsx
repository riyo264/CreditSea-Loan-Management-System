'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { applicationApi } from '@/lib/api';
import axios from 'axios';

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

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

function calcSI(principal: number, tenureDays: number, rate = 12) {
  const si = (principal * rate * tenureDays) / (365 * 100);
  return { si, totalRepayment: principal + si };
}

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Personal' },
    { n: 2, label: 'Eligibility' },
    { n: 3, label: 'Documents' },
    { n: 4, label: 'Configure' },
  ];
  return (
    <div className="flex items-center justify-between mb-10 relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10" />
      
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-500 rounded-full -z-10 transition-all duration-500 ease-in-out" 
        style={{ width: `${((current - 1) / (steps.length - 1)) * 100}%` }} 
      />

      {steps.map((s) => {
        const isCompleted = current > s.n;
        const isCurrent = current === s.n;
        
        return (
          <div key={s.n} className="flex flex-col items-center bg-white px-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-4 border-white shadow-sm
                ${isCompleted ? 'bg-brand-500 text-white' : isCurrent ? 'bg-slate-900 text-white ring-4 ring-brand-100' : 'bg-slate-100 text-slate-400'}`}
            >
              {isCompleted ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              ) : s.n}
            </div>
            <span className={`text-xs mt-2.5 font-semibold tracking-wide uppercase transition-colors
              ${isCurrent ? 'text-slate-900' : isCompleted ? 'text-brand-600' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

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

  useEffect(() => {
    if (!user || user.role !== 'borrower') return;
    applicationApi.getStatus().then((res) => {
      const { loan } = res.data;
      if (loan) router.replace('/status');
    }).catch(() => {});
  }, [user, router]);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    if (!isLoading && user && user.role !== 'borrower') router.replace(`/dashboard/${user.role === 'admin' ? 'sales' : user.role}`);
  }, [user, isLoading, router]);

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
        setStep(2);
      } else if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to submit.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  const { si, totalRepayment } = calcSI(loanForm.amount, loanForm.tenure);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-slate-900 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-brand-600/30 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[0%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto pt-8 px-4 pb-24">
        <div className="flex justify-between items-center mb-10 text-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 font-bold text-xl">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CreditSea</h1>
              <p className="text-slate-300 text-xs font-medium uppercase tracking-wider">Application Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-200 hidden sm:inline-block">
              Logged in as <span className="text-white font-bold">{user.name}</span>
            </span>
            <button onClick={logout} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors backdrop-blur-md">
              Sign Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 p-8 sm:p-12">
          <StepIndicator current={step} />

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Personal Details</h2>
                <p className="text-slate-500 text-sm mt-1">Please provide your accurate information as per government ID.</p>
              </div>
              
              {error && <div className="bg-red-50/50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" placeholder="As per Aadhaar" value={personalForm.fullName}
                    onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">PAN Number</label>
                  <input className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all uppercase placeholder:normal-case" placeholder="ABCDE1234F" maxLength={10}
                    value={personalForm.pan}
                    onChange={(e) => setPersonalForm({ ...personalForm, pan: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                  <input type="date" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" value={personalForm.dob}
                    onChange={(e) => setPersonalForm({ ...personalForm, dob: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Monthly Salary (₹)</label>
                  <input type="number" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" placeholder="e.g. 35000" min={0}
                    value={personalForm.monthlySalary}
                    onChange={(e) => setPersonalForm({ ...personalForm, monthlySalary: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Employment Mode</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" value={personalForm.employmentMode}
                    onChange={(e) => setPersonalForm({ ...personalForm, employmentMode: e.target.value })}>
                    <option value="salaried">Salaried</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-slate-900/20 transition-all duration-300 disabled:opacity-70 flex justify-center items-center gap-2" 
                  onClick={handlePersonalSubmit} 
                  disabled={submitting || !personalForm.fullName || !personalForm.pan || !personalForm.dob || !personalForm.monthlySalary}
                >
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {submitting ? 'Checking Eligibility...' : 'Verify Eligibility'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && breResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Assessment</h2>
                <p className="text-slate-500 text-sm mt-1">Our Business Rule Engine has processed your application.</p>
              </div>

              {breResult.passed ? (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-emerald-900 font-bold text-2xl mb-2 tracking-tight">Approved in Principle!</h3>
                  <p className="text-emerald-700/80 font-medium">You meet all preliminary requirements. Please proceed to document verification.</p>
                </div>
              ) : (
                <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-red-900 font-bold text-xl mb-1 tracking-tight">Application Declined</h3>
                      <p className="text-red-700 text-sm font-medium mb-3">Unfortunately, we cannot proceed due to the following:</p>
                      <ul className="space-y-2">
                        {breResult.reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-2 text-red-800 text-sm bg-red-100/50 px-3 py-2 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors active:scale-95 flex-1" onClick={() => setStep(1)}>
                  Edit Details
                </button>
                {breResult.passed && (
                  <button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all active:scale-95 flex-[2] shadow-lg shadow-slate-900/20" onClick={() => setStep(3)}>
                    Continue to Documents
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Income Verification</h2>
                <p className="text-slate-500 text-sm mt-1">Upload your latest salary slip for final sanctioning.</p>
              </div>

              {error && <div className="bg-red-50/50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

              <div
                className="group border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50/50 transition-all duration-300 relative overflow-hidden"
                onClick={() => fileRef.current?.click()}
              >
                <div className="absolute inset-0 bg-brand-500/5 scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-500" />
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
                
                <div className="relative z-10">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors duration-300 ${salarySlipFile ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600'}`}>
                    {salarySlipFile ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3 3H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    )}
                  </div>
                  
                  {salarySlipFile ? (
                    <>
                      <p className="text-emerald-700 font-bold text-lg">{salarySlipFile.name}</p>
                      <p className="text-slate-500 text-sm mt-1">{(salarySlipFile.size / 1024).toFixed(0)} KB • Click to replace</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-900 font-bold text-lg group-hover:text-brand-700 transition-colors">Browse files to upload</p>
                      <p className="text-slate-500 text-sm mt-1">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors active:scale-95 flex-1" onClick={() => setStep(2)}>
                  Back
                </button>
                <button 
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all active:scale-95 flex-[2] shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={handleUpload} 
                  disabled={!salarySlipFile || submitting}
                >
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {submitting ? 'Uploading...' : 'Secure Upload & Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Customize Loan</h2>
                <p className="text-slate-500 text-sm mt-1">Adjust the parameters to find a repayment plan that suits you.</p>
              </div>

              {error && <div className="bg-red-50/50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
              {success && <div className="bg-emerald-50/50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-semibold">{success}</div>}

              <div className="space-y-8 bg-slate-50/50 border border-slate-100 rounded-2xl p-6 md:p-8">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Disbursement Amount</label>
                      <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1">{formatINR(loanForm.amount)}</div>
                    </div>
                  </div>
                  <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-500/30" min={50000} max={500000} step={5000}
                    value={loanForm.amount}
                    onChange={(e) => setLoanForm({ ...loanForm, amount: Number(e.target.value) })} />
                  <div className="flex justify-between text-xs font-medium text-slate-400 mt-3">
                    <span>₹50,000</span><span>₹5,00,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Repayment Tenure</label>
                      <div className="text-3xl font-bold text-slate-900 tracking-tight mt-1">{loanForm.tenure} <span className="text-xl text-slate-500 font-medium tracking-normal">days</span></div>
                    </div>
                  </div>
                  <input type="range" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 focus:outline-none focus:ring-4 focus:ring-brand-500/30" min={30} max={365} step={1}
                    value={loanForm.tenure}
                    onChange={(e) => setLoanForm({ ...loanForm, tenure: Number(e.target.value) })} />
                  <div className="flex justify-between text-xs font-medium text-slate-400 mt-3">
                    <span>30 days</span><span>365 days</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-slate-900/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 mix-blend-screen" />
                
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">Repayment Schedule</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                  <div>
                    <p className="text-slate-400 text-xs mb-1 font-medium">Principal</p>
                    <p className="font-semibold text-lg">{formatINR(loanForm.amount)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1 font-medium">Interest Rate (Fixed)</p>
                    <p className="font-semibold text-lg">12.0% <span className="text-sm text-slate-500 font-normal">p.a.</span></p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1 font-medium">Interest Accrued</p>
                    <p className="font-semibold text-lg text-brand-300">+{formatINR(si)}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1 md:pl-4 md:border-l border-slate-700">
                    <p className="text-brand-300 text-xs mb-1 font-bold tracking-wider uppercase">Total Due</p>
                    <p className="font-bold text-2xl text-white">{formatINR(totalRepayment)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors active:scale-95 flex-1" onClick={() => setStep(3)}>
                  Back
                </button>
                <button 
                  className="bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all active:scale-95 flex-[2] shadow-lg shadow-brand-600/30 flex justify-center items-center gap-2 disabled:opacity-50" 
                  onClick={handleApply} 
                  disabled={submitting}
                >
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {submitting ? 'Processing Application...' : 'Sign & Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
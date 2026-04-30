'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import axios from 'axios';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      const dest = user.role === 'borrower' 
        ? '/apply' 
        : `/dashboard/${user.role === 'admin' ? 'sales' : user.role}`;
      
      router.replace(dest);
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Redirect handled by home page or here
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Login failed.');
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 to-slate-100">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white text-2xl font-bold mb-4 shadow-lg">
            L
          </div>
          <h1 className="text-3xl font-bold text-slate-900">LMS Portal</h1>
          <p className="text-slate-500 mt-1">Sign in to your account</p>
        </div>

        <div className="card shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            New borrower?{' '}
            <Link href="/register" className="text-brand-600 font-medium hover:underline">
              Create account
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 card bg-slate-50 border-slate-200 text-xs text-slate-500">
          <p className="font-semibold text-slate-600 mb-2">Demo credentials:</p>
          <div className="space-y-1 font-mono">
            <p><span className="text-brand-600">admin@lms.com</span> / Admin@123</p>
            <p><span className="text-brand-600">sanction@lms.com</span> / Sanction@123</p>
            <p><span className="text-brand-600">sales@lms.com</span> / Sales@123</p>
            <p><span className="text-brand-600">disbursement@lms.com</span> / Disburse@123</p>
            <p><span className="text-brand-600">collection@lms.com</span> / Collect@123</p>
            <p><span className="text-brand-600">borrower@lms.com</span> / Borrower@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
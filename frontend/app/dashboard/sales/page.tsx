'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

interface Lead {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  application?: {
    breStatus: string;
    fullName?: string;
    employmentMode?: string;
  };
}

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.getSalesLeads()
      .then((res) => setLeads(res.data.leads))
      .catch(() => setError('Failed to load leads.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sales — Lead Tracking</h1>
        <p className="text-slate-500 mt-1">Registered borrowers who have not yet applied for a loan.</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Loading leads…
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>}

      {!loading && !error && (
        <>
          <div className="mb-4">
            <span className="badge bg-blue-100 text-blue-700 text-sm">{leads.length} lead{leads.length !== 1 ? 's' : ''}</span>
          </div>

          {leads.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <p className="text-4xl mb-3">🎉</p>
              <p>All registered borrowers have active loan applications.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Name', 'Email', 'Registered On', 'BRE Status', 'Employment'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{lead.name}</td>
                      <td className="px-4 py-3 text-slate-500">{lead.email}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(lead.createdAt)}</td>
                      <td className="px-4 py-3">
                        {lead.application ? (
                          <span className={`badge badge-${lead.application.breStatus}`}>
                            {lead.application.breStatus}
                          </span>
                        ) : (
                          <span className="badge badge-pending">No details submitted</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 capitalize">
                        {lead.application?.employmentMode || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
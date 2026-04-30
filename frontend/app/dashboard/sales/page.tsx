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
    <div className="p-2 sm:p-6 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-slate-500 mt-2 font-medium">Track registered borrowers and their BRE status.</p>
        </div>
        {!loading && !error && (
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-2.5 shadow-sm text-sm font-medium flex items-center gap-3">
            <span className="text-slate-500">Total Leads:</span>
            <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-md font-bold">{leads.length}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-slate-500 font-medium p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Loading sales pipeline...
        </div>
      )}

      {error && (
        <div className="bg-red-50/50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm flex items-center gap-3 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {leads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 border-dashed p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">
                🎉
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Pipeline Clear</h3>
              <p className="text-slate-500 font-medium mt-2">All registered borrowers have active loan applications.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Lead Name</th>
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Contact Info</th>
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Registered On</th>
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs">BRE Status</th>
                      <th className="px-6 py-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Employment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{lead.name}</div>
                          {lead.application?.fullName && lead.application.fullName !== lead.name && (
                            <div className="text-xs text-slate-400 font-medium mt-0.5">AKA: {lead.application.fullName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600 font-medium">{lead.email}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          {lead.application ? (
                            <span className={`badge badge-${lead.application.breStatus.toLowerCase()}`}>
                              {lead.application.breStatus}
                            </span>
                          ) : (
                            <span className="badge badge-pending">Action Required</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {lead.application?.employmentMode ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/60 text-slate-600 text-xs font-semibold capitalize tracking-wide">
                              {lead.application.employmentMode}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
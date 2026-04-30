import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Application (Borrower)
export const applicationApi = {
  submitPersonalDetails: (data: {
    fullName: string;
    pan: string;
    dob: string;
    monthlySalary: number;
    employmentMode: string;
  }) => api.post('/application/personal-details', data),

  uploadSalarySlip: (file: File) => {
    const formData = new FormData();
    formData.append('salarySlip', file);
    return api.post('/application/upload-salary-slip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  applyForLoan: (data: { amount: number; tenure: number }) =>
    api.post('/application/apply', data),

  getStatus: () => api.get('/application/status'),
};

// Dashboard
export const dashboardApi = {
  // Sales
  getSalesLeads: () => api.get('/dashboard/sales'),

  // Sanction
  getSanctionQueue: () => api.get('/dashboard/sanction'),
  sanctionLoan: (loanId: string, data: { action: 'approve' | 'reject'; rejectionReason?: string }) =>
    api.put(`/dashboard/sanction/${loanId}`, data),

  // Disbursement
  getDisbursementQueue: () => api.get('/dashboard/disbursement'),
  disburseLoan: (loanId: string) => api.put(`/dashboard/disbursement/${loanId}`, {}),

  // Collection
  getCollectionQueue: () => api.get('/dashboard/collection'),
  recordPayment: (loanId: string, data: { utr: string; amount: number; date: string }) =>
    api.post(`/dashboard/collection/${loanId}/payment`, data),
};

export default api;
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Automatically inject JWT Token from local storage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  login: async (credentials: any) => {
    const res = await api.post('/api/auth/login', credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/api/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
  googleLogin: async (credential: string) => {
    const res = await api.post('/api/auth/google-login', { credential });
    return res.data;
  },
  sendOtp: async (email: string) => {
    const res = await api.post('/api/auth/send-otp', { email });
    return res.data;
  }
};

export const equipmentService = {
  getAll: async (startDate?: string, endDate?: string) => {
    const params = startDate && endDate ? { start_date: startDate, end_date: endDate } : {};
    const res = await api.get('/api/equipment', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get(`/api/equipment/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await api.post('/api/equipment', data);
    return res.data;
  },
  update: async (id: number, data: any) => {
    const res = await api.put(`/api/equipment/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/api/equipment/${id}`);
    return res.data;
  }
};

export const recommendationService = {
  getRecommendations: async (specs: {
    type: string;
    attendees: number;
    venue_size: string;
    budget: number | null;
    start_date: string;
    end_date: string;
    event_name?: string;
    special_requirements?: string;
  }) => {
    const res = await api.post('/api/recommendations', specs);
    return res.data;
  }
};

export const quoteService = {
  create: async (data: any) => {
    const res = await api.post('/api/quotes', data);
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/api/quotes');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get(`/api/quotes/${id}`);
    return res.data;
  },
  updateStatus: async (id: number, status: string) => {
    const res = await api.put(`/api/quotes/${id}/status`, { status });
    return res.data;
  },
  sendEmail: async (id: number, data: { pdfBase64: string; fileName: string }) => {
    const res = await api.post(`/api/quotes/${id}/send-email`, data);
    return res.data;
  }
};

export const bookingService = {
  create: async (quoteId: number) => {
    const res = await api.post('/api/bookings', { quote_id: quoteId });
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/api/bookings');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get(`/api/bookings/${id}`);
    return res.data;
  },
  updateStatus: async (id: number, status?: string, paymentStatus?: string) => {
    const res = await api.put(`/api/bookings/${id}`, { status, payment_status: paymentStatus });
    return res.data;
  }
};

export const analyticsService = {
  getRevenue: async () => {
    const res = await api.get('/api/analytics/revenue');
    return res.data;
  },
  getUtilization: async () => {
    const res = await api.get('/api/analytics/utilization');
    return res.data;
  }
};

export default api;

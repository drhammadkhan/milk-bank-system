import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Donor endpoints
export const donors = {
  create: (data: { donor_code: string }) => API.post('/donors', data),
  list: () => API.get('/donors'),
  get: (id: string) => API.get(`/donors/${id}`),
  update: (id: string, data: any) => API.put(`/donors/${id}`, data),
  approve: (id: string, data: { approver_id: string }) =>
    API.post(`/donors/${id}/approve`, data),
  getDonations: (id: string) => API.get(`/donors/${id}/donations`),
};

// Donation endpoints
export const donations = {
  create: (data: {
    donor_id: string;
    donation_date: string;
    number_of_bottles: number;
    notes?: string;
  }) => API.post('/donations', data),
  list: () => API.get('/donations'),
  listUnacknowledged: () => API.get('/donations/unacknowledged'),
  get: (id: string) => API.get(`/donations/${id}`),
  acknowledge: (id: string) => API.post(`/donations/${id}/acknowledge`, {}),
};

// Batch endpoints
export const batches = {
  create: (data: {
    donation_ids: string[];
    batch_code: string;
    user_id: string;
  }) => API.post('/batches', data),
  list: () => API.get('/batches'),
  get: (id: string) => API.get(`/batches/${id}`),
  startPasteurisation: (
    id: string,
    data: { operator_id: string; device_id: string }
  ) => API.post(`/batches/${id}/pasteurise/start`, data),
  completePasteurisation: (
    id: string,
    data: { operator_id: string; result_notes?: string }
  ) => API.post(`/batches/${id}/pasteurise/complete`, data),
  release: (
    id: string,
    data: { approver_id: string; approver2_id: string; notes?: string }
  ) => API.post(`/batches/${id}/release`, data),
};

// Sample/Microbiology endpoints
export const samples = {
  create: (batchId: string, data: { sample_code: string }) =>
    API.post(`/batches/${batchId}/samples`, data),
  postResult: (
    sampleId: string,
    data: {
      test_type: string;
      organism?: string;
      threshold_flag: boolean;
      notes?: string;
      posted_by: string;
    }
  ) => API.post(`/samples/${sampleId}/results`, data),
};

// Bottle endpoints
export const bottles = {
  list: () => API.get('/bottles'),
  get: (id: string) => API.get(`/bottles/${id}`),
  administer: (
    id: string,
    data: {
      baby_id: string;
      admin_user1: string;
      admin_user2: string;
      allocated_at?: string;
    }
  ) => API.post(`/bottles/${id}/administer`, data),
};

// Hospital endpoints
export const hospitals = {
  create: (data: {
    name: string;
    fhir_endpoint?: string;
    contact_info?: string;
  }) => API.post('/hospitals', data),
  list: () => API.get('/hospitals'),
  get: (id: string) => API.get(`/hospitals/${id}`),
};

// Dispatch endpoints
export const dispatches = {
  create: (data: {
    bottle_ids: string[];
    hospital_id: string;
    dispatch_code: string;
    created_by: string;
    shipper?: string;
  }) => API.post('/dispatches', data),
  list: () => API.get('/dispatches'),
  get: (id: string) => API.get(`/dispatches/${id}`),
  scan: (id: string, data: { barcode: string; user_id: string; scan_type: 'out' | 'in' }) =>
    API.post(`/dispatches/${id}/scan`, data),
  receive: (id: string, data: { receiver_id: string; notes?: string }) =>
    API.post(`/dispatches/${id}/receive`, data),
  fhirSend: (id: string, data: { user_id: string }) =>
    API.post(`/dispatches/${id}/fhir_send`, data),
  getManifest: (id: string) => API.get(`/dispatches/${id}/manifest/json`),
  exportCSV: (id: string) => API.get(`/dispatches/${id}/manifest/csv`),
  exportPDF: (id: string) => API.get(`/dispatches/${id}/manifest/pdf`, { responseType: 'blob' }),
};

export default API;

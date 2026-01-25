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
  revertApproval: (id: string) => API.post(`/donors/${id}/revert-approval`, {}),
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
  getById: (donationId: string) => API.get(`/donations/by-id/${donationId}`),
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
  getNextCode: (baseCode: string) => API.get(`/batches/next-code/${baseCode}`),
  getLabelsZpl: (id: string) => API.get(`/batches/${id}/labels/zpl`, { responseType: 'text' }),
  print: (id: string) => API.post(`/batches/${id}/print`),
  startPasteurisation: (
    id: string,
    data: { operator_id: string; device_id: string }
  ) => API.post(`/batches/${id}/pasteurise/start?operator_id=${data.operator_id}&device_id=${data.device_id}`),
  completePasteurisation: (
    id: string,
    data: { operator_id: string; record_id: string; result_notes?: string }
  ) => API.post(`/batches/${id}/pasteurise/complete`, data),
  release: (
    id: string,
    data: { approver_id: string; approver2_id: string; notes?: string }
  ) => API.post(`/batches/${id}/release`, data),
  createSample: (batchId: string, data: { sample_code: string }) =>
    API.post(`/batches/${batchId}/samples`, data),
  postSampleResult: (
    sampleId: string,
    data: {
      test_type: string;
      organism?: string;
      threshold_flag: boolean;
      notes?: string;
      posted_by: string;
    }
  ) => API.post(`/samples/${sampleId}/results`, data),
  processPostPasteurisation: (id: string) => 
    API.post(`/batches/${id}/process-post-pasteurisation`),
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
  allocate: (id: string, data: { patient_id: string; allocated_by: string }) =>
    API.post(`/bottles/${id}/allocate`, data),
  defrost: (id: string) => API.post(`/bottles/${id}/defrost`),
  administer: (id: string, data: { administered_by: string }) =>
    API.post(`/bottles/${id}/administer`, data),
  discard: (id: string, data: { reason: string }) =>
    API.post(`/bottles/${id}/discard`, data),
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

export const printers = {
  discover: () => API.get('/printers/discover'),
  configure: (data: { name: string; connection_type: string; address: string; port?: number; timeout?: number }) => 
    API.post('/printers/configure', data),
  getCurrent: () => API.get('/printers/current'),
  test: () => API.post('/printers/test'),
};

export default API;

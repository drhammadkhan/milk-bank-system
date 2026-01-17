import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { donors } from '../api';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const EditDonor: React.FC = () => {
  const { donorId } = useParams<{ donorId: string }>();
  const [formData, setFormData] = useState({
    hospital_number: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone_number: '',
    mobile_number: '',
    address: '',
    postcode: '',
    gp_name: '',
    gp_address: '',
    marital_status: '',
    number_of_children: 0,
    enrolment_date: '',
    previous_donor: false,
    partner_name: '',
    email: '',
    infectious_diseases: false,
    hepatitis_history: false,
    hepatitis_b_surface_antigen: false,
    hepatitis_b_core_antigen: false,
    hepatitis_c_antibody: false,
    hiv_antibody: false,
    hltv_antibody: false,
    syphilis_test: false,
    medical_history_notes: '',
    // Detailed Medical History
    hepatitis_jaundice_liver: false,
    hepatitis_jaundice_liver_details: '',
    hepatitis_jaundice_liver_date: '',
    history_of_tb: false,
    history_of_tb_date: '',
    polio_rubella_vaccination_4weeks: false,
    polio_rubella_vaccination_date: '',
    human_pituitary_growth_hormone: false,
    human_pituitary_growth_hormone_date: '',
    serious_illness_last_year: false,
    serious_illness_last_year_details: '',
    current_medications: '',
    // Lifestyle
    tattoo: false,
    tattoo_date: '',
    unusual_diet: '',
    smoker: false,
    alcohol_units_per_day: 0,
    // Serological Testing
    initial_blood_test_date: '',
    initial_hiv1_result: '',
    initial_hiv2_result: '',
    initial_htlv1_result: '',
    initial_htlv2_result: '',
    initial_hep_b_result: '',
    initial_hep_c_result: '',
    initial_syphilis_result: '',
    repeat_blood_test_date: '',
    repeat_hiv1_result: '',
    repeat_hiv2_result: '',
    repeat_htlv1_result: '',
    repeat_htlv2_result: '',
    repeat_hep_b_result: '',
    repeat_hep_c_result: '',
    repeat_syphilis_result: '',
    final_blood_test_status: '',
    // Baby details
    baby_name: '',
    baby_place_of_birth: '',
    baby_birth_weight_g: '',
    baby_gestational_age_weeks: '',
    baby_dob: '',
    baby_admitted_to_nicu: false,
    // Post-Testing Information
    one_off_donation: false,
    appointment_for_next_blood_test: false,
    appointment_blood_test_datetime: '',
    information_leaflets_given: false,
    leaflet_donating_milk: false,
    leaflet_blood_tests: false,
    leaflet_hygeine: false,
    // Checklist
    checklist_consent_form: false,
    checklist_donation_record_complete: false,
    checklist_given_bottles_labels: false,
    checklist_collection_explained: false,
    checklist_bloods_taken: false,
    // Comments
    comments: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDonor();
  }, [donorId]);

  const loadDonor = async () => {
    try {
      setInitialLoading(true);
      if (!donorId) return;
      const response = await donors.get(donorId);
      const donorData = response.data;
      setFormData({
        hospital_number: donorData.hospital_number || '',
        first_name: donorData.first_name || '',
        last_name: donorData.last_name || '',
        date_of_birth: donorData.date_of_birth ? donorData.date_of_birth.split('T')[0] : '',
        phone_number: donorData.phone_number || '',
        mobile_number: donorData.mobile_number || '',
        address: donorData.address || '',
        postcode: donorData.postcode || '',
        gp_name: donorData.gp_name || '',
        gp_address: donorData.gp_address || '',
        marital_status: donorData.marital_status || '',
        number_of_children: donorData.number_of_children || 0,
        enrolment_date: donorData.enrolment_date ? donorData.enrolment_date.split('T')[0] : '',
        previous_donor: donorData.previous_donor || false,
        partner_name: donorData.partner_name || '',
        email: donorData.email || '',
        infectious_diseases: donorData.infectious_diseases || false,
        hepatitis_history: donorData.hepatitis_history || false,
        hepatitis_b_surface_antigen: donorData.hepatitis_b_surface_antigen || false,
        hepatitis_b_core_antigen: donorData.hepatitis_b_core_antigen || false,
        hepatitis_c_antibody: donorData.hepatitis_c_antibody || false,
        hiv_antibody: donorData.hiv_antibody || false,
        hltv_antibody: donorData.hltv_antibody || false,
        syphilis_test: donorData.syphilis_test || false,
        medical_history_notes: donorData.medical_history_notes || '',
        hepatitis_jaundice_liver: donorData.hepatitis_jaundice_liver || false,
        hepatitis_jaundice_liver_details: donorData.hepatitis_jaundice_liver_details || '',
        hepatitis_jaundice_liver_date: donorData.hepatitis_jaundice_liver_date ? donorData.hepatitis_jaundice_liver_date.split('T')[0] : '',
        history_of_tb: donorData.history_of_tb || false,
        history_of_tb_date: donorData.history_of_tb_date ? donorData.history_of_tb_date.split('T')[0] : '',
        polio_rubella_vaccination_4weeks: donorData.polio_rubella_vaccination_4weeks || false,
        polio_rubella_vaccination_date: donorData.polio_rubella_vaccination_date ? donorData.polio_rubella_vaccination_date.split('T')[0] : '',
        human_pituitary_growth_hormone: donorData.human_pituitary_growth_hormone || false,
        human_pituitary_growth_hormone_date: donorData.human_pituitary_growth_hormone_date ? donorData.human_pituitary_growth_hormone_date.split('T')[0] : '',
        serious_illness_last_year: donorData.serious_illness_last_year || false,
        serious_illness_last_year_details: donorData.serious_illness_last_year_details || '',
        current_medications: donorData.current_medications || '',
        tattoo: donorData.tattoo || false,
        tattoo_date: donorData.tattoo_date ? donorData.tattoo_date.split('T')[0] : '',
        unusual_diet: donorData.unusual_diet || '',
        smoker: donorData.smoker || false,
        alcohol_units_per_day: donorData.alcohol_units_per_day || 0,
        initial_blood_test_date: donorData.initial_blood_test_date ? donorData.initial_blood_test_date.split('T')[0] : '',
        initial_hiv1_result: donorData.initial_hiv1_result || '',
        initial_hiv2_result: donorData.initial_hiv2_result || '',
        initial_htlv1_result: donorData.initial_htlv1_result || '',
        initial_htlv2_result: donorData.initial_htlv2_result || '',
        initial_hep_b_result: donorData.initial_hep_b_result || '',
        initial_hep_c_result: donorData.initial_hep_c_result || '',
        initial_syphilis_result: donorData.initial_syphilis_result || '',
        repeat_blood_test_date: donorData.repeat_blood_test_date ? donorData.repeat_blood_test_date.split('T')[0] : '',
        repeat_hiv1_result: donorData.repeat_hiv1_result || '',
        repeat_hiv2_result: donorData.repeat_hiv2_result || '',
        repeat_htlv1_result: donorData.repeat_htlv1_result || '',
        repeat_htlv2_result: donorData.repeat_htlv2_result || '',
        repeat_hep_b_result: donorData.repeat_hep_b_result || '',
        repeat_hep_c_result: donorData.repeat_hep_c_result || '',
        repeat_syphilis_result: donorData.repeat_syphilis_result || '',
        final_blood_test_status: donorData.final_blood_test_status || '',
        baby_name: donorData.baby_name || '',
        baby_place_of_birth: donorData.baby_place_of_birth || '',
        baby_birth_weight_g: donorData.baby_birth_weight_g || '',
        baby_gestational_age_weeks: donorData.baby_gestational_age_weeks || '',
        baby_dob: donorData.baby_dob ? donorData.baby_dob.split('T')[0] : '',
        baby_admitted_to_nicu: donorData.baby_admitted_to_nicu || false,
        // Post-Testing Information
        one_off_donation: donorData.one_off_donation || false,
        appointment_for_next_blood_test: donorData.appointment_for_next_blood_test || false,
        appointment_blood_test_datetime: donorData.appointment_blood_test_datetime ? donorData.appointment_blood_test_datetime.slice(0, 16) : '',
        information_leaflets_given: donorData.information_leaflets_given || false,
        leaflet_donating_milk: donorData.leaflet_donating_milk || false,
        leaflet_blood_tests: donorData.leaflet_blood_tests || false,
        leaflet_hygeine: donorData.leaflet_hygeine || false,
        // Checklist
        checklist_consent_form: donorData.checklist_consent_form || false,
        checklist_donation_record_complete: donorData.checklist_donation_record_complete || false,
        checklist_given_bottles_labels: donorData.checklist_given_bottles_labels || false,
        checklist_collection_explained: donorData.checklist_collection_explained || false,
        checklist_bloods_taken: donorData.checklist_bloods_taken || false,
        // Comments
        comments: donorData.comments || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load donor');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let finalValue: any;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      // For number fields, send null if empty, otherwise send the number
      finalValue = value === '' ? null : (parseInt(value) || 0);
    } else {
      // For text fields, keep empty strings as-is (API will treat as null)
      finalValue = value;
    }
    setFormData(prev => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      // Clean up empty strings to null for the API
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value === '') {
          acc[key] = null;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      await donors.update(donorId!, cleanedData);
      setSuccess(true);
      setTimeout(() => navigate('/donors'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update donor');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <div className="text-center text-gray-600">Loading donor details...</div>
      </div>
    );
  }

  // Reuse the NewDonor form component but for editing
  return (
    <div className="max-w-4xl mx-auto mt-6 mb-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Donor</h1>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700 text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg mb-6 p-6">
          <div className="flex gap-4">
            <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-1">Donor Updated Successfully!</h3>
              <p className="text-sm text-green-700">Redirecting to donors list in 2 seconds...</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-8">
        {/* Donor ID Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-xs text-blue-600 mb-1">Unique Donor ID</p>
          <p className="text-2xl font-mono font-bold text-blue-700">{donorId}</p>
        </div>

        {/* [Include all the form sections from NewDonor.tsx] */}
        {/* DONOR DETAILS SECTION */}
        <div className="border-b-2 border-blue-200 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-blue-900">Donor Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Number</label>
              <input type="text" name="hospital_number" value={formData.hospital_number} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forename</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Surname</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
              <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tel</label>
              <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
              <input type="tel" name="mobile_number" value={formData.mobile_number} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">GP Name</label>
              <input type="text" name="gp_name" value={formData.gp_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">GP Address</label>
              <textarea name="gp_address" value={formData.gp_address} onChange={handleChange} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
              <select name="marital_status" value={formData.marital_status} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select...</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Cohabiting">Cohabiting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partner's Name</label>
              <input type="text" name="partner_name" value={formData.partner_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Children</label>
              <input type="number" name="number_of_children" value={formData.number_of_children} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enrolment Date</label>
              <input type="date" name="enrolment_date" value={formData.enrolment_date} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 p-2">
                <input type="checkbox" name="previous_donor" checked={formData.previous_donor} onChange={handleChange} className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Previous Donor</span>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

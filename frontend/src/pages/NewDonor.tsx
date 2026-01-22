import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donors } from '../api';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const NewDonor: React.FC = () => {
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
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
    enrolment_date: today,
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
  const [createdDonorId, setCreatedDonorId] = useState('');
  const navigate = useNavigate();

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
      // Clean up empty strings to null for the API
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value === '') {
          acc[key] = null;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      const response = await donors.create(cleanedData);
      console.log('Donor created:', response.data);
      setCreatedDonorId(response.data.id);
      setTimeout(() => navigate('/donors'), 2000);
    } catch (err: any) {
      console.error('Create donor error:', err);
      setError(err.response?.data?.detail || 'Failed to create donor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 mb-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Register New Donor</h1>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-700 text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {createdDonorId && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg mb-6 p-6">
          <div className="flex gap-4">
            <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-3">Donor Created Successfully!</h3>
              <div className="bg-white rounded-lg p-4 mb-3 border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Unique Donor ID</p>
                <p className="text-2xl font-mono font-bold text-green-700 break-all">{createdDonorId}</p>
              </div>
              <p className="text-sm text-green-700">Redirecting to donors list in 2 seconds...</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-8">
        {/* Auto-generated ID Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-xs text-blue-600 mb-1">Unique Donor ID (auto-generated)</p>
          <p className="text-2xl font-mono font-bold text-blue-400">--- Will be generated after registration ---</p>
        </div>

        {/* DONOR DETAILS SECTION - AT THE TOP */}
        <div className="border-b-2 border-blue-200 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-blue-900">Donor Details</h2>
          <div className="grid grid-cols-3 gap-4">
            {/* Hospital Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Number</label>
              <input
                type="text"
                name="hospital_number"
                value={formData.hospital_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forename</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Surname</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Postcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
              <input
                type="text"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tel</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
              <input
                type="tel"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* GP Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">GP Name</label>
              <input
                type="text"
                name="gp_name"
                value={formData.gp_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* GP Address */}
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">GP Address</label>
              <textarea
                name="gp_address"
                value={formData.gp_address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
              <select
                name="marital_status"
                value={formData.marital_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Cohabiting">Cohabiting</option>
              </select>
            </div>

            {/* Partner's Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Partner's Name</label>
              <input
                type="text"
                name="partner_name"
                value={formData.partner_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Number of Children */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Children</label>
              <input
                type="number"
                name="number_of_children"
                value={formData.number_of_children}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Enrolment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Enrolment Date</label>
              <input
                type="date"
                name="enrolment_date"
                value={formData.enrolment_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Previous Donor Checkbox */}
            <div className="flex items-end">
              <label className="flex items-center gap-3 p-2">
                <input
                  type="checkbox"
                  name="previous_donor"
                  checked={formData.previous_donor}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Previous Donor</span>
              </label>
            </div>
          </div>

            {/* BABY DETAILS */}
            <div className="border-b-2 border-blue-200 pb-6 pt-8 mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-blue-900">Baby Details</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Baby Name</label>
                  <input
                    type="text"
                    name="baby_name"
                    value={formData.baby_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Place of Birth</label>
                  <input
                    type="text"
                    name="baby_place_of_birth"
                    value={formData.baby_place_of_birth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="baby_dob"
                    value={formData.baby_dob}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Birth Weight (g)</label>
                  <input
                    type="number"
                    name="baby_birth_weight_g"
                    value={formData.baby_birth_weight_g}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gestational Age (weeks)</label>
                  <input
                    type="number"
                    name="baby_gestational_age_weeks"
                    value={formData.baby_gestational_age_weeks}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-3 p-2">
                    <input
                      type="checkbox"
                      name="baby_admitted_to_nicu"
                      checked={formData.baby_admitted_to_nicu}
                      onChange={handleChange}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Admitted to NICU</span>
                  </label>
                </div>
              </div>
            </div>
        </div>

        {/* Medical History */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical History</h2>
          
          {/* Infectious Diseases */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="font-medium text-gray-800 mb-4 text-blue-700">Infectious Diseases</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-start gap-3 mb-2">
                  <input
                    type="checkbox"
                    name="hepatitis_jaundice_liver"
                    checked={formData.hepatitis_jaundice_liver}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                  />
                  <span className="text-sm text-gray-700">History of hepatitis, jaundice or liver problems?</span>
                </label>
                {formData.hepatitis_jaundice_liver && (
                  <div className="ml-7 space-y-2">
                    <input
                      type="text"
                      name="hepatitis_jaundice_liver_details"
                      value={formData.hepatitis_jaundice_liver_details}
                      onChange={handleChange}
                      placeholder="Details:"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="date"
                      name="hepatitis_jaundice_liver_date"
                      value={formData.hepatitis_jaundice_liver_date}
                      onChange={handleChange}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-start gap-3 mb-2">
                  <input
                    type="checkbox"
                    name="history_of_tb"
                    checked={formData.history_of_tb}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                  />
                  <span className="text-sm text-gray-700">History of TB?</span>
                </label>
                {formData.history_of_tb && (
                  <div className="ml-7">
                    <input
                      type="date"
                      name="history_of_tb_date"
                      value={formData.history_of_tb_date}
                      onChange={handleChange}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-start gap-3 mb-2">
                  <input
                    type="checkbox"
                    name="polio_rubella_vaccination_4weeks"
                    checked={formData.polio_rubella_vaccination_4weeks}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                  />
                  <span className="text-sm text-gray-700">Vaccinations for Polio or Rubella in last 4 weeks?</span>
                </label>
                {formData.polio_rubella_vaccination_4weeks && (
                  <div className="ml-7">
                    <input
                      type="date"
                      name="polio_rubella_vaccination_date"
                      value={formData.polio_rubella_vaccination_date}
                      onChange={handleChange}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-start gap-3 mb-2">
                  <input
                    type="checkbox"
                    name="human_pituitary_growth_hormone"
                    checked={formData.human_pituitary_growth_hormone}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                  />
                  <span className="text-sm text-gray-700">Received human pituitary growth hormone?</span>
                </label>
                {formData.human_pituitary_growth_hormone && (
                  <div className="ml-7 flex items-center gap-2">
                    <input
                      type="date"
                      name="human_pituitary_growth_hormone_date"
                      value={formData.human_pituitary_growth_hormone_date}
                      onChange={handleChange}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-xs text-gray-600">(only important if before 1995)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="font-medium text-gray-800 mb-4 text-blue-700">Medical Conditions</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-start gap-3 mb-2">
                  <input
                    type="checkbox"
                    name="serious_illness_last_year"
                    checked={formData.serious_illness_last_year}
                    onChange={handleChange}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                  />
                  <span className="text-sm text-gray-700">Any serious illness within the last year?</span>
                </label>
                {formData.serious_illness_last_year && (
                  <div className="ml-7">
                    <textarea
                      name="serious_illness_last_year_details"
                      value={formData.serious_illness_last_year_details}
                      onChange={handleChange}
                      placeholder="Details:"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current medications:</label>
                <textarea
                  name="current_medications"
                  value={formData.current_medications}
                  onChange={handleChange}
                  placeholder="List any current medications..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Legacy checkboxes (hidden, but still tracked for backward compatibility) */}
          <div className="hidden">
            <input type="checkbox" name="infectious_diseases" checked={formData.infectious_diseases} onChange={handleChange} />
            <input type="checkbox" name="hepatitis_history" checked={formData.hepatitis_history} onChange={handleChange} />
          </div>
        </div>

        {/* Lifestyle */}
        <div className="border-b-2 border-blue-200 pb-6 pt-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-blue-900">Lifestyle</h2>
          <div className="grid grid-cols-3 gap-4">
            {/* Tattoo */}
            <div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="tattoo"
                  checked={formData.tattoo}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                />
                <span className="text-sm font-medium text-gray-700">Tattoo</span>
              </label>
              {formData.tattoo && (
                <div className="ml-7 mt-2">
                  <input
                    type="date"
                    name="tattoo_date"
                    value={formData.tattoo_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Smoker */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="smoker"
                  checked={formData.smoker}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Smoker</span>
              </label>
            </div>

            {/* Units alcohol per day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Units alcohol/day:</label>
              <input
                type="number"
                name="alcohol_units_per_day"
                value={formData.alcohol_units_per_day}
                onChange={handleChange}
                min="0"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Unusual diet */}
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Unusual diet (eg vegan):</label>
              <input
                type="text"
                name="unusual_diet"
                value={formData.unusual_diet}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Serological Tests */}
        <div className="border-b-2 border-blue-200 pb-6 pt-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-blue-900">Serological Testing</h2>
          
          {/* Initial Blood Test */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Initial blood test</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                name="initial_blood_test_date"
                value={formData.initial_blood_test_date}
                onChange={handleChange}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-2 text-xs font-medium text-gray-700">Test Type</th>
                    <th className="text-left px-2 py-2 text-xs font-medium text-gray-700">Result</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {['hiv1', 'hiv2', 'htlv1', 'htlv2', 'hep_b', 'hep_c', 'syphilis'].map((test) => (
                    <tr key={test} className="border-b border-gray-200">
                      <td className="px-2 py-2 text-sm text-gray-700 capitalize">{test.replace(/_/g, ' ')}</td>
                      <td className="px-2 py-2">
                        <select
                          name={`initial_${test}_result`}
                          value={formData[`initial_${test}_result` as keyof typeof formData]}
                          onChange={handleChange}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">--</option>
                          <option value="Negative">Negative</option>
                          <option value="Positive">Positive</option>
                          <option value="Inconclusive">Inconclusive</option>
                          <option value="Not Tested">Not Tested</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Repeat Blood Test at 3m */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Repeat blood test at 3m:</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                name="repeat_blood_test_date"
                value={formData.repeat_blood_test_date}
                onChange={handleChange}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-2 text-xs font-medium text-gray-700">Test Type</th>
                    <th className="text-left px-2 py-2 text-xs font-medium text-gray-700">Result</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  {['hiv1', 'hiv2', 'htlv1', 'htlv2', 'hep_b', 'hep_c', 'syphilis'].map((test) => {
                    const testLabels: {[key: string]: string} = {
                      hiv1: 'HIV1',
                      hiv2: 'HIV2',
                      htlv1: 'HTLV1',
                      htlv2: 'HTLV2',
                      hep_b: 'Hep B',
                      hep_c: 'Hep C',
                      syphilis: 'Syphilis',
                    };
                    return (
                    <tr key={test} className="border-b border-gray-200">
                      <td className="px-2 py-2 text-sm text-gray-700">{testLabels[test]}</td>
                      <td className="px-2 py-2">
                        <select
                          name={`repeat_${test}_result`}
                          value={formData[`repeat_${test}_result` as keyof typeof formData]}
                          onChange={handleChange}
                          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">--</option>
                          <option value="Negative">Negative</option>
                          <option value="Positive">Positive</option>
                          <option value="Inconclusive">Inconclusive</option>
                          <option value="Not Tested">Not Tested</option>
                        </select>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Blood Test Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Final Blood Test Status:</label>
            <select
              name="final_blood_test_status"
              value={formData.final_blood_test_status}
              onChange={handleChange}
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select status...</option>
              <option value="Not Due">Not Due</option>
              <option value="Pending">Pending</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>
          </div>
        </div>

        {/* Post-Testing Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Post-Testing Information</h3>
          
          <div className="space-y-4">
            {/* One off donation */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="one_off_donation"
                checked={formData.one_off_donation}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">One off donation?</label>
            </div>

            {/* Appointment for next blood test */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="appointment_for_next_blood_test"
                  checked={formData.appointment_for_next_blood_test}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Appointment for next blood test</label>
              </div>
              {formData.appointment_for_next_blood_test && (
                <div className="ml-6">
                  <label className="block text-xs text-gray-600 mb-1">(date and time)</label>
                  <input
                    type="datetime-local"
                    name="appointment_blood_test_datetime"
                    value={formData.appointment_blood_test_datetime}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Information leaflets given */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="information_leaflets_given"
                  checked={formData.information_leaflets_given}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Information leaflets given</label>
              </div>
              {formData.information_leaflets_given && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      name="leaflet_donating_milk"
                      checked={formData.leaflet_donating_milk}
                      onChange={handleChange}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                    />
                    <label className="text-xs text-gray-600">- Donating milk - your questions answered</label>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      name="leaflet_blood_tests"
                      checked={formData.leaflet_blood_tests}
                      onChange={handleChange}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                    />
                    <label className="text-xs text-gray-600">Blood tests for milk donors</label>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      name="leaflet_hygeine"
                      checked={formData.leaflet_hygeine}
                      onChange={handleChange}
                      className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-0.5"
                    />
                    <label className="text-xs text-gray-600">- Hygeine leaflet</label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Medical History Notes</label>
          <textarea
            name="medical_history_notes"
            value={formData.medical_history_notes}
            onChange={handleChange}
            placeholder="Any additional medical history information..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Checklist */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Checklist</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="checklist_consent_form"
                checked={formData.checklist_consent_form}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Consent form</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="checklist_donation_record_complete"
                checked={formData.checklist_donation_record_complete}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Donation record complete (if milk donated at time of volunteering)</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="checklist_given_bottles_labels"
                checked={formData.checklist_given_bottles_labels}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Given bottles and labels</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="checklist_collection_explained"
                checked={formData.checklist_collection_explained}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Collection of milk explained</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="checklist_bloods_taken"
                checked={formData.checklist_bloods_taken}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm text-gray-700">Bloods taken and sent off for analysis</label>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            placeholder="Any additional comments..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {loading ? 'Creating...' : 'Register Donor'}
        </button>
      </form>
    </div>
  );
};

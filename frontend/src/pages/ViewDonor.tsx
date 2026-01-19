import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { donors, donations } from '../api';
import { AlertCircle, ArrowLeft, Plus } from 'lucide-react';

const formatDate = (value?: string) => {
  if (!value) return '-';
  if (value.length >= 10) return value.slice(0, 10);
  return value;
};

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-gray-900 font-medium break-words min-h-[20px]">{value ?? '-'}
    </p>
  </div>
);

const BoolChip: React.FC<{ label: string; value?: boolean }> = ({ label, value }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
    {label}
  </span>
);

export const ViewDonor: React.FC = () => {
  const { donorId } = useParams<{ donorId: string }>();
  const [donor, setDonor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [donorDonations, setDonorDonations] = useState<any[]>([]);
  const [showAddDonation, setShowAddDonation] = useState(false);
  const [newDonation, setNewDonation] = useState({ donation_date: '', number_of_bottles: 1, notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadDonations = async () => {
    try {
      const res = await donors.getDonations(donorId!);
      setDonorDonations(res.data);
    } catch (err) {
      console.error('Failed to load donations:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await donors.get(donorId!);
        setDonor(res.data);
        await loadDonations();
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to load donor');
      } finally {
        setLoading(false);
      }
    };
    if (donorId) load();
  }, [donorId]);

  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonation.donation_date || newDonation.number_of_bottles < 1) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      await donations.create({
        donor_id: donorId!,
        donation_date: newDonation.donation_date,
        number_of_bottles: newDonation.number_of_bottles,
        notes: newDonation.notes || undefined,
      });
      setNewDonation({ donation_date: '', number_of_bottles: 1, notes: '' });
      setShowAddDonation(false);
      await loadDonations();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to add donation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto mt-6">
        <p className="text-center text-gray-600">Loading donor...</p>
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="max-w-5xl mx-auto mt-6">
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={20} className="flex-shrink-0" />
          {error || 'Donor not found'}
        </div>
        <Link to="/donors" className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-800">
          <ArrowLeft size={16} /> Back to donors
        </Link>
      </div>
    );
  }

  const sectionCard = (title: string, children: React.ReactNode) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );

  const renderSerologyTable = (prefix: 'initial' | 'repeat', title: string) => {
    const dateField = prefix === 'initial' ? donor.initial_blood_test_date : donor.repeat_blood_test_date;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
          <div className="text-sm text-gray-700">Date: {formatDate(dateField)}</div>
        </div>
        <table className="w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 border-b border-gray-200">Test</th>
              <th className="text-left px-3 py-2 border-b border-gray-200">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[{ key: `${prefix}_hiv1_result`, label: 'HIV1' },
              { key: `${prefix}_hiv2_result`, label: 'HIV2' },
              { key: `${prefix}_htlv1_result`, label: 'HTLV1' },
              { key: `${prefix}_htlv2_result`, label: 'HTLV2' },
              { key: `${prefix}_hep_b_result`, label: 'Hep B' },
              { key: `${prefix}_hep_c_result`, label: 'Hep C' },
              { key: `${prefix}_syphilis_result`, label: 'Syphilis' },
            ].map(row => (
              <tr key={row.key}>
                <td className="px-3 py-2">{row.label}</td>
                <td className="px-3 py-2 text-gray-800">{donor[row.key] ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 mb-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Donor Details</h1>
          <p className="text-xs text-blue-600">Unique Donor ID</p>
          <p className="text-2xl font-mono font-bold text-blue-700">{donor.id}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/donors/${donor.id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit</Link>
          <Link to="/donors" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"><ArrowLeft size={16} />Back</Link>
        </div>
      </div>

      {sectionCard('Donor Details', (
        <div className="grid grid-cols-3 gap-4">
          <Field label="Hospital Number" value={donor.hospital_number || '-'} />
          <Field label="Forename" value={donor.first_name || '-'} />
          <Field label="Surname" value={donor.last_name || '-'} />
          <Field label="Date of Birth" value={formatDate(donor.date_of_birth)} />
          <Field label="Address" value={donor.address || '-'} />
          <Field label="Postcode" value={donor.postcode || '-'} />
          <Field label="Tel" value={donor.phone_number || '-'} />
          <Field label="Mobile" value={donor.mobile_number || '-'} />
          <Field label="Email" value={donor.email || '-'} />
          <Field label="GP Name" value={donor.gp_name || '-'} />
          <Field label="GP Address" value={donor.gp_address || '-'} />
          <Field label="Marital Status" value={donor.marital_status || '-'} />
          <Field label="Partner's Name" value={donor.partner_name || '-'} />
          <Field label="Number of Children" value={donor.number_of_children ?? '-'} />
          <Field label="Enrolment Date" value={formatDate(donor.enrolment_date)} />
          <Field label="Previous Donor" value={<BoolChip label={donor.previous_donor ? 'Yes' : 'No'} value={donor.previous_donor} />} />
        </div>
      ))}

      {sectionCard('Baby Details', (
        <div className="grid grid-cols-3 gap-4">
          <Field label="Baby Name" value={donor.baby_name || '-'} />
          <Field label="Place of Birth" value={donor.baby_place_of_birth || '-'} />
          <Field label="Birth Weight (g)" value={donor.baby_birth_weight_g ?? '-'} />
          <Field label="Gestational Age (weeks)" value={donor.baby_gestational_age_weeks ?? '-'} />
          <Field label="Baby DOB" value={formatDate(donor.baby_dob)} />
          <Field label="Admitted to NICU" value={<BoolChip label={donor.baby_admitted_to_nicu ? 'Yes' : 'No'} value={donor.baby_admitted_to_nicu} />} />
        </div>
      ))}

      {sectionCard('Medical History', (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <BoolChip label="Infectious Diseases" value={donor.infectious_diseases} />
            <BoolChip label="Hepatitis History" value={donor.hepatitis_history} />
            <BoolChip label="Hep B Surface Antigen" value={donor.hepatitis_b_surface_antigen} />
            <BoolChip label="Hep B Core Antigen" value={donor.hepatitis_b_core_antigen} />
            <BoolChip label="Hep C Antibody" value={donor.hepatitis_c_antibody} />
            <BoolChip label="HIV Antibody" value={donor.hiv_antibody} />
            <BoolChip label="HLTV Antibody" value={donor.hltv_antibody} />
            <BoolChip label="Syphilis Test" value={donor.syphilis_test} />
          </div>

          <div className="space-y-3">
            <Field label="Hepatitis/Jaundice/Liver Details" value={donor.hepatitis_jaundice_liver_details || '-'} />
            <Field label="Hepatitis/Jaundice/Liver Date" value={formatDate(donor.hepatitis_jaundice_liver_date)} />
            <Field label="History of TB" value={<BoolChip label={donor.history_of_tb ? 'Yes' : 'No'} value={donor.history_of_tb} />} />
            <Field label="TB Date" value={formatDate(donor.history_of_tb_date)} />
            <Field label="Polio/Rubella Vaccination 4 weeks" value={<BoolChip label={donor.polio_rubella_vaccination_4weeks ? 'Yes' : 'No'} value={donor.polio_rubella_vaccination_4weeks} />} />
            <Field label="Polio/Rubella Vaccination Date" value={formatDate(donor.polio_rubella_vaccination_date)} />
            <Field label="Human Pituitary Growth Hormone" value={<BoolChip label={donor.human_pituitary_growth_hormone ? 'Yes' : 'No'} value={donor.human_pituitary_growth_hormone} />} />
            <Field label="Growth Hormone Date" value={formatDate(donor.human_pituitary_growth_hormone_date)} />
            <Field label="Serious Illness Last Year" value={<BoolChip label={donor.serious_illness_last_year ? 'Yes' : 'No'} value={donor.serious_illness_last_year} />} />
            <Field label="Serious Illness Details" value={donor.serious_illness_last_year_details || '-'} />
            <Field label="Current Medications" value={donor.current_medications || '-'} />
          </div>
        </div>
      ))}

      {sectionCard('Lifestyle', (
        <div className="space-y-3">
          <Field label="Tattoo" value={<BoolChip label={donor.tattoo ? 'Yes' : 'No'} value={donor.tattoo} />} />
          <Field label="Tattoo Date" value={formatDate(donor.tattoo_date)} />
          <Field label="Unusual Diet" value={donor.unusual_diet || '-'} />
          <Field label="Smoker" value={<BoolChip label={donor.smoker ? 'Yes' : 'No'} value={donor.smoker} />} />
          <Field label="Alcohol Units Per Day" value={donor.alcohol_units_per_day ?? '-'} />
        </div>
      ))}

      {sectionCard('Serological Testing', (
        <div className="space-y-8">
          {renderSerologyTable('initial', 'Initial Blood Test')}
          {renderSerologyTable('repeat', 'Repeat Blood Test')}
          <div>
            <Field label="Final Blood Test Status" value={donor.final_blood_test_status || '-'} />
          </div>
        </div>
      ))}

      {sectionCard('Post-Testing Information', (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <BoolChip label="One off donation" value={donor.one_off_donation} />
            <BoolChip label="Appointment for next blood test" value={donor.appointment_for_next_blood_test} />
            <Field label="Appointment date/time" value={donor.appointment_blood_test_datetime ? donor.appointment_blood_test_datetime.replace('T', ' ').slice(0, 16) : '-'} />
          </div>
          <div className="flex flex-wrap gap-2">
            <BoolChip label="Information leaflets given" value={donor.information_leaflets_given} />
            <BoolChip label="Leaflet: Donating milk" value={donor.leaflet_donating_milk} />
            <BoolChip label="Leaflet: Blood tests" value={donor.leaflet_blood_tests} />
            <BoolChip label="Leaflet: Hygeine" value={donor.leaflet_hygeine} />
          </div>
        </div>
      ))}

      {sectionCard('Checklist', (
        <div className="flex flex-wrap gap-2">
          <BoolChip label="Consent form" value={donor.checklist_consent_form} />
          <BoolChip label="Donation record complete" value={donor.checklist_donation_record_complete} />
          <BoolChip label="Given bottles and labels" value={donor.checklist_given_bottles_labels} />
          <BoolChip label="Collection explained" value={donor.checklist_collection_explained} />
          <BoolChip label="Bloods taken and sent" value={donor.checklist_bloods_taken} />
        </div>
      ))}

      {sectionCard('Comments', (
        <Field label="Comments" value={donor.comments || '-'} />
      ))}

      {sectionCard('Medical History Notes', (
        <Field label="Notes" value={donor.medical_history_notes || '-'} />
      ))}

      {sectionCard('Donation History', (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total donations: <span className="font-semibold">{donorDonations.length}</span></p>
            <button
              onClick={() => setShowAddDonation(!showAddDonation)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              <Plus size={16} />
              {showAddDonation ? 'Cancel' : 'Add Donation'}
            </button>
          </div>

          {showAddDonation && (
            <form onSubmit={handleAddDonation} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900">Record New Donation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Donation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDonation.donation_date}
                    onChange={(e) => setNewDonation({ ...newDonation, donation_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Bottles <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newDonation.number_of_bottles}
                    onChange={(e) => setNewDonation({ ...newDonation, number_of_bottles: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={newDonation.notes}
                    onChange={(e) => setNewDonation({ ...newDonation, notes: e.target.value })}
                    placeholder="Optional notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Donation'}
              </button>
            </form>
          )}

          {donorDonations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No donations recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Donation ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Bottles</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Notes</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {donorDonations.map((donation: any) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-blue-600 font-mono text-xs font-semibold">{donation.donation_id || '-'}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{formatDate(donation.donation_date)}</td>
                      <td className="px-4 py-3 text-gray-900">{donation.number_of_bottles}</td>
                      <td className="px-4 py-3 text-gray-600">{donation.notes || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(donation.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

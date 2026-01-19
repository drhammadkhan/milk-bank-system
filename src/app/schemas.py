from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Union
from datetime import datetime


def parse_datetime(value: Union[str, datetime, None]) -> Optional[datetime]:
    """Convert string dates to datetime objects"""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        if not value or value.strip() == '':
            return None
        # Handle ISO format dates and datetimes
        try:
            # Try parsing as datetime first
            return datetime.fromisoformat(value)
        except (ValueError, TypeError):
            try:
                # Try parsing as date only
                return datetime.strptime(value[:10], '%Y-%m-%d')
            except (ValueError, TypeError):
                return None
    return None


class DonorCreate(BaseModel):
    # Donor Details Section
    hospital_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[Union[str, datetime]] = None
    phone_number: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    postcode: Optional[str] = None
    gp_name: Optional[str] = None
    gp_address: Optional[str] = None
    marital_status: Optional[str] = None
    number_of_children: Optional[int] = 0
    enrolment_date: Optional[Union[str, datetime]] = None

    @field_validator(
        'date_of_birth',
        'enrolment_date',
        'baby_dob',
        'tattoo_date',
        'hepatitis_jaundice_liver_date',
        'history_of_tb_date',
        'polio_rubella_vaccination_date',
        'human_pituitary_growth_hormone_date',
        'initial_blood_test_date',
        'repeat_blood_test_date',
        'appointment_blood_test_datetime',
        mode='before'
    )
    @classmethod
    def validate_dates(cls, v):
        return parse_datetime(v)
    previous_donor: Optional[bool] = False
    partner_name: Optional[str] = None
    email: Optional[str] = None
    # Baby Details
    baby_name: Optional[str] = None
    baby_place_of_birth: Optional[str] = None
    baby_birth_weight_g: Optional[int] = None
    baby_gestational_age_weeks: Optional[int] = None
    baby_dob: Optional[Union[str, datetime]] = None
    baby_admitted_to_nicu: Optional[bool] = False
    # Lifestyle
    tattoo: Optional[bool] = False
    tattoo_date: Optional[Union[str, datetime]] = None
    unusual_diet: Optional[str] = None
    smoker: Optional[bool] = False
    alcohol_units_per_day: Optional[int] = None
    # Serological Testing
    initial_blood_test_date: Optional[Union[str, datetime]] = None
    initial_hiv1_result: Optional[str] = None
    initial_hiv2_result: Optional[str] = None
    initial_htlv1_result: Optional[str] = None
    initial_htlv2_result: Optional[str] = None
    initial_hep_b_result: Optional[str] = None
    initial_hep_c_result: Optional[str] = None
    initial_syphilis_result: Optional[str] = None
    repeat_blood_test_date: Optional[Union[str, datetime]] = None
    repeat_hiv1_result: Optional[str] = None
    repeat_hiv2_result: Optional[str] = None
    repeat_htlv1_result: Optional[str] = None
    repeat_htlv2_result: Optional[str] = None
    repeat_hep_b_result: Optional[str] = None
    repeat_hep_c_result: Optional[str] = None
    repeat_syphilis_result: Optional[str] = None
    final_blood_test_status: Optional[str] = None
    # Medical History
    infectious_diseases: Optional[bool] = False
    hepatitis_history: Optional[bool] = False
    hepatitis_b_surface_antigen: Optional[bool] = False
    hepatitis_b_core_antigen: Optional[bool] = False
    hepatitis_c_antibody: Optional[bool] = False
    hiv_antibody: Optional[bool] = False
    hltv_antibody: Optional[bool] = False
    syphilis_test: Optional[bool] = False
    medical_history_notes: Optional[str] = None
    # Detailed Medical History
    hepatitis_jaundice_liver: Optional[bool] = False
    hepatitis_jaundice_liver_details: Optional[str] = None
    hepatitis_jaundice_liver_date: Optional[Union[str, datetime]] = None
    history_of_tb: Optional[bool] = False
    history_of_tb_date: Optional[Union[str, datetime]] = None
    polio_rubella_vaccination_4weeks: Optional[bool] = False
    polio_rubella_vaccination_date: Optional[Union[str, datetime]] = None
    human_pituitary_growth_hormone: Optional[bool] = False
    human_pituitary_growth_hormone_date: Optional[Union[str, datetime]] = None
    serious_illness_last_year: Optional[bool] = False
    serious_illness_last_year_details: Optional[str] = None
    current_medications: Optional[str] = None
    # Post-Testing Information
    one_off_donation: Optional[bool] = False
    appointment_for_next_blood_test: Optional[bool] = False
    appointment_blood_test_datetime: Optional[Union[str, datetime]] = None
    information_leaflets_given: Optional[bool] = False
    leaflet_donating_milk: Optional[bool] = False
    leaflet_blood_tests: Optional[bool] = False
    leaflet_hygeine: Optional[bool] = False
    # Checklist
    checklist_consent_form: Optional[bool] = False
    checklist_donation_record_complete: Optional[bool] = False
    checklist_given_bottles_labels: Optional[bool] = False
    checklist_collection_explained: Optional[bool] = False
    checklist_bloods_taken: Optional[bool] = False
    # Comments
    comments: Optional[str] = None


class DonorRead(BaseModel):
    id: str
    donor_code: Optional[str]
    status: str
    created_at: Optional[datetime]
    # Donor Details Section
    hospital_number: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    date_of_birth: Optional[Union[str, datetime]]
    phone_number: Optional[str]
    mobile_number: Optional[str]
    address: Optional[str]
    postcode: Optional[str]
    gp_name: Optional[str]
    gp_address: Optional[str]
    marital_status: Optional[str]
    number_of_children: Optional[int]
    enrolment_date: Optional[Union[str, datetime]]
    previous_donor: Optional[bool]
    partner_name: Optional[str]
    email: Optional[str]
    # Baby Details
    baby_name: Optional[str]
    baby_place_of_birth: Optional[str]
    baby_birth_weight_g: Optional[int]
    baby_gestational_age_weeks: Optional[int]
    baby_dob: Optional[Union[str, datetime]]
    baby_admitted_to_nicu: Optional[bool]
    # Medical History
    infectious_diseases: Optional[bool]
    hepatitis_history: Optional[bool]
    hepatitis_b_surface_antigen: Optional[bool]
    hepatitis_b_core_antigen: Optional[bool]
    hepatitis_c_antibody: Optional[bool]
    hiv_antibody: Optional[bool]
    hltv_antibody: Optional[bool]
    syphilis_test: Optional[bool]
    medical_history_notes: Optional[str]
    # Detailed Medical History
    hepatitis_jaundice_liver: Optional[bool]
    hepatitis_jaundice_liver_details: Optional[str]
    hepatitis_jaundice_liver_date: Optional[Union[str, datetime]]
    history_of_tb: Optional[bool]
    history_of_tb_date: Optional[Union[str, datetime]]
    polio_rubella_vaccination_4weeks: Optional[bool]
    polio_rubella_vaccination_date: Optional[Union[str, datetime]]
    human_pituitary_growth_hormone: Optional[bool]
    human_pituitary_growth_hormone_date: Optional[Union[str, datetime]]
    serious_illness_last_year: Optional[bool]
    serious_illness_last_year_details: Optional[str]
    current_medications: Optional[str]
    # Lifestyle
    tattoo: Optional[bool]
    tattoo_date: Optional[Union[str, datetime]]
    unusual_diet: Optional[str]
    smoker: Optional[bool]
    alcohol_units_per_day: Optional[int]
    # Serological Testing
    initial_blood_test_date: Optional[Union[str, datetime]]
    initial_hiv1_result: Optional[str]
    initial_hiv2_result: Optional[str]
    initial_htlv1_result: Optional[str]
    initial_htlv2_result: Optional[str]
    initial_hep_b_result: Optional[str]
    initial_hep_c_result: Optional[str]
    initial_syphilis_result: Optional[str]
    repeat_blood_test_date: Optional[Union[str, datetime]]
    repeat_hiv1_result: Optional[str]
    repeat_hiv2_result: Optional[str]
    repeat_htlv1_result: Optional[str]
    repeat_htlv2_result: Optional[str]
    repeat_hep_b_result: Optional[str]
    repeat_hep_c_result: Optional[str]
    repeat_syphilis_result: Optional[str]
    final_blood_test_status: Optional[str]
    # Post-Testing Information
    one_off_donation: Optional[bool]
    appointment_for_next_blood_test: Optional[bool]
    appointment_blood_test_datetime: Optional[Union[str, datetime]]
    information_leaflets_given: Optional[bool]
    leaflet_donating_milk: Optional[bool]
    leaflet_blood_tests: Optional[bool]
    leaflet_hygeine: Optional[bool]
    # Checklist
    checklist_consent_form: Optional[bool]
    checklist_donation_record_complete: Optional[bool]
    checklist_given_bottles_labels: Optional[bool]
    checklist_collection_explained: Optional[bool]
    checklist_bloods_taken: Optional[bool]
    # Comments
    comments: Optional[str]

    class Config:
        from_attributes = True


class DonationCreate(BaseModel):
    barcode: str
    donor_id: str
    volume_ml: float


class DonationRead(BaseModel):
    id: str
    barcode: str
    donor_id: str
    volume_ml: float
    status: str

    class Config:
        from_attributes = True


class HospitalCreate(BaseModel):
    name: str
    fhir_endpoint: Optional[str] = None
    contact_info: Optional[dict] = None


class HospitalRead(BaseModel):
    id: str
    name: str
    fhir_endpoint: Optional[str]

    class Config:
        from_attributes = True


class DispatchCreate(BaseModel):
    bottle_ids: List[str]
    hospital_id: str
    dispatch_code: str
    created_by: Optional[str]
    shipper: Optional[str]


class DispatchRead(BaseModel):
    id: str
    dispatch_code: str
    hospital_id: str
    status: str

    class Config:
        from_attributes = True


class DispatchScan(BaseModel):
    barcode: str
    user_id: Optional[str]
    scan_type: Optional[str] = "out"


class DonationCreate(BaseModel):
    donor_id: str
    donation_date: Union[str, datetime]
    number_of_bottles: int
    notes: Optional[str] = None

    @field_validator('donation_date', mode='before')
    @classmethod
    def validate_donation_date(cls, v):
        return parse_datetime(v)


class DonationRead(BaseModel):
    id: str
    donation_id: Optional[str]
    donor_id: str
    donation_date: datetime
    number_of_bottles: int
    notes: Optional[str]
    acknowledged: bool
    acknowledged_by: Optional[str]
    acknowledged_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class BatchCreate(BaseModel):
    batch_code: str
    donation_ids: List[str]
    batch_date: Optional[Union[str, datetime]] = None
    hospital_number: Optional[str] = None
    number_of_bottles: Optional[int] = None
    
    @field_validator('batch_date', mode='before')
    @classmethod
    def parse_batch_date(cls, value):
        return parse_datetime(value)

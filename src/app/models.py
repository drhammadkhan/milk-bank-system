import enum
import uuid
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Float, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class DonorStatus(enum.Enum):
    Applied = "Applied"
    Screening = "Screening"
    Approved = "Approved"
    Active = "Active"
    Suspended = "Suspended"
    Excluded = "Excluded"
    Closed = "Closed"


class Donor(Base):
    __tablename__ = "donors"
    id = Column(String, primary_key=True, default=gen_uuid)
    donor_code = Column(String, unique=True, index=True, nullable=True)  # Optional legacy field
    status = Column(Enum(DonorStatus), nullable=False, default=DonorStatus.Applied)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Donor Details Section
    hospital_number = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    date_of_birth = Column(DateTime(timezone=True))
    phone_number = Column(String)
    mobile_number = Column(String)
    
    # Address Information
    address = Column(String)
    postcode = Column(String)
    
    # GP Information
    gp_name = Column(String)
    gp_address = Column(String)
    
    # Additional Donor Information
    marital_status = Column(String)  # Single, Married, etc.
    number_of_children = Column(Integer, default=0)
    enrolment_date = Column(DateTime(timezone=True))
    previous_donor = Column(Boolean, default=False)
    partner_name = Column(String)
    email = Column(String)
    
    # Medical History Flags (boolean indicators)
    infectious_diseases = Column(Boolean, default=False)
    hepatitis_history = Column(Boolean, default=False)
    hepatitis_b_surface_antigen = Column(Boolean, default=False)
    hepatitis_b_core_antigen = Column(Boolean, default=False)
    hepatitis_c_antibody = Column(Boolean, default=False)
    hiv_antibody = Column(Boolean, default=False)
    hltv_antibody = Column(Boolean, default=False)
    syphilis_test = Column(Boolean, default=False)
    
    # Detailed Medical History
    hepatitis_jaundice_liver = Column(Boolean, default=False)
    hepatitis_jaundice_liver_details = Column(String, nullable=True)
    hepatitis_jaundice_liver_date = Column(DateTime(timezone=True), nullable=True)
    history_of_tb = Column(Boolean, default=False)
    history_of_tb_date = Column(DateTime(timezone=True), nullable=True)
    polio_rubella_vaccination_4weeks = Column(Boolean, default=False)
    polio_rubella_vaccination_date = Column(DateTime(timezone=True), nullable=True)
    human_pituitary_growth_hormone = Column(Boolean, default=False)
    human_pituitary_growth_hormone_date = Column(DateTime(timezone=True), nullable=True)
    serious_illness_last_year = Column(Boolean, default=False)
    serious_illness_last_year_details = Column(String, nullable=True)
    current_medications = Column(String, nullable=True)
    
    # Serological Test Results (JSON for flexibility)
    serological_tests = Column(JSON, default={})
    medical_history_notes = Column(String)

    # Baby Details (optional)
    baby_name = Column(String, nullable=True)
    baby_place_of_birth = Column(String, nullable=True)
    baby_birth_weight_g = Column(Integer, nullable=True)
    baby_gestational_age_weeks = Column(Integer, nullable=True)
    baby_dob = Column(DateTime(timezone=True), nullable=True)
    baby_admitted_to_nicu = Column(Boolean, default=False)

    # Lifestyle
    tattoo = Column(Boolean, default=False)
    tattoo_date = Column(DateTime(timezone=True), nullable=True)
    unusual_diet = Column(String, nullable=True)
    smoker = Column(Boolean, default=False)
    alcohol_units_per_day = Column(Integer, nullable=True)

    # Serological Testing
    initial_blood_test_date = Column(DateTime(timezone=True), nullable=True)
    initial_hiv1_result = Column(String, nullable=True)
    initial_hiv2_result = Column(String, nullable=True)
    initial_htlv1_result = Column(String, nullable=True)
    initial_htlv2_result = Column(String, nullable=True)
    initial_hep_b_result = Column(String, nullable=True)
    initial_hep_c_result = Column(String, nullable=True)
    initial_syphilis_result = Column(String, nullable=True)
    
    repeat_blood_test_date = Column(DateTime(timezone=True), nullable=True)
    repeat_hiv1_result = Column(String, nullable=True)
    repeat_hiv2_result = Column(String, nullable=True)
    repeat_htlv1_result = Column(String, nullable=True)
    repeat_htlv2_result = Column(String, nullable=True)
    repeat_hep_b_result = Column(String, nullable=True)
    repeat_hep_c_result = Column(String, nullable=True)
    repeat_syphilis_result = Column(String, nullable=True)
    
    final_blood_test_status = Column(String, nullable=True)

    # Post-Testing Information
    one_off_donation = Column(Boolean, default=False)
    appointment_for_next_blood_test = Column(Boolean, default=False)
    appointment_blood_test_datetime = Column(DateTime(timezone=True), nullable=True)
    information_leaflets_given = Column(Boolean, default=False)
    leaflet_donating_milk = Column(Boolean, default=False)
    leaflet_blood_tests = Column(Boolean, default=False)
    leaflet_hygeine = Column(Boolean, default=False)

    # Checklist
    checklist_consent_form = Column(Boolean, default=False)
    checklist_donation_record_complete = Column(Boolean, default=False)
    checklist_given_bottles_labels = Column(Boolean, default=False)
    checklist_collection_explained = Column(Boolean, default=False)
    checklist_bloods_taken = Column(Boolean, default=False)

    # Comments
    comments = Column(String, nullable=True)


class DonationStatus(enum.Enum):
    Collected = "Collected"
    IntakeQuarantine = "IntakeQuarantine"
    Accepted = "Accepted"
    Rejected = "Rejected"
    Pooled = "Pooled"
    AssignedToBatch = "AssignedToBatch"
    Processed = "Processed"
    Disposed = "Disposed"


class BatchStatus(enum.Enum):
    Created = "Created"
    Pasteurising = "Pasteurising"
    Pasteurised = "Pasteurised"
    MicroTestPending = "MicroTestPending"
    TestingFailed = "TestingFailed"
    Tested = "Tested"
    Released = "Released"
    Quarantined = "Quarantined"
    Recalled = "Recalled"
    Disposed = "Disposed"


class Batch(Base):
    __tablename__ = "batches"
    id = Column(String, primary_key=True, default=gen_uuid)
    batch_code = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(BatchStatus), nullable=False, default=BatchStatus.Created)
    total_volume_ml = Column(Float, default=0.0)
    batch_date = Column(DateTime(timezone=True), nullable=True)
    hospital_number = Column(String, nullable=True)
    number_of_bottles = Column(Integer, nullable=True)
    donation_ids = Column(JSON, nullable=True)  # Store donation IDs as JSON array


class Bottle(Base):
    __tablename__ = "bottles"
    id = Column(String, primary_key=True, default=gen_uuid)
    barcode = Column(String, unique=True, index=True, nullable=False)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False)
    volume_ml = Column(Float, nullable=False)
    label_print_id = Column(String)
    storage_location_id = Column(String)
    expiry = Column(DateTime(timezone=True))
    defrost_started_at = Column(DateTime(timezone=True))
    allocated_to = Column(String, nullable=True)
    admin_status = Column(String, nullable=True)


class PasteurisationRecord(Base):
    __tablename__ = "pasteurisations"
    id = Column(String, primary_key=True, default=gen_uuid)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False)
    device_id = Column(String)
    operator_id = Column(String)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    log = Column(JSON)


class Sample(Base):
    __tablename__ = "samples"
    id = Column(String, primary_key=True, default=gen_uuid)
    sample_barcode = Column(String, unique=True, index=True, nullable=False)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False)
    sample_type = Column(String)
    collected_at = Column(DateTime(timezone=True))


class MicroResult(Base):
    __tablename__ = "micro_results"
    id = Column(String, primary_key=True, default=gen_uuid)
    sample_id = Column(String, ForeignKey("samples.id"), nullable=False)
    organism = Column(String)
    quantitative_value = Column(String)
    threshold_flag = Column(Boolean, default=False)
    reported_at = Column(DateTime(timezone=True))


class LabelPrintJob(Base):
    __tablename__ = "label_print_jobs"
    id = Column(String, primary_key=True, default=gen_uuid)
    label_type = Column(String)
    printed_by = Column(String)
    printed_at = Column(DateTime(timezone=True), server_default=func.now())
    reason = Column(String)
    reprint_of = Column(String, ForeignKey("label_print_jobs.id"), nullable=True)


class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    fhir_endpoint = Column(String, nullable=True)
    contact_info = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DispatchStatus(enum.Enum):
    Created = "Created"
    InTransit = "InTransit"
    Delivered = "Delivered"
    Received = "Received"
    Cancelled = "Cancelled"


class Dispatch(Base):
    __tablename__ = "dispatches"
    id = Column(String, primary_key=True, default=gen_uuid)
    dispatch_code = Column(String, unique=True, index=True, nullable=False)
    hospital_id = Column(String, ForeignKey("hospitals.id"), nullable=False)
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(Enum(DispatchStatus), nullable=False, default=DispatchStatus.Created)
    shipper = Column(String)
    manifest = Column(JSON)


class DispatchItem(Base):
    __tablename__ = "dispatch_items"
    id = Column(String, primary_key=True, default=gen_uuid)
    dispatch_id = Column(String, ForeignKey("dispatches.id"), nullable=False)
    bottle_id = Column(String, ForeignKey("bottles.id"), nullable=False)
    barcode = Column(String, nullable=False)
    scanned_out = Column(Boolean, default=False)
    scanned_out_at = Column(DateTime(timezone=True))
    scanned_in = Column(Boolean, default=False)
    scanned_in_at = Column(DateTime(timezone=True))


class DispatchScan(Base):
    __tablename__ = "dispatch_scans"
    id = Column(String, primary_key=True, default=gen_uuid)
    dispatch_id = Column(String, ForeignKey("dispatches.id"), nullable=False)
    bottle_id = Column(String, ForeignKey("bottles.id"), nullable=True)
    scan_type = Column(String)  # out/in
    scanned_by = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class DonationRecord(Base):
    __tablename__ = "donation_records"
    id = Column(String, primary_key=True, default=gen_uuid)
    donation_id = Column(String, unique=True, index=True, nullable=True)  # Auto-generated: HospitalNum-Date-Seq
    donor_id = Column(String, ForeignKey("donors.id"), nullable=False)
    donation_date = Column(DateTime(timezone=True), nullable=False)
    number_of_bottles = Column(Integer, nullable=False)
    volume_ml = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(DonationStatus), nullable=False, default=DonationStatus.Accepted)
    notes = Column(String, nullable=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(String, primary_key=True, default=gen_uuid)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(String)
    operation = Column(String)
    entity_type = Column(String)
    entity_id = Column(String)
    before = Column(JSON)
    after = Column(JSON)
    reason = Column(String)

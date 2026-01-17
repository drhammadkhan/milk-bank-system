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
    
    # Personal Information
    first_name = Column(String)
    last_name = Column(String)
    date_of_birth = Column(DateTime(timezone=True))
    phone_number = Column(String)
    email = Column(String)
    
    # Address Information
    address = Column(String)
    postcode = Column(String)
    
    # Medical History Flags (boolean indicators)
    infectious_diseases = Column(Boolean, default=False)
    hepatitis_history = Column(Boolean, default=False)
    hepatitis_b_surface_antigen = Column(Boolean, default=False)
    hepatitis_b_core_antigen = Column(Boolean, default=False)
    hepatitis_c_antibody = Column(Boolean, default=False)
    hiv_antibody = Column(Boolean, default=False)
    hltv_antibody = Column(Boolean, default=False)
    syphilis_test = Column(Boolean, default=False)
    
    # Serological Test Results (JSON for flexibility)
    serological_tests = Column(JSON, default={})
    medical_history_notes = Column(String)


class DonationStatus(enum.Enum):
    Collected = "Collected"
    IntakeQuarantine = "IntakeQuarantine"
    Accepted = "Accepted"
    Rejected = "Rejected"
    Pooled = "Pooled"
    AssignedToBatch = "AssignedToBatch"
    Processed = "Processed"
    Disposed = "Disposed"


class Donation(Base):
    __tablename__ = "donations"
    id = Column(String, primary_key=True, default=gen_uuid)
    barcode = Column(String, unique=True, index=True, nullable=False)
    donor_id = Column(String, ForeignKey("donors.id"), nullable=False)
    collected_at = Column(DateTime(timezone=True), server_default=func.now())
    volume_ml = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(DonationStatus), nullable=False, default=DonationStatus.Collected)
    intake_user = Column(String)


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

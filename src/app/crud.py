from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from sqlalchemy.sql import func
from . import models, schemas
from sqlalchemy.exc import IntegrityError
import io
import csv
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    _HAS_REPORTLAB = True
except Exception:
    _HAS_REPORTLAB = False


def _create_audit(db: Session, user_id: str, operation: str, entity_type: str, entity_id: str, before: dict = None, after: dict = None, reason: str = None):
    ev = models.AuditEvent(user_id=user_id, operation=operation, entity_type=entity_type, entity_id=entity_id, before=before, after=after, reason=reason)
    db.add(ev)


def create_donation_record(db: Session, donation: schemas.DonationCreate, user_id: str = None):
    # Get donor's hospital number
    donor = db.query(models.Donor).filter(models.Donor.id == donation.donor_id).first()
    hospital_num = (donor.hospital_number or 'UNKNOWN') if donor else 'UNKNOWN'
    
    # Format date as YYYYMMDD
    date_str = donation.donation_date.strftime('%Y%m%d')
    
    # Get sequential number for this hospital number and date
    date_start = donation.donation_date.replace(hour=0, minute=0, second=0, microsecond=0)
    date_end = donation.donation_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    existing_count = db.query(models.DonationRecord).filter(
        models.DonationRecord.donation_date >= date_start,
        models.DonationRecord.donation_date <= date_end,
        models.DonationRecord.donation_id.like(f"{hospital_num}-{date_str}-%")
    ).count()
    
    seq_num = existing_count + 1
    generated_donation_id = f"{hospital_num}-{date_str}-{seq_num:03d}"
    
    db_donation = models.DonationRecord(
        donation_id=generated_donation_id,
        donor_id=donation.donor_id,
        donation_date=donation.donation_date,
        number_of_bottles=donation.number_of_bottles,
        notes=donation.notes
    )
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)
    if user_id:
        _create_audit(db, user_id, "create", "donation_record", db_donation.id, after={"donor_id": donation.donor_id, "number_of_bottles": donation.number_of_bottles, "donation_id": generated_donation_id})
        db.commit()
    return db_donation


def get_donation_records_by_donor(db: Session, donor_id: str):
    return db.query(models.DonationRecord).filter(models.DonationRecord.donor_id == donor_id).order_by(desc(models.DonationRecord.donation_date)).all()


def get_all_donation_records(db: Session):
    return db.query(models.DonationRecord).order_by(desc(models.DonationRecord.donation_date)).all()


def get_unacknowledged_donations(db: Session):
    return db.query(models.DonationRecord).filter(models.DonationRecord.acknowledged == False).order_by(desc(models.DonationRecord.donation_date)).all()


def acknowledge_donation(db: Session, donation_id: str, user_id: str = None):
    donation = db.query(models.DonationRecord).filter(models.DonationRecord.id == donation_id).first()
    if not donation:
        return None
    from datetime import datetime as dt
    donation.acknowledged = True
    donation.acknowledged_by = user_id
    donation.acknowledged_at = dt.now()
    db.commit()
    db.refresh(donation)
    if user_id:
        _create_audit(db, user_id, "acknowledge", "donation_record", donation_id, after={"acknowledged": True})
        db.commit()
    return donation


def create_donor(db: Session, donor: schemas.DonorCreate, user_id: str = None):
    db_d = models.Donor(
        donor_code=getattr(donor, 'donor_code', None),
        hospital_number=donor.hospital_number,
        first_name=donor.first_name,
        last_name=donor.last_name,
        date_of_birth=donor.date_of_birth,
        phone_number=donor.phone_number,
        mobile_number=donor.mobile_number,
        address=donor.address,
        postcode=donor.postcode,
        gp_name=donor.gp_name,
        gp_address=donor.gp_address,
        marital_status=donor.marital_status,
        number_of_children=donor.number_of_children or 0,
        enrolment_date=donor.enrolment_date,
        previous_donor=donor.previous_donor,
        partner_name=donor.partner_name,
        email=donor.email,
        infectious_diseases=donor.infectious_diseases,
        hepatitis_history=donor.hepatitis_history,
        hepatitis_b_surface_antigen=donor.hepatitis_b_surface_antigen,
        hepatitis_b_core_antigen=donor.hepatitis_b_core_antigen,
        hepatitis_c_antibody=donor.hepatitis_c_antibody,
        hiv_antibody=donor.hiv_antibody,
        hltv_antibody=donor.hltv_antibody,
        syphilis_test=donor.syphilis_test,
        medical_history_notes=donor.medical_history_notes,
        # Detailed Medical History
        hepatitis_jaundice_liver=getattr(donor, 'hepatitis_jaundice_liver', False),
        hepatitis_jaundice_liver_details=getattr(donor, 'hepatitis_jaundice_liver_details', None),
        hepatitis_jaundice_liver_date=getattr(donor, 'hepatitis_jaundice_liver_date', None),
        history_of_tb=getattr(donor, 'history_of_tb', False),
        history_of_tb_date=getattr(donor, 'history_of_tb_date', None),
        polio_rubella_vaccination_4weeks=getattr(donor, 'polio_rubella_vaccination_4weeks', False),
        polio_rubella_vaccination_date=getattr(donor, 'polio_rubella_vaccination_date', None),
        human_pituitary_growth_hormone=getattr(donor, 'human_pituitary_growth_hormone', False),
        human_pituitary_growth_hormone_date=getattr(donor, 'human_pituitary_growth_hormone_date', None),
        serious_illness_last_year=getattr(donor, 'serious_illness_last_year', False),
        serious_illness_last_year_details=getattr(donor, 'serious_illness_last_year_details', None),
        current_medications=getattr(donor, 'current_medications', None),
        # Lifestyle
        tattoo=getattr(donor, 'tattoo', False),
        tattoo_date=getattr(donor, 'tattoo_date', None),
        unusual_diet=getattr(donor, 'unusual_diet', None),
        smoker=getattr(donor, 'smoker', False),
        alcohol_units_per_day=getattr(donor, 'alcohol_units_per_day', None),
        # Serological Testing
        initial_blood_test_date=getattr(donor, 'initial_blood_test_date', None),
        initial_hiv1_result=getattr(donor, 'initial_hiv1_result', None),
        initial_hiv2_result=getattr(donor, 'initial_hiv2_result', None),
        initial_htlv1_result=getattr(donor, 'initial_htlv1_result', None),
        initial_htlv2_result=getattr(donor, 'initial_htlv2_result', None),
        initial_hep_b_result=getattr(donor, 'initial_hep_b_result', None),
        initial_hep_c_result=getattr(donor, 'initial_hep_c_result', None),
        initial_syphilis_result=getattr(donor, 'initial_syphilis_result', None),
        repeat_blood_test_date=getattr(donor, 'repeat_blood_test_date', None),
        repeat_hiv1_result=getattr(donor, 'repeat_hiv1_result', None),
        repeat_hiv2_result=getattr(donor, 'repeat_hiv2_result', None),
        repeat_htlv1_result=getattr(donor, 'repeat_htlv1_result', None),
        repeat_htlv2_result=getattr(donor, 'repeat_htlv2_result', None),
        repeat_hep_b_result=getattr(donor, 'repeat_hep_b_result', None),
        repeat_hep_c_result=getattr(donor, 'repeat_hep_c_result', None),
        repeat_syphilis_result=getattr(donor, 'repeat_syphilis_result', None),
        final_blood_test_status=getattr(donor, 'final_blood_test_status', None),
        # Baby details
        baby_name=getattr(donor, 'baby_name', None),
        baby_place_of_birth=getattr(donor, 'baby_place_of_birth', None),
        baby_birth_weight_g=getattr(donor, 'baby_birth_weight_g', None),
        baby_gestational_age_weeks=getattr(donor, 'baby_gestational_age_weeks', None),
        baby_dob=getattr(donor, 'baby_dob', None),
        baby_admitted_to_nicu=getattr(donor, 'baby_admitted_to_nicu', False),
        # Post-Testing Information
        one_off_donation=getattr(donor, 'one_off_donation', False),
        appointment_for_next_blood_test=getattr(donor, 'appointment_for_next_blood_test', False),
        appointment_blood_test_datetime=getattr(donor, 'appointment_blood_test_datetime', None),
        information_leaflets_given=getattr(donor, 'information_leaflets_given', False),
        leaflet_donating_milk=getattr(donor, 'leaflet_donating_milk', False),
        leaflet_blood_tests=getattr(donor, 'leaflet_blood_tests', False),
        leaflet_hygeine=getattr(donor, 'leaflet_hygeine', False),
        # Checklist
        checklist_consent_form=getattr(donor, 'checklist_consent_form', False),
        checklist_donation_record_complete=getattr(donor, 'checklist_donation_record_complete', False),
        checklist_given_bottles_labels=getattr(donor, 'checklist_given_bottles_labels', False),
        checklist_collection_explained=getattr(donor, 'checklist_collection_explained', False),
        checklist_bloods_taken=getattr(donor, 'checklist_bloods_taken', False),
        # Comments
        comments=getattr(donor, 'comments', None),
    )
    db.add(db_d)
    db.commit()
    db.refresh(db_d)
    _create_audit(db, user_id, "create", "donor", db_d.id, before=None, after={"donor_code": db_d.donor_code, "status": db_d.status.name})
    db.commit()
    return db_d


def update_donor(db: Session, donor_id: str, donor_update: schemas.DonorCreate, user_id: str = None):
    db_d = get_donor(db, donor_id)
    if not db_d:
        return None
    before = {
        "first_name": db_d.first_name,
        "last_name": db_d.last_name,
        "email": db_d.email,
        "phone_number": db_d.phone_number,
    }
    # Update all fields
    db_d.hospital_number = donor_update.hospital_number
    db_d.first_name = donor_update.first_name
    db_d.last_name = donor_update.last_name
    db_d.date_of_birth = donor_update.date_of_birth
    db_d.phone_number = donor_update.phone_number
    db_d.mobile_number = donor_update.mobile_number
    db_d.address = donor_update.address
    db_d.postcode = donor_update.postcode
    db_d.gp_name = donor_update.gp_name
    db_d.gp_address = donor_update.gp_address
    db_d.marital_status = donor_update.marital_status
    db_d.number_of_children = donor_update.number_of_children or 0
    db_d.enrolment_date = donor_update.enrolment_date
    db_d.previous_donor = donor_update.previous_donor
    db_d.partner_name = donor_update.partner_name
    db_d.email = donor_update.email
    db_d.infectious_diseases = donor_update.infectious_diseases
    db_d.hepatitis_history = donor_update.hepatitis_history
    db_d.hepatitis_b_surface_antigen = donor_update.hepatitis_b_surface_antigen
    db_d.hepatitis_b_core_antigen = donor_update.hepatitis_b_core_antigen
    db_d.hepatitis_c_antibody = donor_update.hepatitis_c_antibody
    db_d.hiv_antibody = donor_update.hiv_antibody
    db_d.hltv_antibody = donor_update.hltv_antibody
    db_d.syphilis_test = donor_update.syphilis_test
    db_d.medical_history_notes = donor_update.medical_history_notes
    # Detailed Medical History
    db_d.hepatitis_jaundice_liver = getattr(donor_update, 'hepatitis_jaundice_liver', False)
    db_d.hepatitis_jaundice_liver_details = getattr(donor_update, 'hepatitis_jaundice_liver_details', None)
    db_d.hepatitis_jaundice_liver_date = getattr(donor_update, 'hepatitis_jaundice_liver_date', None)
    db_d.history_of_tb = getattr(donor_update, 'history_of_tb', False)
    db_d.history_of_tb_date = getattr(donor_update, 'history_of_tb_date', None)
    db_d.polio_rubella_vaccination_4weeks = getattr(donor_update, 'polio_rubella_vaccination_4weeks', False)
    db_d.polio_rubella_vaccination_date = getattr(donor_update, 'polio_rubella_vaccination_date', None)
    db_d.human_pituitary_growth_hormone = getattr(donor_update, 'human_pituitary_growth_hormone', False)
    db_d.human_pituitary_growth_hormone_date = getattr(donor_update, 'human_pituitary_growth_hormone_date', None)
    db_d.serious_illness_last_year = getattr(donor_update, 'serious_illness_last_year', False)
    db_d.serious_illness_last_year_details = getattr(donor_update, 'serious_illness_last_year_details', None)
    db_d.current_medications = getattr(donor_update, 'current_medications', None)
    # Lifestyle
    db_d.tattoo = getattr(donor_update, 'tattoo', False)
    db_d.tattoo_date = getattr(donor_update, 'tattoo_date', None)
    db_d.unusual_diet = getattr(donor_update, 'unusual_diet', None)
    db_d.smoker = getattr(donor_update, 'smoker', False)
    db_d.alcohol_units_per_day = getattr(donor_update, 'alcohol_units_per_day', None)
    # Serological Testing
    db_d.initial_blood_test_date = getattr(donor_update, 'initial_blood_test_date', None)
    db_d.initial_hiv1_result = getattr(donor_update, 'initial_hiv1_result', None)
    db_d.initial_hiv2_result = getattr(donor_update, 'initial_hiv2_result', None)
    db_d.initial_htlv1_result = getattr(donor_update, 'initial_htlv1_result', None)
    db_d.initial_htlv2_result = getattr(donor_update, 'initial_htlv2_result', None)
    db_d.initial_hep_b_result = getattr(donor_update, 'initial_hep_b_result', None)
    db_d.initial_hep_c_result = getattr(donor_update, 'initial_hep_c_result', None)
    db_d.initial_syphilis_result = getattr(donor_update, 'initial_syphilis_result', None)
    db_d.repeat_blood_test_date = getattr(donor_update, 'repeat_blood_test_date', None)
    db_d.repeat_hiv1_result = getattr(donor_update, 'repeat_hiv1_result', None)
    db_d.repeat_hiv2_result = getattr(donor_update, 'repeat_hiv2_result', None)
    db_d.repeat_htlv1_result = getattr(donor_update, 'repeat_htlv1_result', None)
    db_d.repeat_htlv2_result = getattr(donor_update, 'repeat_htlv2_result', None)
    db_d.repeat_hep_b_result = getattr(donor_update, 'repeat_hep_b_result', None)
    db_d.repeat_hep_c_result = getattr(donor_update, 'repeat_hep_c_result', None)
    db_d.repeat_syphilis_result = getattr(donor_update, 'repeat_syphilis_result', None)
    db_d.final_blood_test_status = getattr(donor_update, 'final_blood_test_status', None)
    # Baby details
    db_d.baby_name = getattr(donor_update, 'baby_name', None)
    db_d.baby_place_of_birth = getattr(donor_update, 'baby_place_of_birth', None)
    db_d.baby_birth_weight_g = getattr(donor_update, 'baby_birth_weight_g', None)
    db_d.baby_gestational_age_weeks = getattr(donor_update, 'baby_gestational_age_weeks', None)
    db_d.baby_dob = getattr(donor_update, 'baby_dob', None)
    db_d.baby_admitted_to_nicu = getattr(donor_update, 'baby_admitted_to_nicu', False)
    # Post-Testing Information
    db_d.one_off_donation = getattr(donor_update, 'one_off_donation', False)
    db_d.appointment_for_next_blood_test = getattr(donor_update, 'appointment_for_next_blood_test', False)
    db_d.appointment_blood_test_datetime = getattr(donor_update, 'appointment_blood_test_datetime', None)
    db_d.information_leaflets_given = getattr(donor_update, 'information_leaflets_given', False)
    db_d.leaflet_donating_milk = getattr(donor_update, 'leaflet_donating_milk', False)
    db_d.leaflet_blood_tests = getattr(donor_update, 'leaflet_blood_tests', False)
    db_d.leaflet_hygeine = getattr(donor_update, 'leaflet_hygeine', False)
    # Checklist
    db_d.checklist_consent_form = getattr(donor_update, 'checklist_consent_form', False)
    db_d.checklist_donation_record_complete = getattr(donor_update, 'checklist_donation_record_complete', False)
    db_d.checklist_given_bottles_labels = getattr(donor_update, 'checklist_given_bottles_labels', False)
    db_d.checklist_collection_explained = getattr(donor_update, 'checklist_collection_explained', False)
    db_d.checklist_bloods_taken = getattr(donor_update, 'checklist_bloods_taken', False)
    # Comments
    db_d.comments = getattr(donor_update, 'comments', None)
    db.add(db_d)
    _create_audit(db, user_id, "update", "donor", db_d.id, before=before, after={"first_name": db_d.first_name, "last_name": db_d.last_name, "email": db_d.email})
    db.commit()
    db.refresh(db_d)
    return db_d


def get_donor(db: Session, donor_id: str):
    return db.query(models.Donor).filter(models.Donor.id == donor_id).first()


def get_all_donors(db: Session):
    return db.query(models.Donor).all()


def get_all_donations(db: Session):
    return db.query(models.Donation).all()


def get_all_batches(db: Session):
    return db.query(models.Batch).all()


def get_batch(db: Session, batch_id: str):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        return None
    
    donor_info = None
    
    # If the batch has donation IDs stored, use the first one to get donor info
    if batch.donation_ids and len(batch.donation_ids) > 0:
        first_donation_id = batch.donation_ids[0]
        
        # Get the donation record
        donation_record = db.query(models.DonationRecord).filter(
            models.DonationRecord.donation_id == first_donation_id
        ).first()
        
        if donation_record:
            # Get the donor
            donor = db.query(models.Donor).filter(
                models.Donor.id == donation_record.donor_id
            ).first()
            
            if donor:
                donor_name = f"{donor.first_name or ''} {donor.last_name or ''}".strip()
                donor_info = {
                    "donor_hospital_number": donor.hospital_number,
                    "donor_name": donor_name if donor_name else None
                }

    # Convert batch to dict
    batch_dict = {
        "id": batch.id,
        "batch_code": batch.batch_code,
        "batch_date": batch.batch_date,
        "hospital_number": batch.hospital_number,
        "created_at": batch.created_at,
        "status": batch.status.name,
        "total_volume_ml": batch.total_volume_ml,
        "number_of_bottles": batch.number_of_bottles
    }
    
    # Add stored donation IDs
    if batch.donation_ids:
        batch_dict["donation_ids"] = batch.donation_ids
    
    # Add donor information if found
    if donor_info:
        batch_dict.update(donor_info)
    
    return batch_dict


def get_all_bottles(db: Session):
    """Return bottles only from batches with 'Released' status with enriched data"""
    bottles = db.query(models.Bottle).join(
        models.Batch, models.Bottle.batch_id == models.Batch.id
    ).filter(
        models.Batch.status == models.BatchStatus.Released
    ).all()
    
    # Enrich bottles with batch and pasteurisation information
    result = []
    for bottle in bottles:
        batch = db.query(models.Batch).filter(models.Batch.id == bottle.batch_id).first()
        pasteurisation = db.query(models.PasteurisationRecord).filter(
            models.PasteurisationRecord.batch_id == bottle.batch_id
        ).order_by(models.PasteurisationRecord.end_time.desc()).first()
        
        bottle_dict = {
            "id": bottle.id,
            "barcode": bottle.barcode,
            "batch_id": bottle.batch_id,
            "batch_code": batch.batch_code if batch else None,
            "hospital_number": batch.hospital_number if batch else None,
            "volume_ml": bottle.volume_ml,
            "status": bottle.status.name if bottle.status else None,
            "allocated_at": bottle.allocated_at,
            "administered_at": bottle.administered_at,
            "administered_by": bottle.administered_by,
            "patient_id": bottle.patient_id,
            "defrost_started_at": bottle.defrost_started_at,
            "pasteurisation_date": pasteurisation.end_time if pasteurisation else None,
        }
        result.append(bottle_dict)
    
    return result


def get_bottle(db: Session, bottle_id: str):
    return db.query(models.Bottle).filter(models.Bottle.id == bottle_id).first()


def allocate_bottle(db: Session, bottle_id: str, patient_id: str, allocated_by: str):
    """Allocate a bottle to a patient"""
    from datetime import datetime, timezone
    bottle = get_bottle(db, bottle_id)
    if not bottle:
        raise IntegrityError("Bottle not found", params={}, orig=None)
    
    if bottle.status != models.BottleStatus.Available:
        raise IntegrityError(f"Bottle is not available (current status: {bottle.status.value})", params={}, orig=None)
    
    bottle.status = models.BottleStatus.Allocated
    bottle.patient_id = patient_id
    bottle.allocated_to = allocated_by
    bottle.allocated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(bottle)
    return bottle


def start_defrosting_bottle(db: Session, bottle_id: str):
    """Mark bottle as defrosting"""
    from datetime import datetime, timezone
    bottle = get_bottle(db, bottle_id)
    if not bottle:
        raise IntegrityError("Bottle not found", params={}, orig=None)
    
    if bottle.status != models.BottleStatus.Allocated:
        raise IntegrityError(f"Bottle must be allocated first (current status: {bottle.status.value})", params={}, orig=None)
    
    bottle.status = models.BottleStatus.Defrosting
    bottle.defrost_started_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(bottle)
    return bottle


def administer_bottle(db: Session, bottle_id: str, administered_by: str):
    """Mark bottle as administered"""
    from datetime import datetime, timezone
    bottle = get_bottle(db, bottle_id)
    if not bottle:
        raise IntegrityError("Bottle not found", params={}, orig=None)
    
    if bottle.status not in [models.BottleStatus.Defrosting, models.BottleStatus.Allocated]:
        raise IntegrityError(f"Bottle must be allocated or defrosting (current status: {bottle.status.value})", params={}, orig=None)
    
    bottle.status = models.BottleStatus.Administered
    bottle.administered_at = datetime.now(timezone.utc)
    bottle.administered_by = administered_by
    
    db.commit()
    db.refresh(bottle)
    return bottle


def discard_bottle(db: Session, bottle_id: str, reason: str):
    """Mark bottle as discarded"""
    bottle = get_bottle(db, bottle_id)
    if not bottle:
        raise IntegrityError("Bottle not found", params={}, orig=None)
    
    bottle.status = models.BottleStatus.Discarded
    bottle.admin_status = reason
    
    db.commit()
    db.refresh(bottle)
    return bottle


def get_all_dispatches(db: Session):
    return db.query(models.Dispatch).all()


def get_dispatch(db: Session, dispatch_id: str):
    return db.query(models.Dispatch).filter(models.Dispatch.id == dispatch_id).first()


def approve_donor(db: Session, donor_id: str, approver_id: str):
    from .state_machines import transition_donor_state
    from transitions.core import MachineError
    d = get_donor(db, donor_id)
    if not d:
        return None
    before = {"status": d.status.name}
    try:
        transition_donor_state(d, 'approve')
    except MachineError as e:
        raise IntegrityError(f"Invalid state transition: {str(e)}", params={}, orig=None)
    db.add(d)
    _create_audit(db, approver_id, "approve", "donor", d.id, before=before, after={"status": d.status.name})
    db.commit()
    db.refresh(d)
    return d


def revert_donor_approval(db: Session, donor_id: str, user_id: str = None):
    from .state_machines import transition_donor_state
    from transitions.core import MachineError
    d = get_donor(db, donor_id)
    if not d:
        return None
    before = {"status": d.status.name}
    try:
        transition_donor_state(d, 'revert_to_applied')
    except MachineError as e:
        raise IntegrityError(f"Invalid state transition: {str(e)}", params={}, orig=None)
    db.add(d)
    if user_id:
        _create_audit(db, user_id, "revert_approval", "donor", d.id, before=before, after={"status": d.status.name})
    db.commit()
    db.refresh(d)
    return d


def create_donation(db: Session, donation: schemas.DonationCreate, user_id: str = None):
    # Ensure donor exists and is approved
    donor = get_donor(db, donation.donor_id)
    if not donor or donor.status != models.DonorStatus.Approved:
        raise IntegrityError("Donor not approved", params={}, orig=None)
    db_obj = models.Donation(barcode=donation.barcode, donor_id=donation.donor_id, volume_ml=donation.volume_ml)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    _create_audit(db, user_id, "create", "donation", db_obj.id, before=None, after={"barcode": db_obj.barcode, "donor_id": db_obj.donor_id})
    db.commit()
    return db_obj


def get_donation(db: Session, donation_id: str):
    return db.query(models.Donation).filter(models.Donation.id == donation_id).first()


def accept_donation(db: Session, donation_id: str, user_id: str = None):
    from .state_machines import transition_donation_state
    from transitions.core import MachineError
    d = db.query(models.Donation).filter(models.Donation.id == donation_id).first()
    if not d:
        return None
    donor = db.query(models.Donor).filter(models.Donor.id == d.donor_id).first()
    if not donor or donor.status != models.DonorStatus.Approved:
        raise IntegrityError("Donor not approved", params={}, orig=None)
    before = {"status": d.status.name}
    try:
        transition_donation_state(d, 'accept')
    except MachineError as e:
        raise IntegrityError(f"Invalid state transition: {str(e)}", params={}, orig=None)
    db.add(d)
    _create_audit(db, user_id, "accept", "donation", d.id, before=before, after={"status": d.status.name})
    db.commit()
    db.refresh(d)
    return d


def _resolve_donations_for_batch(db: Session, donation_ids: list):
    """Resolve donation identifiers to DonationRecord objects"""
    resolved = []
    missing = []

    for identifier in donation_ids:
        # Look up by either id or donation_id field
        d = db.query(models.DonationRecord).filter(
            (models.DonationRecord.id == identifier) | (models.DonationRecord.donation_id == identifier)
        ).first()
        
        if d:
            resolved.append(d)
        else:
            missing.append(identifier)

    if missing:
        raise IntegrityError(f"Some donations not found: {', '.join(missing)}", params={}, orig=None)

    return resolved


def assign_donations_to_batch(db: Session, donation_ids: list, batch_code: str, user_id: str = None, 
                              batch_date = None, hospital_number: str = None, number_of_bottles: int = None, bottle_volumes: list = None):
    # Resolve donation IDs to DonationRecord objects
    donations = _resolve_donations_for_batch(db, donation_ids)
    for d in donations:
        # Only allow donations that are in Accepted state
        if d.status != models.DonationStatus.Accepted:
            identifier = d.donation_id or d.id
            raise IntegrityError(f"Donation {identifier} is already used in another batch (status: {d.status.name})", params={}, orig=None)

    # Check if batch code already exists and find next available sequence number
    import re
    existing_batch = db.query(models.Batch).filter(models.Batch.batch_code == batch_code).first()
    if existing_batch:
        # Find all batches with same base code (including sequenced variants)
        all_batches = db.query(models.Batch.batch_code).filter(
            models.Batch.batch_code.like(f"{batch_code}%")
        ).all()
        
        # Extract sequence numbers from batch codes
        max_sequence = 0
        for (code,) in all_batches:
            if code == batch_code:
                max_sequence = max(max_sequence, 0)  # Base code exists
            else:
                # Try to extract sequence number (format: BATCH-CODE-###)
                match = re.match(rf"{re.escape(batch_code)}-(\d+)", code)
                if match:
                    seq_num = int(match.group(1))
                    max_sequence = max(max_sequence, seq_num)
        
        # Generate next sequence number
        next_sequence = max_sequence + 1
        if next_sequence > 999:  # Safety limit
            raise IntegrityError(f"Cannot generate unique batch code for {batch_code}", params={}, orig=None)
        batch_code = f"{batch_code}-{next_sequence:03d}"

    batch = models.Batch(
        batch_code=batch_code, 
        total_volume_ml=sum(d.volume_ml for d in donations),
        batch_date=batch_date,
        hospital_number=hospital_number,
        number_of_bottles=number_of_bottles,
        donation_ids=donation_ids  # Store the original donation IDs
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # Create bottles if number_of_bottles is specified
    if number_of_bottles and number_of_bottles > 0:
        from .barcode import gen_uuid
        
        for i in range(number_of_bottles):
            # Use volume from bottle_volumes array if provided, otherwise default to 50ml
            if bottle_volumes and i < len(bottle_volumes):
                bottle_volume = bottle_volumes[i]
            else:
                bottle_volume = 50.0  # Default to 50ml
            
            code = gen_uuid()
            bt = models.Bottle(barcode=code, batch_id=batch.id, volume_ml=bottle_volume)
            db.add(bt)
            db.flush()
            _create_audit(db, user_id, "create", "bottle", bt.id, before=None, after={"barcode": bt.barcode, "batch_id": batch.id, "volume_ml": bottle_volume})

    from .state_machines import transition_donation_state
    from transitions.core import MachineError
    for d in donations:
        before = {"status": d.status.name}
        try:
            transition_donation_state(d, 'assign')
        except MachineError as e:
            raise IntegrityError(f"Cannot assign donation {d.barcode}: {str(e)}", params={}, orig=None)
        db.add(d)
        _create_audit(db, user_id, "assign", "donation", d.id, before=before, after={"status": d.status.name, "batch_id": batch.id})
    _create_audit(db, user_id, "create", "batch", batch.id, before=None, after={"batch_code": batch.batch_code, "total_volume_ml": batch.total_volume_ml})
    db.commit()
    return batch


def start_pasteurisation(db: Session, batch_id: str, operator_id: str, device_id: str):
    from .state_machines import transition_batch_state
    from transitions.core import MachineError
    b = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not b:
        return None
    before = {"status": b.status.name}
    try:
        transition_batch_state(b, 'start_pasteurisation')
    except MachineError as e:
        raise IntegrityError(f"Invalid state transition: {str(e)}", params={}, orig=None)
    record = models.PasteurisationRecord(batch_id=batch_id, device_id=device_id, operator_id=operator_id, start_time=func.now())
    db.add(record)
    _create_audit(db, operator_id, "pasteurise_start", "batch", b.id, before=before, after={"status": b.status.name, "record_id": record.id})
    db.commit()
    db.refresh(b)
    return record


def complete_pasteurisation(db: Session, batch_id: str, operator_id: str, record_id: str, log: dict):
    b = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not b:
        return None
    rec = db.query(models.PasteurisationRecord).filter(models.PasteurisationRecord.id == record_id).first()
    if not rec:
        raise IntegrityError("Pasteurisation record not found", params={}, orig=None)
    from .state_machines import transition_batch_state
    from transitions.core import MachineError
    rec.end_time = func.now()
    rec.log = log
    try:
        transition_batch_state(b, 'complete_pasteurisation')
    except MachineError as e:
        raise IntegrityError(f"Invalid state transition: {str(e)}", params={}, orig=None)
    db.add(rec)
    db.add(b)
    _create_audit(db, operator_id, "pasteurise_complete", "batch", b.id, before={"status": models.BatchStatus.Pasteurising.name}, after={"status": b.status.name})
    db.commit()
    db.refresh(b)
    return rec


def create_micro_sample(db: Session, batch_id: str, sample_type: str, user_id: str = None):
    b = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not b:
        raise IntegrityError("Batch not found", params={}, orig=None)
    s = models.Sample(batch_id=batch_id, sample_barcode=gen_uuid(), sample_type=sample_type)
    db.add(s)
    _create_audit(db, user_id, "create", "sample", s.id, before=None, after={"batch_id": batch_id, "sample_type": sample_type})
    db.commit()
    db.refresh(s)
    return s


def post_micro_result(db: Session, sample_id: str, organism: str, quantitative_value: str, threshold_flag: bool, user_id: str = None):
    s = db.query(models.Sample).filter(models.Sample.id == sample_id).first()
    if not s:
        raise IntegrityError("Sample not found", params={}, orig=None)
    r = models.MicroResult(sample_id=sample_id, organism=organism, quantitative_value=quantitative_value, threshold_flag=threshold_flag, reported_at=func.now())
    db.add(r)
    from .state_machines import transition_batch_state
    from transitions.core import MachineError
    b = db.query(models.Batch).filter(models.Batch.id == s.batch_id).first()
    if b:
        before = {"status": b.status.name}
        # if positive threshold, quarantine the batch
        if threshold_flag:
            try:
                transition_batch_state(b, 'quarantine')
            except MachineError as e:
                raise IntegrityError(f"Cannot quarantine batch: {str(e)}", params={}, orig=None)
            db.add(b)
            _create_audit(db, user_id, "quarantine", "batch", b.id, before=before, after={"status": b.status.name, "reason": "micro_positive"})
        # if negative threshold and batch is pending test, mark as Tested
        elif b.status == models.BatchStatus.MicroTestPending:
            try:
                transition_batch_state(b, 'mark_tested')
            except MachineError as e:
                raise IntegrityError(f"Cannot mark batch as tested: {str(e)}", params={}, orig=None)
            db.add(b)
            _create_audit(db, user_id, "test_complete", "batch", b.id, before=before, after={"status": b.status.name, "result": "negative"})
    _create_audit(db, user_id, "create", "micro_result", s.id, before=None, after={"organism": organism, "threshold": threshold_flag})
    db.commit()
    db.refresh(r)
    return r


def process_post_pasteurisation_results(db: Session, batch_id: str, user_id: str = None):
    """
    Check all post-pasteurisation samples for a batch and update status:
    - All negative → Tested → Released
    - Any positive → TestingFailed
    """
    from .state_machines import transition_batch_state
    from transitions.core import MachineError
    
    b = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not b:
        raise IntegrityError("Batch not found", params={}, orig=None)
    
    # Get all post-pasteurisation samples for this batch
    samples = db.query(models.Sample).filter(
        models.Sample.batch_id == batch_id,
        models.Sample.sample_type == 'post-pasteurisation'
    ).all()
    
    if not samples or len(samples) < 2:
        raise IntegrityError("Insufficient post-pasteurisation samples", params={}, orig=None)
    
    # Check if all samples have results
    all_have_results = all(
        db.query(models.MicroResult).filter(
            models.MicroResult.sample_id == sample.id
        ).first() is not None
        for sample in samples
    )
    
    if not all_have_results:
        raise IntegrityError("Not all samples have results posted", params={}, orig=None)
    
    # Check for any positive results
    has_positive = False
    for sample in samples:
        result = db.query(models.MicroResult).filter(
            models.MicroResult.sample_id == sample.id
        ).first()
        if result and result.threshold_flag:
            has_positive = True
            break
    
    before = {"status": b.status.name}
    
    try:
        if has_positive:
            # Any positive result → fail
            transition_batch_state(b, 'fail_testing')
            _create_audit(db, user_id or 'system', "fail_testing", "batch", b.id, 
                         before=before, after={"status": b.status.name, "reason": "positive_culture"})
        else:
            # All negative → tested (if not already), then auto-release
            if b.status != models.BatchStatus.Tested and b.status != models.BatchStatus.Released:
                transition_batch_state(b, 'mark_tested')
            
            # Only release if not already released
            if b.status != models.BatchStatus.Released:
                transition_batch_state(b, 'release')
                
                # Set all bottles in this batch to Available status
                bottles = db.query(models.Bottle).filter(models.Bottle.batch_id == batch_id).all()
                for bottle in bottles:
                    bottle.status = models.BottleStatus.Available
            
            _create_audit(db, user_id or 'system', "auto_release", "batch", b.id, 
                         before=before, after={"status": b.status.name, "reason": "negative_post_pasteurisation"})
    except MachineError as e:
        raise IntegrityError(f"Invalid state transition: {str(e)}", params={}, orig=None)
    
    db.commit()
    db.refresh(b)
    return b


def release_batch(db: Session, batch_id: str, approver_id: str, approver2_id: str = None):
    from .state_machines import transition_batch_state
    from transitions.core import MachineError
    b = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not b:
        raise IntegrityError("Batch not found", params={}, orig=None)
    # simple two-person verification: require approver2_id to be provided
    if not approver2_id:
        raise IntegrityError("Two-person approval required", params={}, orig=None)
    before = {"status": b.status.name}
    try:
        transition_batch_state(b, 'release')
    except MachineError as e:
        raise IntegrityError(f"Invalid state transition: {str(e)}", params={}, orig=None)
    _create_audit(db, approver_id, "release", "batch", b.id, before=before, after={"status": b.status.name, "approved_by": [approver_id, approver2_id]})
    db.commit()
    db.refresh(b)
    return b


def administer_bottle(db: Session, bottle_id: str, baby_id: str, admin_user1: str, admin_user2: str):
    bottle = db.query(models.Bottle).filter(models.Bottle.id == bottle_id).first()
    if not bottle:
        raise IntegrityError("Bottle not found", params={}, orig=None)
    # ensure batch released
    batch = db.query(models.Batch).filter(models.Batch.id == bottle.batch_id).first()
    if not batch or batch.status != models.BatchStatus.Released:
        raise IntegrityError("Bottle's batch not released", params={}, orig=None)
    # defrost window check: must be within 24 hours of defrost_started_at
    from datetime import datetime, timedelta, timezone

    if not bottle.defrost_started_at:
        raise IntegrityError("Bottle not defrosted", params={}, orig=None)
    
    # Use timezone-aware datetime to match database timestamp
    now = datetime.now(timezone.utc)
    # If defrost_started_at is naive, make it timezone-aware
    defrost_time = bottle.defrost_started_at
    if defrost_time.tzinfo is None:
        defrost_time = defrost_time.replace(tzinfo=timezone.utc)
    
    if now - defrost_time > timedelta(hours=24):
        raise IntegrityError("Defrost window exceeded (24 hour limit)", params={}, orig=None)
    # record administration
    bottle.allocated_to = baby_id
    bottle.admin_status = "Administered"
    _create_audit(db, admin_user1, "administer", "bottle", bottle.id, before=None, after={"baby_id": baby_id, "admin_by": [admin_user1, admin_user2]})
    db.commit()
    db.refresh(bottle)
    return bottle


def allocate_bottle(db: Session, bottle_id: str, baby_id: str, user_id: str = None):
    """
    Allocate a bottle to a specific baby/patient.
    Bottle must be from a Released batch.
    """
    bottle = db.query(models.Bottle).filter(models.Bottle.id == bottle_id).first()
    if not bottle:
        raise IntegrityError("Bottle not found", params={}, orig=None)
    
    # Ensure batch is released
    batch = db.query(models.Batch).filter(models.Batch.id == bottle.batch_id).first()
    if not batch or batch.status != models.BatchStatus.Released:
        raise IntegrityError("Cannot allocate bottle - batch not released", params={}, orig=None)
    
    # Check if already allocated
    if bottle.allocated_to:
        raise IntegrityError(f"Bottle already allocated to {bottle.allocated_to}", params={}, orig=None)
    
    before = {"allocated_to": bottle.allocated_to}
    bottle.allocated_to = baby_id
    db.add(bottle)
    _create_audit(db, user_id, "allocate", "bottle", bottle.id, before=before, after={"allocated_to": baby_id})
    db.commit()
    db.refresh(bottle)
    return bottle


def defrost_bottle(db: Session, bottle_id: str, user_id: str = None):
    """
    Record that a bottle has been taken out of freezer and defrosting has started.
    This starts the 24-hour countdown for administration.
    """
    from datetime import datetime, timezone
    
    bottle = db.query(models.Bottle).filter(models.Bottle.id == bottle_id).first()
    if not bottle:
        raise IntegrityError("Bottle not found", params={}, orig=None)
    
    # Ensure batch is released
    batch = db.query(models.Batch).filter(models.Batch.id == bottle.batch_id).first()
    if not batch or batch.status != models.BatchStatus.Released:
        raise IntegrityError("Cannot defrost bottle - batch not released", params={}, orig=None)
    
    # Check if already defrosted
    if bottle.defrost_started_at:
        raise IntegrityError(f"Bottle already defrosted at {bottle.defrost_started_at}", params={}, orig=None)
    
    before = {"defrost_started_at": None}
    bottle.defrost_started_at = datetime.now(timezone.utc)
    db.add(bottle)
    _create_audit(db, user_id, "defrost", "bottle", bottle.id, before=before, after={"defrost_started_at": bottle.defrost_started_at.isoformat()})
    db.commit()
    db.refresh(bottle)
    return bottle

# note: helper gen_uuid imported from barcode module
from .barcode import gen_uuid
import requests


def create_bottles_for_batch(db: Session, batch_id: str, count: int = 1, volume_ml: float = 30.0, user_id: str = None):
    b = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not b:
        raise IntegrityError("Batch not found", params={}, orig=None)
    bottles = []
    for i in range(count):
        code = gen_uuid()
        bt = models.Bottle(barcode=code, batch_id=batch_id, volume_ml=volume_ml)
        db.add(bt)
        db.flush()
        bottles.append(bt)
        _create_audit(db, user_id, "create", "bottle", bt.id, before=None, after={"barcode": bt.barcode, "batch_id": batch_id})
    db.commit()
    for bt in bottles:
        db.refresh(bt)
    return bottles


def create_hospital(db: Session, name: str, fhir_endpoint: str = None, contact_info: dict = None, created_by: str = None):
    h = models.Hospital(name=name, fhir_endpoint=fhir_endpoint, contact_info=contact_info or {})
    db.add(h)
    db.commit()
    db.refresh(h)
    _create_audit(db, created_by, "create", "hospital", h.id, before=None, after={"name": h.name, "fhir_endpoint": h.fhir_endpoint})
    db.commit()
    return h


def create_dispatch(db: Session, bottle_ids: list, hospital_id: str, dispatch_code: str, created_by: str = None, shipper: str = None):
    # validate hospital
    hosp = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hosp:
        raise IntegrityError("Hospital not found", params={}, orig=None)
    bottles = db.query(models.Bottle).filter(models.Bottle.id.in_(bottle_ids)).all()
    if len(bottles) != len(bottle_ids):
        raise IntegrityError("Some bottles not found", params={}, orig=None)
    # ensure bottles' batches are released
    for bt in bottles:
        batch = db.query(models.Batch).filter(models.Batch.id == bt.batch_id).first()
        if not batch or batch.status != models.BatchStatus.Released:
            raise IntegrityError(f"Bottle {bt.id} not from released batch", params={}, orig=None)
        # ensure not already dispatched
        existing = db.query(models.DispatchItem).filter(models.DispatchItem.bottle_id == bt.id).first()
        if existing:
            raise IntegrityError(f"Bottle {bt.id} already dispatched", params={}, orig=None)

    disp = models.Dispatch(dispatch_code=dispatch_code, hospital_id=hospital_id, created_by=created_by, shipper=shipper, manifest={"count": len(bottles)})
    db.add(disp)
    db.commit()
    db.refresh(disp)
    for bt in bottles:
        item = models.DispatchItem(dispatch_id=disp.id, bottle_id=bt.id, barcode=bt.barcode)
        db.add(item)
        # mark bottle as in transit storage location
        bt.storage_location_id = f"InTransit:{disp.id}"
        db.add(bt)
        _create_audit(db, created_by, "dispatch_assign", "bottle", bt.id, before=None, after={"dispatch_id": disp.id})
    _create_audit(db, created_by, "create", "dispatch", disp.id, before=None, after={"dispatch_code": disp.dispatch_code, "hospital_id": hospital_id})
    db.commit()
    db.refresh(disp)
    return disp


def scan_dispatch_item(db: Session, dispatch_id: str, barcode: str, user_id: str = None, scan_type: str = "out"):
    item = db.query(models.DispatchItem).filter(models.DispatchItem.dispatch_id == dispatch_id, models.DispatchItem.barcode == barcode).first()
    if not item:
        raise IntegrityError("Dispatch item not found", params={}, orig=None)
    if scan_type == "out":
        item.scanned_out = True
        item.scanned_out_at = func.now()
    else:
        item.scanned_in = True
        item.scanned_in_at = func.now()
    db.add(item)
    scan = models.DispatchScan(dispatch_id=dispatch_id, bottle_id=item.bottle_id, scan_type=scan_type, scanned_by=user_id)
    db.add(scan)
    _create_audit(db, user_id, "dispatch_scan", "dispatch", dispatch_id, before=None, after={"barcode": barcode, "scan_type": scan_type})
    db.commit()
    db.refresh(item)
    return item


def receive_dispatch(db: Session, dispatch_id: str, received_by: str = None):
    disp = db.query(models.Dispatch).filter(models.Dispatch.id == dispatch_id).first()
    if not disp:
        raise IntegrityError("Dispatch not found", params={}, orig=None)
    items = db.query(models.DispatchItem).filter(models.DispatchItem.dispatch_id == dispatch_id).all()
    for it in items:
        # mark scanned_in if not already
        if not it.scanned_in:
            it.scanned_in = True
            it.scanned_in_at = func.now()
        # update bottle location
        bt = db.query(models.Bottle).filter(models.Bottle.id == it.bottle_id).first()
        if bt:
            bt.storage_location_id = f"Hospital:{disp.hospital_id}"
            db.add(bt)
            _create_audit(db, received_by, "receive", "bottle", bt.id, before=None, after={"storage_location": bt.storage_location_id})
        db.add(it)
    before = {"status": disp.status.name}
    disp.status = models.DispatchStatus.Received
    db.add(disp)
    _create_audit(db, received_by, "receive", "dispatch", disp.id, before=before, after={"status": disp.status.name})
    db.commit()
    db.refresh(disp)
    return disp


def send_dispatch_fhir(db: Session, dispatch_id: str, fhir_endpoint: str = None, auth: dict = None):
    disp = db.query(models.Dispatch).filter(models.Dispatch.id == dispatch_id).first()
    if not disp:
        raise IntegrityError("Dispatch not found", params={}, orig=None)
    hosp = db.query(models.Hospital).filter(models.Hospital.id == disp.hospital_id).first()
    endpoint = fhir_endpoint or (hosp.fhir_endpoint if hosp else None)
    if not endpoint:
        raise IntegrityError("FHIR endpoint not found", params={}, orig=None)
    # simple FHIR Bundle payload (Composition + entries)
    bundle = {
        "resourceType": "Bundle",
        "type": "message",
        "entry": [
            {
                "resource": {
                    "resourceType": "Composition",
                    "title": f"Dispatch {disp.dispatch_code}",
                    "status": "final",
                    "date": disp.created_at.isoformat() if disp.created_at else None,
                    "section": [{"title": "manifest", "text": {"status": "additional", "div": str(disp.manifest)}}]
                }
            }
        ]
    }
    headers = {"Content-Type": "application/fhir+json"}
    if auth and "token" in auth:
        headers["Authorization"] = f"Bearer {auth['token']}"
    resp = requests.post(endpoint, json=bundle, headers=headers)
    if resp.status_code >= 400:
        raise IntegrityError("FHIR send failed", params={}, orig=None)
    _create_audit(db, None, "send_fhir", "dispatch", disp.id, before=None, after={"sent_to": endpoint})
    db.commit()
    return resp


def get_dispatch_manifest(db: Session, dispatch_id: str):
    disp = db.query(models.Dispatch).filter(models.Dispatch.id == dispatch_id).first()
    if not disp:
        raise IntegrityError("Dispatch not found", params={}, orig=None)
    items = db.query(models.DispatchItem).filter(models.DispatchItem.dispatch_id == dispatch_id).all()
    bottles = []
    for it in items:
        bt = db.query(models.Bottle).filter(models.Bottle.id == it.bottle_id).first()
        bottles.append({
            "bottle_id": bt.id,
            "barcode": bt.barcode,
            "scanned_out": it.scanned_out,
            "scanned_in": it.scanned_in,
            "storage_location": bt.storage_location_id,
        })
    manifest = {
        "dispatch_id": disp.id,
        "dispatch_code": disp.dispatch_code,
        "hospital_id": disp.hospital_id,
        "shipper": disp.shipper,
        "status": disp.status.name,
        "created_at": disp.created_at.isoformat() if disp.created_at else None,
        "items": bottles,
        "manifest_summary": disp.manifest
    }
    return manifest


def export_dispatch_manifest_csv(db: Session, dispatch_id: str) -> bytes:
    manifest = get_dispatch_manifest(db, dispatch_id)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["dispatch_id", "dispatch_code", "hospital_id", "shipper", "status", "created_at"])
    writer.writerow([manifest["dispatch_id"], manifest["dispatch_code"], manifest["hospital_id"], manifest["shipper"], manifest["status"], manifest["created_at"]])
    writer.writerow([])
    writer.writerow(["bottle_id", "barcode", "scanned_out", "scanned_in", "storage_location"])
    for it in manifest["items"]:
        writer.writerow([it["bottle_id"], it["barcode"], it["scanned_out"], it["scanned_in"], it["storage_location"]])
    return buf.getvalue().encode("utf-8")


def export_dispatch_manifest_pdf(db: Session, dispatch_id: str) -> bytes:
    if not _HAS_REPORTLAB:
        raise ImportError("reportlab not available")
    manifest = get_dispatch_manifest(db, dispatch_id)
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    text = c.beginText(40, 750)
    text.setFont("Helvetica", 12)
    text.textLine(f"Dispatch: {manifest['dispatch_code']} ({manifest['dispatch_id']})")
    text.textLine(f"Hospital: {manifest['hospital_id']}")
    text.textLine(f"Shipper: {manifest['shipper']}   Status: {manifest['status']}")
    text.textLine("")
    text.textLine("Items:")
    for it in manifest['items']:
        text.textLine(f"- {it['barcode']} | out:{it['scanned_out']} in:{it['scanned_in']} loc:{it['storage_location']}")
    c.drawText(text)
    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()


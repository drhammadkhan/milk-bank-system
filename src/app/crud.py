from sqlalchemy.orm import Session
from sqlalchemy import select
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


def create_donor(db: Session, donor: schemas.DonorCreate, user_id: str = None):
    db_d = models.Donor(donor_code=donor.donor_code)
    db.add(db_d)
    db.commit()
    db.refresh(db_d)
    _create_audit(db, user_id, "create", "donor", db_d.id, before=None, after={"donor_code": db_d.donor_code, "status": db_d.status.name})
    db.commit()
    return db_d


def get_donor(db: Session, donor_id: str):
    return db.query(models.Donor).filter(models.Donor.id == donor_id).first()


def approve_donor(db: Session, donor_id: str, approver_id: str):
    d = get_donor(db, donor_id)
    if not d:
        return None
    before = {"status": d.status.name}
    d.status = models.DonorStatus.Approved
    db.add(d)
    _create_audit(db, approver_id, "approve", "donor", d.id, before=before, after={"status": d.status.name})
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
    d = db.query(models.Donation).filter(models.Donation.id == donation_id).first()
    if not d:
        return None
    donor = db.query(models.Donor).filter(models.Donor.id == d.donor_id).first()
    if not donor or donor.status != models.DonorStatus.Approved:
        raise IntegrityError("Donor not approved", params={}, orig=None)
    if d.status != models.DonationStatus.Collected and d.status != models.DonationStatus.IntakeQuarantine:
        raise IntegrityError("Donation not in a state to accept", params={}, orig=None)
    before = {"status": d.status.name}
    d.status = models.DonationStatus.Accepted
    db.add(d)
    _create_audit(db, user_id, "accept", "donation", d.id, before=before, after={"status": d.status.name})
    db.commit()
    db.refresh(d)
    return d


def assign_donations_to_batch(db: Session, donation_ids: list, batch_code: str, user_id: str = None):
    # enforce that donations are Accepted and not already assigned
    donations = db.query(models.Donation).filter(models.Donation.id.in_(donation_ids)).all()
    if len(donations) != len(donation_ids):
        raise IntegrityError("Some donations not found", params={}, orig=None)
    for d in donations:
        if d.status != models.DonationStatus.Accepted:
            raise IntegrityError(f"Donation {d.id} not in Accepted state", params={}, orig=None)

    batch = models.Batch(batch_code=batch_code, total_volume_ml=sum(d.volume_ml for d in donations))
    db.add(batch)
    db.commit()
    db.refresh(batch)

    for d in donations:
        before = {"status": d.status.name}
        d.status = models.DonationStatus.AssignedToBatch
        db.add(d)
        _create_audit(db, user_id, "assign", "donation", d.id, before=before, after={"status": d.status.name, "batch_id": batch.id})
    _create_audit(db, user_id, "create", "batch", batch.id, before=None, after={"batch_code": batch.batch_code, "total_volume_ml": batch.total_volume_ml})
    db.commit()
    return batch


def start_pasteurisation(db: Session, batch_id: str, operator_id: str, device_id: str):
    b = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not b:
        return None
    if b.status not in [models.BatchStatus.Created, models.BatchStatus.Quarantined]:
        raise IntegrityError("Batch not in state to start pasteurisation", params={}, orig=None)
    before = {"status": b.status.name}
    b.status = models.BatchStatus.Pasteurising
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
    if b.status != models.BatchStatus.Pasteurising:
        raise IntegrityError("Batch not pasteurising", params={}, orig=None)
    rec.end_time = func.now()
    rec.log = log
    b.status = models.BatchStatus.Pasteurised
    b.status = models.BatchStatus.MicroTestPending
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
    # if positive threshold, quarantine the batch
    if threshold_flag:
        b = db.query(models.Batch).filter(models.Batch.id == s.batch_id).first()
        if b:
            before = {"status": b.status.name}
            b.status = models.BatchStatus.Quarantined
            db.add(b)
            _create_audit(db, user_id, "quarantine", "batch", b.id, before=before, after={"status": b.status.name, "reason": "micro_positive"})
    _create_audit(db, user_id, "create", "micro_result", s.id, before=None, after={"organism": organism, "threshold": threshold_flag})
    db.commit()
    db.refresh(r)
    return r


def release_batch(db: Session, batch_id: str, approver_id: str, approver2_id: str = None):
    b = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not b:
        raise IntegrityError("Batch not found", params={}, orig=None)
    if b.status != models.BatchStatus.Tested:
        raise IntegrityError("Batch not in Tested state", params={}, orig=None)
    # simple two-person verification: require approver2_id to be provided
    if not approver2_id:
        raise IntegrityError("Two-person approval required", params={}, orig=None)
    before = {"status": b.status.name}
    b.status = models.BatchStatus.Released
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
    from datetime import datetime, timedelta

    if not bottle.defrost_started_at:
        raise IntegrityError("Bottle not defrosted", params={}, orig=None)
    if datetime.utcnow() - bottle.defrost_started_at > timedelta(hours=24):
        raise IntegrityError("Defrost window exceeded", params={}, orig=None)
    # record administration
    bottle.allocated_to = baby_id
    bottle.admin_status = "Administered"
    _create_audit(db, admin_user1, "administer", "bottle", bottle.id, before=None, after={"baby_id": baby_id, "admin_by": [admin_user1, admin_user2]})
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


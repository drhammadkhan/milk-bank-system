from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from . import crud, schemas
from .database import SessionLocal, engine, Base

templates = Jinja2Templates(directory="src/app/templates")

Base.metadata.create_all(bind=engine)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/donors", response_model=schemas.DonorRead)
def create_donor(donor: schemas.DonorCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_donor(db, donor)
    except IntegrityError as e:
        db.rollback()
        if "donor_code" in str(e):
            raise HTTPException(status_code=400, detail="Donor code already exists")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/donors")
def list_donors(db: Session = Depends(get_db)):
    return crud.get_all_donors(db)


@router.get("/donors/{donor_id}", response_model=schemas.DonorRead)
def get_donor(donor_id: str, db: Session = Depends(get_db)):
    d = crud.get_donor(db, donor_id)
    if not d:
        raise HTTPException(status_code=404, detail="Donor not found")
    return d


@router.post("/donations", response_model=schemas.DonationRead)
def create_donation(donation: schemas.DonationCreate, db: Session = Depends(get_db)):
    try:
        # Verify donor exists
        donor = crud.get_donor(db, donation.donor_id)
        if not donor:
            raise HTTPException(status_code=404, detail="Donor not found")
        return crud.create_donation_record(db, donation)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/donors/{donor_id}/donations", response_model=list[schemas.DonationRead])
def get_donor_donations(donor_id: str, db: Session = Depends(get_db)):
    # Verify donor exists
    donor = crud.get_donor(db, donor_id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    return crud.get_donation_records_by_donor(db, donor_id)


@router.get("/donations", response_model=list[schemas.DonationRead])
def list_donations(db: Session = Depends(get_db)):
    return crud.get_all_donation_records(db)


@router.get("/donations/unacknowledged", response_model=list[schemas.DonationRead])
def get_unacknowledged_donations(db: Session = Depends(get_db)):
    return crud.get_unacknowledged_donations(db)


@router.post("/donations/{donation_id}/acknowledge", response_model=schemas.DonationRead)
def acknowledge_donation(donation_id: str, db: Session = Depends(get_db)):
    try:
        donation = crud.acknowledge_donation(db, donation_id)
        if not donation:
            raise HTTPException(status_code=404, detail="Donation not found")
        return donation
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/donors/{donor_id}", response_model=schemas.DonorRead)
def update_donor(donor_id: str, donor: schemas.DonorCreate, db: Session = Depends(get_db)):
    try:
        d = crud.update_donor(db, donor_id, donor)
        if not d:
            raise HTTPException(status_code=404, detail="Donor not found")
        return d
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/donors/{donor_id}/approve", response_model=schemas.DonorRead)
def approve_donor(donor_id: str, db: Session = Depends(get_db), approver_id: str = None):
    d = crud.approve_donor(db, donor_id, approver_id=approver_id)
    if not d:
        raise HTTPException(status_code=404, detail="Donor not found")
    return d


@router.post("/donations", response_model=schemas.DonationRead)
def create_donation(donation: schemas.DonationCreate, db: Session = Depends(get_db)):
    try:
        d = crud.create_donation(db, donation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not d:
        raise HTTPException(status_code=400, detail="Error creating donation")
    return d


@router.get("/donations")
def list_donations(db: Session = Depends(get_db)):
    return crud.get_all_donations(db)


@router.get("/donations/{donation_id}", response_model=schemas.DonationRead)
def get_donation(donation_id: str, db: Session = Depends(get_db)):
    d = crud.get_donation(db, donation_id)
    if not d:
        raise HTTPException(status_code=404, detail="Donation not found")
    return d


@router.post("/batches")
def create_batch(payload: dict, db: Session = Depends(get_db)):
    # payload: {"donation_ids": [..], "batch_code": ".."}
    try:
        batch = crud.assign_donations_to_batch(db, payload.get("donation_ids"), payload.get("batch_code"), user_id=payload.get("user_id"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"id": batch.id, "batch_code": batch.batch_code}


@router.get("/batches")
def list_batches(db: Session = Depends(get_db)):
    return crud.get_all_batches(db)


@router.get("/batches/{batch_id}")
def get_batch(batch_id: str, db: Session = Depends(get_db)):
    b = crud.get_batch(db, batch_id)
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")
    return b


@router.post("/donations/{donation_id}/accept")
def accept_donation(donation_id: str, db: Session = Depends(get_db), user_id: str = None):
    try:
        d = crud.accept_donation(db, donation_id, user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not d:
        raise HTTPException(status_code=404, detail="Donation not found")
    return {"id": d.id, "status": d.status.name}


@router.post("/batches/{batch_id}/pasteurise/start")
def pasteurise_start(batch_id: str, db: Session = Depends(get_db), operator_id: str = None, device_id: str = None):
    try:
        rec = crud.start_pasteurisation(db, batch_id, operator_id=operator_id, device_id=device_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"record_id": rec.id}


@router.post("/batches/{batch_id}/pasteurise/complete")
def pasteurise_complete(batch_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        rec = crud.complete_pasteurisation(db, batch_id, operator_id=payload.get("operator_id"), record_id=payload.get("record_id"), log=payload.get("log", {}))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"record_id": rec.id}


@router.post("/batches/{batch_id}/samples")
def create_sample(batch_id: str, payload: dict = None, db: Session = Depends(get_db)):
    try:
        s = crud.create_micro_sample(db, batch_id, payload.get("sample_type"), user_id=payload.get("user_id"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"sample_id": s.id, "barcode": s.sample_barcode}


@router.post("/samples/{sample_id}/results")
def post_result(sample_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        r = crud.post_micro_result(db, sample_id, payload.get("organism"), payload.get("quantitative"), payload.get("threshold_flag", False), user_id=payload.get("user_id"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"result_id": r.id}


@router.post("/batches/{batch_id}/release")
def release_batch(batch_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        b = crud.release_batch(db, batch_id, approver_id=payload.get("approver_id"), approver2_id=payload.get("approver2_id"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"batch_id": b.id, "status": b.status.name}


@router.post("/bottles/{bottle_id}/administer")
def administer_bottle(bottle_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        b = crud.administer_bottle(db, bottle_id, baby_id=payload.get("baby_id"), admin_user1=payload.get("admin_user1"), admin_user2=payload.get("admin_user2"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"bottle_id": b.id, "admin_status": b.admin_status}


@router.post("/hospitals")
def create_hospital(payload: dict, db: Session = Depends(get_db)):
    try:
        h = crud.create_hospital(db, name=payload.get("name"), fhir_endpoint=payload.get("fhir_endpoint"), contact_info=payload.get("contact_info"), created_by=payload.get("created_by"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"id": h.id, "name": h.name}


@router.post("/batches/{batch_id}/bottles")
def create_bottles(batch_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        bottles = crud.create_bottles_for_batch(db, batch_id, count=payload.get("count", 1), volume_ml=payload.get("volume_ml", 30.0), user_id=payload.get("user_id"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"bottles": [b.id for b in bottles]}


@router.get("/bottles")
def list_bottles(db: Session = Depends(get_db)):
    return crud.get_all_bottles(db)


@router.get("/bottles/{bottle_id}")
def get_bottle(bottle_id: str, db: Session = Depends(get_db)):
    b = crud.get_bottle(db, bottle_id)
    if not b:
        raise HTTPException(status_code=404, detail="Bottle not found")
    return b


@router.post("/dispatches")
def create_dispatch(payload: dict, db: Session = Depends(get_db)):
    try:
        d = crud.create_dispatch(db, bottle_ids=payload.get("bottle_ids"), hospital_id=payload.get("hospital_id"), dispatch_code=payload.get("dispatch_code"), created_by=payload.get("created_by"), shipper=payload.get("shipper"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"id": d.id, "dispatch_code": d.dispatch_code}


@router.get("/dispatches")
def list_dispatches(db: Session = Depends(get_db)):
    return crud.get_all_dispatches(db)


@router.get("/dispatches/{dispatch_id}")
def get_dispatch(dispatch_id: str, db: Session = Depends(get_db)):
    d = crud.get_dispatch(db, dispatch_id)
    if not d:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return d


@router.post("/dispatches/{dispatch_id}/scan")
def dispatch_scan(dispatch_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        item = crud.scan_dispatch_item(db, dispatch_id, barcode=payload.get("barcode"), user_id=payload.get("user_id"), scan_type=payload.get("scan_type", "out"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"item_id": item.id, "scanned_out": item.scanned_out, "scanned_in": item.scanned_in}


@router.post("/dispatches/{dispatch_id}/receive")
def dispatch_receive(dispatch_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        d = crud.receive_dispatch(db, dispatch_id, received_by=payload.get("received_by"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"id": d.id, "status": d.status.name}


@router.post("/dispatches/{dispatch_id}/fhir_send")
def dispatch_fhir_send(dispatch_id: str, payload: dict, db: Session = Depends(get_db)):
    try:
        resp = crud.send_dispatch_fhir(db, dispatch_id, fhir_endpoint=payload.get("endpoint"), auth=payload.get("auth"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status_code": resp.status_code}


@router.get("/dispatches/{dispatch_id}/manifest/json")
def dispatch_manifest_json(dispatch_id: str, db: Session = Depends(get_db)):
    try:
        m = crud.get_dispatch_manifest(db, dispatch_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return m


@router.get("/dispatches/{dispatch_id}/manifest/csv")
def dispatch_manifest_csv(dispatch_id: str, db: Session = Depends(get_db)):
    try:
        data = crud.export_dispatch_manifest_csv(db, dispatch_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return Response(content=data, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=dispatch_{dispatch_id}.csv"})


@router.get("/dispatches/{dispatch_id}/manifest/pdf")
def dispatch_manifest_pdf(dispatch_id: str, db: Session = Depends(get_db)):
    try:
        data = crud.export_dispatch_manifest_pdf(db, dispatch_id)
    except ImportError:
        raise HTTPException(status_code=501, detail="PDF generation not available on server")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return Response(content=data, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=dispatch_{dispatch_id}.pdf"})


@router.get("/ui/dispatches/{dispatch_id}/manifest")
def ui_dispatch_manifest(request: Request, dispatch_id: str, db: Session = Depends(get_db)):
    try:
        manifest = crud.get_dispatch_manifest(db, dispatch_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return templates.TemplateResponse("manifest.html", {"request": request, "manifest": manifest})
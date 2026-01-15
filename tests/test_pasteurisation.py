from src.app.database import SessionLocal
from src.app import crud


def test_pasteurisation_and_micro_gating():
    db = SessionLocal()
    # Prepare donor and donation
    donor = crud.create_donor(db, type("D", (), {"donor_code": "PX-1"}), user_id="u1")
    crud.approve_donor(db, donor.id, approver_id="u1")
    donation = crud.create_donation(db, type("Q", (), {"barcode": "PX-C1", "donor_id": donor.id, "volume_ml": 100}), user_id="u1")
    crud.accept_donation(db, donation.id, user_id="u1")

    batch = crud.assign_donations_to_batch(db, [donation.id], batch_code="PX-B1", user_id="u1")
    rec = crud.start_pasteurisation(db, batch.id, operator_id="op1", device_id="dev1")
    assert rec.id is not None

    rec2 = crud.complete_pasteurisation(db, batch.id, operator_id="op1", record_id=rec.id, log={"temp_profile": []})
    assert rec2.id == rec.id

    s = crud.create_micro_sample(db, batch.id, "post", user_id="lab1")
    r = crud.post_micro_result(db, s.id, organism="E. coli", quantitative_value="1000", threshold_flag=True, user_id="lab1")
    # batch should now be quarantined
    from src.app.models import Batch
    b = db.query(Batch).filter(Batch.id == batch.id).first()
    assert b.status.name == "Quarantined"

    # attempt to release should fail
    try:
        crud.release_batch(db, batch.id, approver_id="sp1", approver2_id="sp2")
        assert False, "Release should have failed because batch is Quarantined"
    except Exception:
        pass

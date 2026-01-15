import pytest
from fastapi.testclient import TestClient
from src.app.main import app
from src.app.database import SessionLocal
from src.app import crud, models

client = TestClient(app)


def test_cannot_create_donation_for_unapproved_donor():
    # create donor but don't approve
    r = client.post("/api/donors", json={"donor_code": "TEST-D-1"})
    assert r.status_code == 200
    donor = r.json()

    with pytest.raises(Exception):
        # should raise IntegrityError inside create_donation
        crud.create_donation(SessionLocal(), type("O", (), {"barcode": "B-1", "donor_id": donor["id"], "volume_ml": 50}))


def test_assign_blocked_if_donation_not_accepted():
    db = SessionLocal()
    # prepare donor and donation
    donor = crud.create_donor(db, type("D", (), {"donor_code": "A-2"}), user_id="u1")
    # approve donor first
    crud.approve_donor(db, donor.id, approver_id="u1")
    donation = crud.create_donation(db, type("X", (), {"barcode": "C-XX", "donor_id": donor.id, "volume_ml": 80}), user_id="u1")

    # donation status is Collected (default), so attempting to assign should fail
    with pytest.raises(Exception):
        crud.assign_donations_to_batch(db, [donation.id], batch_code="B-001", user_id="u1")


def test_accept_then_assign_flow():
    db2 = SessionLocal()
    donor = crud.create_donor(db2, type("D2", (), {"donor_code": "A-3"}), user_id="u2")
    crud.approve_donor(db2, donor.id, approver_id="u2")
    donation = crud.create_donation(db2, type("Z", (), {"barcode": "C-YY", "donor_id": donor.id, "volume_ml": 60}), user_id="u2")
    # accept the donation
    d_accepted = crud.accept_donation(db2, donation.id, user_id="u2")
    assert d_accepted.status.name == "Accepted"

    # now assigning should succeed
    batch = crud.assign_donations_to_batch(db2, [donation.id], batch_code="B-002", user_id="u2")
    assert batch.batch_code == "B-002"

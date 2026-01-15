from src.app.database import SessionLocal
from src.app import crud
from src.app.models import BatchStatus


def test_dispatch_flow_and_fhir(monkeypatch):
    db = SessionLocal()
    # setup hospital
    hosp = crud.create_hospital(db, name="St. Mary's", fhir_endpoint="https://fhir.example.org/endpoint", created_by="u1")

    # create donor and donation, accept, assign to batch and mark batch as Released
    d = crud.create_donor(db, type("D", (), {"donor_code": "DX-1"}), user_id="u1")
    crud.approve_donor(db, d.id, approver_id="u1")
    don = crud.create_donation(db, type("C", (), {"barcode": "C-DF1", "donor_id": d.id, "volume_ml": 100}), user_id="u1")
    crud.accept_donation(db, don.id, user_id="u1")
    batch = crud.assign_donations_to_batch(db, [don.id], batch_code="DISP-B1", user_id="u1")
    # directly set to Released for test purpose
    batch.status = BatchStatus.Released
    db.add(batch)
    db.commit()

    bottles = crud.create_bottles_for_batch(db, batch.id, count=2, volume_ml=50, user_id="u1")

    # attempt dispatch creation should succeed
    disp = crud.create_dispatch(db, [b.id for b in bottles], hosp.id, dispatch_code="DSP-001", created_by="u1")
    assert disp.dispatch_code == "DSP-001"

    # scanning out
    item = crud.scan_dispatch_item(db, disp.id, bottles[0].barcode, user_id="ship1", scan_type="out")
    assert item.scanned_out is True

    # receiving at hospital
    d2 = crud.receive_dispatch(db, disp.id, received_by="rec1")
    assert d2.status.name == "Received"

    # mock requests.post for FHIR send
    class DummyResp:
        status_code = 200

    def fake_post(url, json, headers):
        assert url == "https://fhir.example.org/endpoint"
        assert json["resourceType"] == "Bundle"
        return DummyResp()

    monkeypatch.setattr("requests.post", fake_post)
    resp = crud.send_dispatch_fhir(db, disp.id)
    assert resp.status_code == 200

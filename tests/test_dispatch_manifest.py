import importlib
from fastapi.testclient import TestClient
from src.app.main import app
from src.app.database import SessionLocal
from src.app import crud
from src.app.models import BatchStatus

client = TestClient(app)


def test_manifest_json_and_csv():
    db = SessionLocal()
    # setup hospital
    hosp = crud.create_hospital(db, name="General", fhir_endpoint=None, created_by="u1")

    # create donor/donation/batch
    d = crud.create_donor(db, type("D", (), {"donor_code": "MX-1"}), user_id="u1")
    crud.approve_donor(db, d.id, approver_id="u1")
    don = crud.create_donation(db, type("C", (), {"barcode": "M-C1", "donor_id": d.id, "volume_ml": 100}), user_id="u1")
    crud.accept_donation(db, don.id, user_id="u1")
    batch = crud.assign_donations_to_batch(db, [don.id], batch_code="MAN-B1", user_id="u1")
    batch.status = BatchStatus.Released
    db.add(batch)
    db.commit()

    bottles = crud.create_bottles_for_batch(db, batch.id, count=2, volume_ml=50, user_id="u1")
    disp = crud.create_dispatch(db, [b.id for b in bottles], hosp.id, dispatch_code="MAN-001", created_by="u1")

    # test JSON manifest endpoint
    r = client.get(f"/api/dispatches/{disp.id}/manifest/json")
    assert r.status_code == 200
    data = r.json()
    assert data["dispatch_code"] == "MAN-001"
    assert len(data["items"]) == 2

    # test CSV manifest endpoint
    r2 = client.get(f"/api/dispatches/{disp.id}/manifest/csv")
    assert r2.status_code == 200
    assert "text/csv" in r2.headers["content-type"]
    text = r2.content.decode("utf-8")
    assert "dispatch_code" in text or "MAN-001" in text

    # test PDF manifest endpoint only if reportlab is available
    if importlib.util.find_spec("reportlab"):
        r3 = client.get(f"/api/dispatches/{disp.id}/manifest/pdf")
        assert r3.status_code == 200
        assert r3.headers["content-type"] == "application/pdf"
        assert len(r3.content) > 100
    else:
        # ensure endpoint returns 501
        r3 = client.get(f"/api/dispatches/{disp.id}/manifest/pdf")
        assert r3.status_code == 501

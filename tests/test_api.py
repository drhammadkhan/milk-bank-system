from fastapi.testclient import TestClient
from src.app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_donor_and_donation():
    r = client.post("/api/donors", json={"donor_code": "D-001"})
    assert r.status_code == 200
    donor = r.json()
    assert donor["donor_code"] == "D-001"

    # must approve donor first
    r_app = client.post(f"/api/donors/{donor['id']}/approve", params={"approver_id": "admin"})
    assert r_app.status_code == 200

    r2 = client.post("/api/donations", json={"barcode": "C-001", "donor_id": donor["id"], "volume_ml": 100})
    assert r2.status_code == 200
    d = r2.json()
    assert d["barcode"] == "C-001"

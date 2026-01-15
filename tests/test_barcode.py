from src.app.barcode import generate_code128_barcode, generate_qr, gs1_payload_for_batch


def test_generate_code128():
    data = generate_code128_barcode("TEST-123")
    assert isinstance(data, (bytes, bytearray))
    assert len(data) > 0


def test_generate_qr():
    data = generate_qr("https://example.org/test")
    assert isinstance(data, (bytes, bytearray))
    assert len(data) > 0


def test_gs1_payload():
    p = gs1_payload_for_batch("B-1", facility_id="F1")
    assert p == "F1|B-1"

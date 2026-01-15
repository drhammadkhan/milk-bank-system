import uuid
import io
from barcode import Code128
from barcode.writer import ImageWriter
import qrcode


def gen_uuid():
    return str(uuid.uuid4())


def generate_code128_barcode(value: str) -> bytes:
    """Return PNG bytes for a Code128 barcode."""
    rv = io.BytesIO()
    Code128(value, writer=ImageWriter()).write(rv)
    return rv.getvalue()


def generate_qr(value: str) -> bytes:
    img = qrcode.make(value)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


def gs1_payload_for_batch(batch_code: str, facility_id: str = None):
    # Minimal GS1-style payload; real GS1 requires application identifiers (AIs)
    payload = f"{batch_code}"
    if facility_id:
        payload = f"{facility_id}|{payload}"
    return payload

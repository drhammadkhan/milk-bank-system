from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DonorCreate(BaseModel):
    donor_code: str


class DonorRead(BaseModel):
    id: str
    donor_code: str
    status: str
    created_at: Optional[datetime]

    class Config:
        orm_mode = True


class DonationCreate(BaseModel):
    barcode: str
    donor_id: str
    volume_ml: float


class DonationRead(BaseModel):
    id: str
    barcode: str
    donor_id: str
    volume_ml: float
    status: str

    class Config:
        orm_mode = True


class HospitalCreate(BaseModel):
    name: str
    fhir_endpoint: Optional[str] = None
    contact_info: Optional[dict] = None


class HospitalRead(BaseModel):
    id: str
    name: str
    fhir_endpoint: Optional[str]

    class Config:
        orm_mode = True


class DispatchCreate(BaseModel):
    bottle_ids: List[str]
    hospital_id: str
    dispatch_code: str
    created_by: Optional[str]
    shipper: Optional[str]


class DispatchRead(BaseModel):
    id: str
    dispatch_code: str
    hospital_id: str
    status: str

    class Config:
        orm_mode = True


class DispatchScan(BaseModel):
    barcode: str
    user_id: Optional[str]
    scan_type: Optional[str] = "out"

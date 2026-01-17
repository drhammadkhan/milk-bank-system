from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DonorCreate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    postcode: Optional[str] = None
    infectious_diseases: Optional[bool] = False
    hepatitis_history: Optional[bool] = False
    hepatitis_b_surface_antigen: Optional[bool] = False
    hepatitis_b_core_antigen: Optional[bool] = False
    hepatitis_c_antibody: Optional[bool] = False
    hiv_antibody: Optional[bool] = False
    hltv_antibody: Optional[bool] = False
    syphilis_test: Optional[bool] = False
    medical_history_notes: Optional[str] = None


class DonorRead(BaseModel):
    id: str
    donor_code: Optional[str]
    status: str
    created_at: Optional[datetime]
    first_name: Optional[str]
    last_name: Optional[str]
    date_of_birth: Optional[datetime]
    phone_number: Optional[str]
    email: Optional[str]
    address: Optional[str]
    postcode: Optional[str]
    infectious_diseases: Optional[bool]
    hepatitis_history: Optional[bool]
    hepatitis_b_surface_antigen: Optional[bool]
    hepatitis_b_core_antigen: Optional[bool]
    hepatitis_c_antibody: Optional[bool]
    hiv_antibody: Optional[bool]
    hltv_antibody: Optional[bool]
    syphilis_test: Optional[bool]
    medical_history_notes: Optional[str]

    class Config:
        from_attributes = True


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
        from_attributes = True


class HospitalCreate(BaseModel):
    name: str
    fhir_endpoint: Optional[str] = None
    contact_info: Optional[dict] = None


class HospitalRead(BaseModel):
    id: str
    name: str
    fhir_endpoint: Optional[str]

    class Config:
        from_attributes = True


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
        from_attributes = True


class DispatchScan(BaseModel):
    barcode: str
    user_id: Optional[str]
    scan_type: Optional[str] = "out"

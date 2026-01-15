from src.app.models import Donor, Donation, DonorStatus, DonationStatus
from src.app.state_machines import DonorStateMachine, DonationStateMachine


def test_donor_state_transitions():
    d = Donor(donor_code="X-1", status=DonorStatus.Applied)
    sm = DonorStateMachine(d)
    assert sm.state == DonorStatus.Applied.value
    sm.to_screening()
    assert sm.state == DonorStatus.Screening.value
    sm.approve()
    assert sm.state == DonorStatus.Approved.value


def test_donation_state_transitions():
    dn = Donation(barcode="B-1", donor_id="D-1", volume_ml=50.0, status=DonationStatus.Collected)
    sm = DonationStateMachine(dn)
    assert sm.state == DonationStatus.Collected.value
    sm.intake()
    assert sm.state == DonationStatus.IntakeQuarantine.value
    sm.accept()
    assert sm.state == DonationStatus.Accepted.value
    sm.assign()
    assert sm.state == DonationStatus.AssignedToBatch.value

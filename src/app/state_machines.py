from transitions import Machine
from .models import DonorStatus, DonationStatus, BatchStatus, Bottle


class DonorStateMachine:
    states = [s.value for s in DonorStatus]

    def __init__(self, donor):
        self.donor = donor
        self.machine = Machine(model=self, states=DonorStateMachine.states, initial=donor.status.value)
        self.machine.add_transition('to_screening', DonorStatus.Applied.value, DonorStatus.Screening.value)
        self.machine.add_transition('approve', DonorStatus.Screening.value, DonorStatus.Approved.value)
        self.machine.add_transition('suspend', '*', DonorStatus.Suspended.value)
        self.machine.add_transition('exclude', '*', DonorStatus.Excluded.value)
        self.machine.add_transition('close', '*', DonorStatus.Closed.value)


class DonationStateMachine:
    states = [s.value for s in DonationStatus]

    def __init__(self, donation):
        self.donation = donation
        self.machine = Machine(model=self, states=DonationStateMachine.states, initial=donation.status.value)
        # define transitions matching spec: only accept if donor approved
        self.machine.add_transition('intake', DonationStatus.Collected.value, DonationStatus.IntakeQuarantine.value)
        self.machine.add_transition('accept', [DonationStatus.Collected.value, DonationStatus.IntakeQuarantine.value], DonationStatus.Accepted.value)
        self.machine.add_transition('reject', '*', DonationStatus.Rejected.value)
        self.machine.add_transition('assign', DonationStatus.Accepted.value, DonationStatus.AssignedToBatch.value)
        self.machine.add_transition('process', DonationStatus.AssignedToBatch.value, DonationStatus.Processed.value)
        self.machine.add_transition('dispose', '*', DonationStatus.Disposed.value)


# Additional state machines (Batch, Bottle) can be added similarly

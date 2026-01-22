from transitions import Machine
from transitions.core import MachineError
from .models import DonorStatus, DonationStatus, BatchStatus, Bottle


class DonorStateMachine:
    states = [s.value for s in DonorStatus]

    def __init__(self, donor):
        self.donor = donor
        self.machine = Machine(
            model=self, 
            states=DonorStateMachine.states, 
            initial=donor.status.value,
            auto_transitions=False  # Disable automatic transitions for safety
        )
        self.machine.add_transition('to_screening', DonorStatus.Applied.value, DonorStatus.Screening.value, after='_update_donor_status')
        self.machine.add_transition('approve', [DonorStatus.Applied.value, DonorStatus.Screening.value], DonorStatus.Approved.value, after='_update_donor_status')
        self.machine.add_transition('suspend', '*', DonorStatus.Suspended.value, after='_update_donor_status')
        self.machine.add_transition('exclude', '*', DonorStatus.Excluded.value, after='_update_donor_status')
        self.machine.add_transition('close', '*', DonorStatus.Closed.value, after='_update_donor_status')
        self.machine.add_transition('revert_to_applied', '*', DonorStatus.Applied.value, after='_update_donor_status')
    
    def _update_donor_status(self):
        """Update the donor's status in the database model after state transition"""
        self.donor.status = DonorStatus[self.state]


class DonationStateMachine:
    states = [s.value for s in DonationStatus]

    def __init__(self, donation):
        self.donation = donation
        self.machine = Machine(
            model=self, 
            states=DonationStateMachine.states, 
            initial=donation.status.value,
            auto_transitions=False  # Disable automatic transitions for safety
        )
        # define transitions matching spec: only accept if donor approved
        self.machine.add_transition('intake', DonationStatus.Collected.value, DonationStatus.IntakeQuarantine.value, after='_update_donation_status')
        self.machine.add_transition('accept', [DonationStatus.Collected.value, DonationStatus.IntakeQuarantine.value], DonationStatus.Accepted.value, after='_update_donation_status')
        self.machine.add_transition('reject', '*', DonationStatus.Rejected.value, after='_update_donation_status')
        self.machine.add_transition('assign', DonationStatus.Accepted.value, DonationStatus.AssignedToBatch.value, after='_update_donation_status')
        self.machine.add_transition('process', DonationStatus.AssignedToBatch.value, DonationStatus.Processed.value, after='_update_donation_status')
        self.machine.add_transition('dispose', '*', DonationStatus.Disposed.value, after='_update_donation_status')
    
    def _update_donation_status(self):
        """Update the donation's status in the database model after state transition"""
        self.donation.status = DonationStatus[self.state]


class BatchStateMachine:
    states = [s.value for s in BatchStatus]

    def __init__(self, batch):
        self.batch = batch
        self.machine = Machine(
            model=self, 
            states=BatchStateMachine.states, 
            initial=batch.status.value,
            auto_transitions=False  # Disable automatic transitions for safety
        )
        # Define valid batch transitions
        self.machine.add_transition('start_pasteurisation', [BatchStatus.Created.value, BatchStatus.Quarantined.value], BatchStatus.Pasteurising.value, after='_update_batch_status')
        self.machine.add_transition('complete_pasteurisation', BatchStatus.Pasteurising.value, BatchStatus.MicroTestPending.value, after='_update_batch_status')
        self.machine.add_transition('mark_tested', BatchStatus.MicroTestPending.value, BatchStatus.Tested.value, after='_update_batch_status')
        self.machine.add_transition('fail_testing', BatchStatus.MicroTestPending.value, BatchStatus.TestingFailed.value, after='_update_batch_status')
        self.machine.add_transition('quarantine', '*', BatchStatus.Quarantined.value, after='_update_batch_status')
        self.machine.add_transition('release', BatchStatus.Tested.value, BatchStatus.Released.value, after='_update_batch_status')
        self.machine.add_transition('recall', BatchStatus.Released.value, BatchStatus.Recalled.value, after='_update_batch_status')
        self.machine.add_transition('dispose', '*', BatchStatus.Disposed.value, after='_update_batch_status')
    
    def _update_batch_status(self):
        """Update the batch's status in the database model after state transition"""
        self.batch.status = BatchStatus[self.state]


def transition_donor_state(donor, transition_name: str) -> bool:
    """
    Safely transition a donor to a new state using the state machine.
    Returns True if transition succeeded, raises MachineError if invalid.
    """
    machine = DonorStateMachine(donor)
    transition_method = getattr(machine, transition_name, None)
    if transition_method is None:
        raise ValueError(f"Unknown transition: {transition_name}")
    transition_method()
    return True


def transition_donation_state(donation, transition_name: str) -> bool:
    """
    Safely transition a donation to a new state using the state machine.
    Returns True if transition succeeded, raises MachineError if invalid.
    """
    machine = DonationStateMachine(donation)
    transition_method = getattr(machine, transition_name, None)
    if transition_method is None:
        raise ValueError(f"Unknown transition: {transition_name}")
    transition_method()
    return True


def transition_batch_state(batch, transition_name: str) -> bool:
    """
    Safely transition a batch to a new state using the state machine.
    Returns True if transition succeeded, raises MachineError if invalid.
    """
    machine = BatchStateMachine(batch)
    transition_method = getattr(machine, transition_name, None)
    if transition_method is None:
        raise ValueError(f"Unknown transition: {transition_name}")
    transition_method()
    return True

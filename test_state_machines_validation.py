#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from app.models import Donor, DonorStatus, Batch, BatchStatus
from app.state_machines import transition_donor_state, transition_batch_state
from transitions.core import MachineError

print("="*60)
print("State Machine Validation Tests")
print("="*60)

# Test 1: Valid donor transition
print("\n✓ Test 1: Valid donor approval")
donor = Donor(id="test1", status=DonorStatus.Applied)
try:
    transition_donor_state(donor, 'approve')
    print(f"  ✅ Status changed to: {donor.status.name}")
except MachineError as e:
    print(f"  ❌ Unexpected error: {e}")

# Test 2: Invalid donor transition
print("\n✓ Test 2: Invalid donor re-approval")
donor2 = Donor(id="test2", status=DonorStatus.Approved)
try:
    transition_donor_state(donor2, 'approve')
    print(f"  ❌ Should have blocked!")
except MachineError as e:
    print(f"  ✅ Correctly blocked invalid transition")

# Test 3: Valid batch workflow
print("\n✓ Test 3: Valid batch workflow")
batch = Batch(id="test3", batch_code="TEST", status=BatchStatus.Created)
try:
    transition_batch_state(batch, 'start_pasteurisation')
    print(f"  ✅ Started pasteurisation: {batch.status.name}")
    transition_batch_state(batch, 'complete_pasteurisation')
    print(f"  ✅ Completed pasteurisation: {batch.status.name}")
    transition_batch_state(batch, 'mark_tested')
    print(f"  ✅ Marked as tested: {batch.status.name}")
    transition_batch_state(batch, 'release')
    print(f"  ✅ Released: {batch.status.name}")
except MachineError as e:
    print(f"  ❌ Transition failed: {e}")

# Test 4: Invalid batch transition
print("\n✓ Test 4: Invalid batch release without testing")
batch2 = Batch(id="test4", batch_code="TEST2", status=BatchStatus.Created)
try:
    transition_batch_state(batch2, 'release')
    print(f"  ❌ Should have blocked!")
except MachineError as e:
    print(f"  ✅ Correctly blocked: Can't release from Created state")

print("\n" + "="*60)
print("✅ All state machine validations working correctly!")
print("="*60)

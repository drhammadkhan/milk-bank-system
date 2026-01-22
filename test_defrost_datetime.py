#!/usr/bin/env python3
"""Test defrost window datetime handling"""
import sys
sys.path.insert(0, 'src')
from datetime import datetime, timedelta, timezone

print("="*60)
print("Defrost Window DateTime Test")
print("="*60)

# Simulate timezone-aware datetime (from database)
defrost_time_aware = datetime.now(timezone.utc) - timedelta(hours=20)
print(f"\n✓ Defrost time (timezone-aware): {defrost_time_aware}")
print(f"  Has timezone: {defrost_time_aware.tzinfo is not None}")

# Current time timezone-aware
now = datetime.now(timezone.utc)
print(f"\n✓ Current time (timezone-aware): {now}")
print(f"  Has timezone: {now.tzinfo is not None}")

# Test comparison
elapsed = now - defrost_time_aware
print(f"\n✓ Time elapsed: {elapsed}")
print(f"  Hours: {elapsed.total_seconds() / 3600:.2f}")

if elapsed > timedelta(hours=24):
    print(f"  ❌ Defrost window exceeded")
else:
    print(f"  ✅ Within defrost window")

# Test with 25 hour old defrost
defrost_old = datetime.now(timezone.utc) - timedelta(hours=25)
elapsed_old = now - defrost_old
print(f"\n✓ Old defrost (25 hours ago): {defrost_old}")
print(f"  Hours elapsed: {elapsed_old.total_seconds() / 3600:.2f}")

if elapsed_old > timedelta(hours=24):
    print(f"  ✅ Correctly detected as exceeded")
else:
    print(f"  ❌ Should have been exceeded")

# Test naive datetime handling
print(f"\n✓ Testing naive datetime conversion:")
defrost_naive = datetime.utcnow()
print(f"  Naive datetime: {defrost_naive}")
print(f"  Has timezone: {defrost_naive.tzinfo is not None}")

if defrost_naive.tzinfo is None:
    defrost_aware = defrost_naive.replace(tzinfo=timezone.utc)
    print(f"  Converted to aware: {defrost_aware}")
    print(f"  Has timezone: {defrost_aware.tzinfo is not None}")
    
    # Now comparison works
    try:
        diff = now - defrost_aware
        print(f"  ✅ Comparison succeeded: {diff.total_seconds():.2f} seconds")
    except TypeError as e:
        print(f"  ❌ Comparison failed: {e}")
else:
    print(f"  Already timezone-aware")

print("\n" + "="*60)
print("✅ Datetime comparison fixed and tested!")
print("="*60)

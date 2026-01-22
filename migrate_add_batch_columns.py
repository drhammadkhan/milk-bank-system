#!/usr/bin/env python3
"""
Migration script to add missing columns to batches table.
Run this once to update your existing database schema.
"""
import sqlite3
import os

# Find the database file
possible_paths = [
    'milkbank.db',
    'src/milkbank.db',
    '/app/data/milkbank.db',
]

db_path = None
for path in possible_paths:
    if os.path.exists(path):
        db_path = path
        break

if not db_path:
    print("❌ Database file not found. Creating new one will have correct schema.")
    print("   If using Docker, the database will be created correctly on first run.")
    exit(0)

print(f"📊 Found database at: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check current schema
cursor.execute("PRAGMA table_info(batches)")
columns = {row[1] for row in cursor.fetchall()}
print(f"Current columns in batches table: {columns}")

migrations_needed = []

# Check for batch_date column
if 'batch_date' not in columns:
    migrations_needed.append("ALTER TABLE batches ADD COLUMN batch_date TIMESTAMP")
    
# Check for hospital_number column  
if 'hospital_number' not in columns:
    migrations_needed.append("ALTER TABLE batches ADD COLUMN hospital_number VARCHAR")
    
# Check for number_of_bottles column
if 'number_of_bottles' not in columns:
    migrations_needed.append("ALTER TABLE batches ADD COLUMN number_of_bottles INTEGER")
    
# Check for donation_ids column
if 'donation_ids' not in columns:
    migrations_needed.append("ALTER TABLE batches ADD COLUMN donation_ids JSON")

if not migrations_needed:
    print("✅ Database schema is up to date!")
    conn.close()
    exit(0)

print(f"\n🔧 Applying {len(migrations_needed)} migration(s)...")

try:
    for migration in migrations_needed:
        print(f"   Running: {migration}")
        cursor.execute(migration)
    
    conn.commit()
    print("\n✅ Database migration completed successfully!")
    
    # Verify
    cursor.execute("PRAGMA table_info(batches)")
    new_columns = {row[1] for row in cursor.fetchall()}
    print(f"✅ Updated columns: {new_columns}")
    
except Exception as e:
    conn.rollback()
    print(f"\n❌ Migration failed: {e}")
    exit(1)
finally:
    conn.close()

#!/usr/bin/env python3
"""
Migration script to add status and volume_ml fields to donation_records table
and drop the old donations table.
"""

import sqlite3

def migrate():
    conn = sqlite3.connect('/app/data/milkbank.db')
    cursor = conn.cursor()
    
    try:
        # Add status column to donation_records (default to 'Accepted' for existing records)
        print("Adding status column to donation_records...")
        cursor.execute("""
            ALTER TABLE donation_records 
            ADD COLUMN status TEXT NOT NULL DEFAULT 'Accepted'
        """)
        
        # Add volume_ml column to donation_records (default to 0.0 for existing records)
        print("Adding volume_ml column to donation_records...")
        cursor.execute("""
            ALTER TABLE donation_records 
            ADD COLUMN volume_ml REAL NOT NULL DEFAULT 0.0
        """)
        
        # Drop the old donations table (no longer needed)
        print("Dropping old donations table...")
        cursor.execute("DROP TABLE IF EXISTS donations")
        
        conn.commit()
        print("✅ Migration completed successfully!")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print(f"⚠️  Column already exists: {e}")
        else:
            print(f"❌ Error: {e}")
            conn.rollback()
            raise
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

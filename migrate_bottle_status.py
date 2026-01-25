"""
Migration script to add bottle status and related columns
"""
import sqlite3

DB_PATH = "data/milkbank.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Add status column with default 'Available'
        cursor.execute("ALTER TABLE bottles ADD COLUMN status TEXT DEFAULT 'Available'")
        print("✓ Added status column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("✓ status column already exists")
        else:
            raise
    
    try:
        # Add allocated_at column
        cursor.execute("ALTER TABLE bottles ADD COLUMN allocated_at TIMESTAMP")
        print("✓ Added allocated_at column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("✓ allocated_at column already exists")
        else:
            raise
    
    try:
        # Add administered_at column
        cursor.execute("ALTER TABLE bottles ADD COLUMN administered_at TIMESTAMP")
        print("✓ Added administered_at column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("✓ administered_at column already exists")
        else:
            raise
    
    try:
        # Add administered_by column
        cursor.execute("ALTER TABLE bottles ADD COLUMN administered_by TEXT")
        print("✓ Added administered_by column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("✓ administered_by column already exists")
        else:
            raise
    
    try:
        # Add patient_id column
        cursor.execute("ALTER TABLE bottles ADD COLUMN patient_id TEXT")
        print("✓ Added patient_id column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("✓ patient_id column already exists")
        else:
            raise
    
    # Update existing bottles to have 'Available' status if they're from released batches
    cursor.execute("""
        UPDATE bottles 
        SET status = 'Available' 
        WHERE bottles.batch_id IN (
            SELECT id FROM batches WHERE status = 'Released'
        ) AND (status IS NULL OR status = '')
    """)
    updated_count = cursor.rowcount
    print(f"✓ Updated {updated_count} existing bottles to 'Available' status")
    
    conn.commit()
    conn.close()
    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate()

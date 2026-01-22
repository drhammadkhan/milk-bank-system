import sqlite3

db_path = '/app/data/milkbank.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get current columns
cursor.execute('PRAGMA table_info(batches)')
columns = {row[1] for row in cursor.fetchall()}
print('Current columns:', columns)

migrations = []
if 'batch_date' not in columns:
    migrations.append('ALTER TABLE batches ADD COLUMN batch_date TIMESTAMP')
if 'hospital_number' not in columns:
    migrations.append('ALTER TABLE batches ADD COLUMN hospital_number VARCHAR')
if 'number_of_bottles' not in columns:
    migrations.append('ALTER TABLE batches ADD COLUMN number_of_bottles INTEGER')
if 'donation_ids' not in columns:
    migrations.append('ALTER TABLE batches ADD COLUMN donation_ids JSON')

if migrations:
    print(f'Applying {len(migrations)} migrations...')
    for sql in migrations:
        print(f'  {sql}')
        cursor.execute(sql)
    conn.commit()
    print('Migration complete!')
else:
    print('Schema already up to date')

conn.close()

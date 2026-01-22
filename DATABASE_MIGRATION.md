# Database Migration Guide

## Problem
The `batches` table is missing columns (`batch_date`, `hospital_number`, `number_of_bottles`, `donation_ids`) that were added to the model but the database wasn't updated.

## Solution Options

### Option 1: Recreate Database (Recommended for Development)

If you're using **Docker Compose**:
```bash
# Stop containers
docker-compose down

# Remove the database volume
docker volume rm milk-bank-system_milkbank_data

# Start fresh
docker-compose up
```

### Option 2: If Running Locally

```bash
# Find and remove the database file
rm milkbank.db

# Restart your FastAPI server
PYTHONPATH=src uvicorn src.app.main:app --reload
```

### Option 3: Manual Migration (If you have data to preserve)

If you have important data in the database:

```bash
# Run the migration script
python3 migrate_add_batch_columns.py
```

But first, you need to find where your database is:
- Check Docker volumes: `docker volume inspect milk-bank-system_milkbank_data`
- Or if running locally, it should be in the directory where you start the server

### After Migration

The new schema will have:
- `batch_date` - Date when batch was created/processed
- `hospital_number` - Hospital identifier 
- `number_of_bottles` - Count of bottles in batch
- `donation_ids` - JSON array of donation IDs in the batch

All these columns are nullable, so existing batches will work fine with NULL values.

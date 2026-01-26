# Milk Bank Tracker - Ubuntu Linux Installation Guide

This guide will help you install and run the Milk Bank Tracker application on Ubuntu Linux.

## System Requirements

- Ubuntu 20.04 LTS or newer
- At least 2GB RAM
- 1GB free disk space
- Internet connection for downloading dependencies

## Installation Steps

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Python 3.9 or Higher

```bash
# Install Python and required system packages
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential

# Verify Python version (should be 3.9 or higher)
python3 --version
```

### 3. Install Node.js and npm

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. Install CUPS for Printer Support (Optional)

If you plan to use a Zebra label printer:

```bash
sudo apt install -y cups cups-client

# Start CUPS service
sudo systemctl start cups
sudo systemctl enable cups

# Add your user to the lp group for printer access
sudo usermod -a -G lp $USER

# Log out and back in for group changes to take effect
```

### 5. Install Git (if not already installed)

```bash
sudo apt install -y git
```

### 6. Clone or Extract the Project

If using git:
```bash
cd ~
git clone <repository-url> milk-bank-system
cd milk-bank-system
```

Or if you have the project files:
```bash
cd /path/to/milk-bank-system
```

### 7. Set Up Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 8. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 9. Create Data Directory

```bash
mkdir -p data
```

### 10. Initialize Database (First Time Only)

The database will be created automatically when you first start the backend. If you have an existing database file, place it in the `data/` directory as `milkbank.db`.

### 11. Configure Printer (Optional)

If using a USB Zebra printer:

```bash
# List available printers
lpstat -p -d

# Test printer (replace PRINTER_NAME with your printer name)
echo "Test" | lpr -P PRINTER_NAME
```

## Running the Application

### Option 1: Use the Startup Script (Recommended)

```bash
# Make the script executable (first time only)
chmod +x start-linux.sh stop-linux.sh

# Start the application
./start-linux.sh
```

The application will start both servers:
- Backend API: http://localhost:8000
- Frontend UI: http://localhost:3000

To stop the application:
```bash
./stop-linux.sh
```

### Option 2: Manual Startup

Start the backend:
```bash
source .venv/bin/activate
DATABASE_URL="sqlite:///./data/milkbank.db" uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --reload
```

In a separate terminal, start the frontend:
```bash
cd frontend
npm run dev
```

## Accessing the Application

Once both servers are running:

1. Open your web browser
2. Navigate to: http://localhost:3000
3. The application should load and connect to the backend automatically

## View Logs

If you used the startup script, logs are saved in the `logs/` directory:

```bash
# View backend logs
tail -f logs/backend.log

# View frontend logs
tail -f logs/frontend.log
```

## Troubleshooting

### Port Already in Use

If port 8000 or 3000 is already in use:

```bash
# Find and kill process using port 8000
sudo lsof -ti:8000 | xargs kill -9

# Find and kill process using port 3000
sudo lsof -ti:3000 | xargs kill -9
```

### Permission Denied for Printer

If you get permission errors when printing:

```bash
# Add your user to the lp group
sudo usermod -a -G lp $USER

# Log out and log back in
```

### Python Virtual Environment Issues

If you have issues with the virtual environment:

```bash
# Remove and recreate
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Database Errors

If you encounter database errors:

```bash
# Backup existing database
mv data/milkbank.db data/milkbank.db.backup

# Start fresh (database will be created automatically)
./start-linux.sh
```

## Updating the Application

To update to a new version:

```bash
# Stop the application
./stop-linux.sh

# Pull latest changes (if using git)
git pull

# Update Python dependencies
source .venv/bin/activate
pip install -r requirements.txt

# Update frontend dependencies
cd frontend
npm install
cd ..

# Restart the application
./start-linux.sh
```

## Running as a System Service (Optional)

To run the application automatically on system startup, you can create a systemd service:

### Create Backend Service

```bash
sudo nano /etc/systemd/system/milkbank-backend.service
```

Add this content (adjust paths as needed):

```ini
[Unit]
Description=Milk Bank Tracker Backend
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/milk-bank-system
Environment="DATABASE_URL=sqlite:///./data/milkbank.db"
ExecStart=/home/YOUR_USERNAME/milk-bank-system/.venv/bin/uvicorn src.app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### Create Frontend Service

```bash
sudo nano /etc/systemd/system/milkbank-frontend.service
```

Add this content (adjust paths as needed):

```ini
[Unit]
Description=Milk Bank Tracker Frontend
After=network.target milkbank-backend.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/milk-bank-system/frontend
ExecStart=/usr/bin/npm run dev
Restart=always

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable milkbank-backend
sudo systemctl enable milkbank-frontend

# Start services
sudo systemctl start milkbank-backend
sudo systemctl start milkbank-frontend

# Check status
sudo systemctl status milkbank-backend
sudo systemctl status milkbank-frontend
```

## Firewall Configuration

If you need to access the application from other computers on your network:

```bash
# Allow ports through firewall
sudo ufw allow 8000/tcp
sudo ufw allow 3000/tcp
sudo ufw reload
```

## Support

For issues or questions:
- Check the logs in the `logs/` directory
- Review the troubleshooting section above
- Ensure all dependencies are properly installed

## Version Information

Current Version: 1.1.0
Last Updated: 26 January 2026

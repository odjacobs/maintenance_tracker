#!/bin/sh
# Date: June 2022
# Author: odjacobs
# Description: This script performs the following tasks:
# 1. Copies the executable and its necessary files to the /opt/maintenance_tracker/ directory.
# 2. Allows the executable to bind to port 80.
# 3. Creates a systemd service file for the executable.
# This script needs to be run as root or with sudo.

# Copy the executable to the /opt/maintenance_tracker/ directory.
mkdir -p /opt/maintenance_tracker/
cp -r * /opt/maintenance_tracker/

# Allow the executable to bind to port 80.
setcap CAP_NET_BIND_SERVICE=+eip /opt/maintenance_tracker/maintenance_tracker

# Create a systemd service file for the executable.
echo "[Unit]
Description=Maintenance Tracker

[Service]
ExecStartPre=/bin/sleep 10
WorkingDirectory=/opt/maintenance_tracker/
ExecStart=/opt/maintenance_tracker/maintenance_tracker

[Install]
WantedBy=multi-user.target" > /etc/systemd/system/maintenance_tracker.service

# Enable the service.
systemctl enable maintenance_tracker.service

# Start the executable with the s flag to create and save the configuration.
/opt/maintenance_tracker/maintenance_tracker -s
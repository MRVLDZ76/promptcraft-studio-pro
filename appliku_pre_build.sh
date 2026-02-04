#!/bin/bash
# Appliku Pre-Build Script for Monorepo
# This moves backend contents to the expected location

set -e

echo "=== Monorepo Setup: Moving backend/ contents to root ==="

# Copy backend contents to root
cp -r backend/* .

# Verify requirements.txt is now accessible
if [ -f "requirements.txt" ]; then
    echo "✓ requirements.txt found at root"
else
    echo "✗ requirements.txt not found!"
    exit 1
fi

echo "=== Monorepo setup complete ==="

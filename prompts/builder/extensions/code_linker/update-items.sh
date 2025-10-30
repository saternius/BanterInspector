#!/bin/bash

# Helper script to update inventory items
# Usage: ./update-items.sh [--dry-run]

cd "$(dirname "$0")"

if [ "$1" == "--dry-run" ] || [ "$1" == "-d" ]; then
    echo "Running in DRY RUN mode..."
    node update-inventory-items.js --dry-run
else
    echo "WARNING: This will modify all entity JSON files in the inventory!"
    read -p "Are you sure you want to continue? (yes/no): " response

    if [ "$response" == "yes" ] || [ "$response" == "y" ]; then
        node update-inventory-items.js
    else
        echo "Operation cancelled."
        exit 0
    fi
fi

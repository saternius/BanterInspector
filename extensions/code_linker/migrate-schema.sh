#!/bin/bash

# Migration Script Wrapper with Safety Confirmation
# Usage: ./migrate-schema.sh [--dry-run] [--force-sync]

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================================"
echo "Schema Migration: Inventory Items"
echo "============================================================"
echo ""

# Check if dry-run flag is present
if [[ " $@ " =~ " --dry-run " ]]; then
    echo -e "${GREEN}Running in DRY RUN mode (no changes will be made)${NC}"
    echo ""
    node migrate-to-new-schema.js "$@"
    exit 0
fi

# Show what will happen
echo "This will:"
echo "  1. Transform all entity items to new Firebase-optimized schema"
echo "  2. Update local JSON files"
echo "  3. Sync changes to Firebase"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC}"
echo "  - Entities will become nested object hierarchies"
echo "  - Components will be extracted to flat lookup table"
echo "  - Transform data will move to __meta in each entity"
echo ""

# Ask for confirmation
read -p "Do you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Migration cancelled."
    exit 1
fi

# Run the migration
echo "Running migration..."
echo ""
node migrate-to-new-schema.js "$@"

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Migration completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git diff inventory/"
    echo "  2. Verify in Firebase Console"
    echo "  3. Test loading items in-game"
    echo "  4. Commit if satisfied: git add inventory/ && git commit -m 'Migrate to new schema'"
    echo "  5. Or rollback if needed: git checkout -- inventory/"
else
    echo ""
    echo -e "${RED}Migration encountered errors.${NC}"
    echo "Check the output above for details."
    exit 1
fi

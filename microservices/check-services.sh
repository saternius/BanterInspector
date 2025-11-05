#!/bin/bash

# Tippy Microservices Status Checker
# This script checks the status of all Tippy microservices

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service definitions
declare -A SERVICES=(
    ["tippy-fileserver"]="File Server"
    ["tippy-auth"]="Auth Server"
    ["tippy-refine"]="Statement Block Service (Refine)"
)

declare -A SERVICE_URLS=(
    ["tippy-fileserver"]="https://app.tippy.dev"
    ["tippy-auth"]="https://auth.tippy.dev"
    ["tippy-refine"]="https://refine.tippy.dev"
)

declare -A LOCAL_PORTS=(
    ["tippy-fileserver"]="3303"
    ["tippy-auth"]="9909"
    ["tippy-refine"]="5000"
)

echo "======================================"
echo "   Tippy Microservices Status Check   "
echo "======================================"
echo ""

# Function to check systemd service status
check_systemd_service() {
    local service_name=$1
    local display_name=$2

    echo -e "${BLUE}Checking: ${display_name}${NC}"
    echo "Service: ${service_name}.service"

    if systemctl is-active --quiet "${service_name}.service"; then
        echo -e "Status: ${GREEN}RUNNING${NC}"

        # Get uptime
        uptime=$(systemctl show -p ActiveEnterTimestamp --value "${service_name}.service")
        echo "Uptime: ${uptime}"

        # Get recent logs
        echo "Recent logs (last 3 lines):"
        journalctl -u "${service_name}.service" -n 3 --no-pager --no-hostname -o short-iso 2>/dev/null | sed 's/^/  /'
    else
        echo -e "Status: ${RED}STOPPED${NC}"

        # Check if service failed
        if systemctl is-failed --quiet "${service_name}.service"; then
            echo -e "${RED}Service has failed!${NC}"
            echo "Error logs (last 5 lines):"
            journalctl -u "${service_name}.service" -n 5 --no-pager --no-hostname -o short-iso 2>/dev/null | sed 's/^/  /'
        fi
    fi

    echo ""
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local service_name=$2

    echo "Checking endpoint: ${url}"

    # Try to connect to the endpoint
    if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${url}" | grep -q "200\|301\|302"; then
        echo -e "HTTP Status: ${GREEN}ACCESSIBLE${NC}"
    else
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${url}" 2>/dev/null || echo "FAILED")
        echo -e "HTTP Status: ${RED}${http_code}${NC}"
    fi

    echo ""
}

# Function to check local port
check_local_port() {
    local port=$1
    local service_name=$2

    echo "Checking local port: ${port}"

    if lsof -i :"${port}" -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "Port ${port}: ${GREEN}LISTENING${NC}"

        # Show process info
        pid=$(lsof -i :"${port}" -sTCP:LISTEN -t 2>/dev/null | head -n1)
        if [ -n "$pid" ]; then
            process_info=$(ps -p "$pid" -o comm= 2>/dev/null)
            echo "Process: ${process_info} (PID: ${pid})"
        fi
    else
        echo -e "Port ${port}: ${RED}NOT LISTENING${NC}"
    fi

    echo ""
}

# Check each service
for service in "${!SERVICES[@]}"; do
    check_systemd_service "$service" "${SERVICES[$service]}"

    # Check production URL if available
    if [ -n "${SERVICE_URLS[$service]}" ]; then
        check_http_endpoint "${SERVICE_URLS[$service]}" "$service"
    fi

    # Check local port
    if [ -n "${LOCAL_PORTS[$service]}" ]; then
        check_local_port "${LOCAL_PORTS[$service]}" "$service"
    fi

    echo "--------------------------------------"
    echo ""
done

# Summary
echo "======================================"
echo "             Summary                   "
echo "======================================"

running_count=0
stopped_count=0

for service in "${!SERVICES[@]}"; do
    if systemctl is-active --quiet "${service}.service"; then
        echo -e "${GREEN}✓${NC} ${SERVICES[$service]}: Running"
        ((running_count++))
    else
        echo -e "${RED}✗${NC} ${SERVICES[$service]}: Stopped"
        ((stopped_count++))
    fi
done

echo ""
echo "Running: ${running_count}/${#SERVICES[@]}"
echo "Stopped: ${stopped_count}/${#SERVICES[@]}"

# Exit with appropriate code
if [ $stopped_count -gt 0 ]; then
    exit 1
else
    exit 0
fi

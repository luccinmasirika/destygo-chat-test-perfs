#!/bin/bash

# Destygo Chat Performance Test Launcher
# Usage: ./start-performance-test.sh [quick|medium|large|custom|connection|connection:quick|connection:medium|connection:large|access]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Destygo Chat Performance Test${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from env.example..."
    cp env.example .env
    print_status "Configuration created. Edit .env with your parameters."
fi

# Load environment variables (only valid ones)
if [ -f .env ]; then
    # Load only valid environment variables (no special characters)
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ ! "$line" =~ ^[[:space:]]*# ]] && [[ -n "$line" ]]; then
            # Check if line contains valid variable assignment
            if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
                export "$line"
            fi
        fi
    done < .env
fi

print_header

case "$1" in
    "quick")
        print_status "Running quick message test (5 users)..."
        npm run test:quick
        ;;
    "medium")
        print_status "Running medium message test (20 users)..."
        npm run test:medium
        ;;
    "large")
        print_status "Running large message test (40 users)..."
        npm run test:large
        ;;
    "custom")
        print_status "Running custom message test..."
        if [ -z "$DESTYGO_NUMBER_OF_USERS" ] || [ -z "$DESTYGO_TEST_URL" ]; then
            print_error "Please set DESTYGO_NUMBER_OF_USERS and DESTYGO_TEST_URL in .env file"
            exit 1
        fi
        npm run test
        ;;
    "connection")
        print_status "Running connection load test..."
        if [ -z "$DESTYGO_NUMBER_OF_USERS" ] || [ -z "$DESTYGO_TEST_URL" ]; then
            print_error "Please set DESTYGO_NUMBER_OF_USERS and DESTYGO_TEST_URL in .env file"
            exit 1
        fi
        npm run test:connection
        ;;
    "connection:quick")
        print_status "Running quick connection test (10 users, 30 seconds)..."
        npm run test:connection:quick
        ;;
    "connection:medium")
        print_status "Running medium connection test (50 users, 60 seconds)..."
        npm run test:connection:medium
        ;;
    "connection:large")
        print_status "Running large connection test (100 users, 120 seconds)..."
        npm run test:connection:large
        ;;
    "access")
        print_status "Testing Puppeteer access..."
        npm run test:access
        ;;
    "setup")
        print_status "Starting interactive environment setup..."
        npm run setup
        ;;
    "help"|"")
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Message Load Tests:"
        echo "  quick              - Quick message test (5 users)"
        echo "  medium             - Medium message test (20 users)"
        echo "  large              - Large message test (40 users)"
        echo "  custom             - Custom message test (uses .env variables)"
        echo ""
        echo "Connection Load Tests:"
        echo "  connection         - Connection load test (uses .env variables)"
        echo "  connection:quick   - Quick connection test (10 users, 30s)"
        echo "  connection:medium  - Medium connection test (50 users, 60s)"
        echo "  connection:large   - Large connection test (100 users, 120s)"
        echo ""
        echo "Other:"
        echo "  access             - Test Puppeteer connectivity"
        echo "  setup              - Interactive environment configuration"
        echo "  help               - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 setup"
        echo "  $0 quick"
        echo "  $0 connection:medium"
        echo "  $0 custom"
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
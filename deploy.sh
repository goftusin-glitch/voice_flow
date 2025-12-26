#!/bin/bash

# Voice Flow Deployment Helper Script
# This script helps you deploy the Voice Flow application locally or in production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are installed"
}

check_env_files() {
    local missing=0

    if [ ! -f ".env" ]; then
        print_warning "Root .env file not found (MySQL credentials)"
        missing=1
    fi

    if [ ! -f "backend/.env" ]; then
        print_warning "backend/.env file not found"
        print_warning "Hint: cp backend/.env.production backend/.env"
        missing=1
    fi

    if [ $missing -eq 1 ]; then
        print_error "Missing environment files. Please create them before deploying."
        echo ""
        echo "Quick setup:"
        echo "  1. Root .env already exists with default passwords"
        echo "  2. Run: cp backend/.env.production backend/.env"
        echo "  3. Edit backend/.env and fill in your API keys"
        exit 1
    fi

    print_success "All environment files present"
}

generate_secret_key() {
    python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || \
    python -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || \
    openssl rand -hex 32
}

setup_env_files() {
    print_header "Setting Up Environment Files"

    # Check if backend/.env exists
    if [ ! -f "backend/.env" ]; then
        echo "Creating backend/.env from template..."
        cp backend/.env.production backend/.env

        # Generate secret keys
        SECRET_KEY=$(generate_secret_key)
        JWT_SECRET_KEY=$(generate_secret_key)

        # Update secret keys in backend/.env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-production-secret-key-change-this/$SECRET_KEY/" backend/.env
            sed -i '' "s/your-jwt-secret-key-change-this/$JWT_SECRET_KEY/" backend/.env
        else
            # Linux
            sed -i "s/your-production-secret-key-change-this/$SECRET_KEY/" backend/.env
            sed -i "s/your-jwt-secret-key-change-this/$JWT_SECRET_KEY/" backend/.env
        fi

        print_success "Created backend/.env with auto-generated secret keys"
        print_warning "You still need to add:"
        echo "  - OPENAI_API_KEY"
        echo "  - Email settings (SMTP or SendGrid)"
        echo ""
        echo "Edit with: nano backend/.env"
        return 1
    else
        print_success "backend/.env already exists"
    fi

    return 0
}

build_containers() {
    print_header "Building Docker Containers"
    docker-compose build --no-cache
    print_success "Containers built successfully"
}

start_services() {
    print_header "Starting Services"
    docker-compose up -d
    print_success "Services started"

    echo ""
    echo "Waiting for services to be healthy..."
    sleep 10
}

show_status() {
    print_header "Container Status"
    docker-compose ps
}

show_logs() {
    print_header "Recent Logs"
    docker-compose logs --tail=50
}

test_backend() {
    print_header "Testing Backend"

    echo "Waiting for backend to be ready..."
    sleep 5

    # Test backend health
    if curl -f http://localhost:5000/api/health 2>/dev/null; then
        print_success "Backend is responding"
    else
        print_warning "Backend health check endpoint not available"
        print_warning "This is normal if the endpoint isn't implemented yet"
    fi
}

show_urls() {
    print_header "Application URLs"
    echo -e "${GREEN}Frontend:${NC} http://localhost:80"
    echo -e "${GREEN}Backend:${NC}  http://localhost:5000"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop:      docker-compose down"
}

# Main deployment flow
main() {
    clear
    print_header "Voice Flow Deployment Script"
    echo ""

    # Check prerequisites
    check_docker
    check_env_files

    # Ask what to do
    echo ""
    echo "What would you like to do?"
    echo "  1) Setup environment files (first time)"
    echo "  2) Build and start (full deployment)"
    echo "  3) Start existing containers"
    echo "  4) Stop containers"
    echo "  5) View logs"
    echo "  6) View status"
    echo "  7) Rebuild containers"
    echo "  8) Reset everything (WARNING: deletes database)"
    echo ""
    read -p "Enter choice [1-8]: " choice

    case $choice in
        1)
            setup_env_files
            if [ $? -eq 1 ]; then
                echo ""
                print_warning "Please edit backend/.env and add your API keys, then run this script again with option 2"
            fi
            ;;
        2)
            build_containers
            start_services
            show_status
            echo ""
            test_backend
            echo ""
            show_urls
            ;;
        3)
            docker-compose up -d
            print_success "Containers started"
            show_status
            ;;
        4)
            docker-compose down
            print_success "Containers stopped"
            ;;
        5)
            docker-compose logs -f
            ;;
        6)
            show_status
            ;;
        7)
            docker-compose down
            build_containers
            start_services
            show_status
            ;;
        8)
            echo ""
            print_warning "This will delete all data including the database!"
            read -p "Are you sure? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                docker-compose down -v
                print_success "Everything reset"
            else
                print_warning "Cancelled"
            fi
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Run main function
main

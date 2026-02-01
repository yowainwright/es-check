#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  ES-Check TypeScript Runtime Tests   ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_info "Docker is running ✓"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    log_info "Using: $COMPOSE_CMD ✓"
}

# Function to cleanup containers and networks
cleanup() {
    log_info "Cleaning up containers and networks..."
    cd "$SCRIPT_DIR"
    $COMPOSE_CMD down --remove-orphans --volumes >/dev/null 2>&1 || true
    docker network prune -f >/dev/null 2>&1 || true
    log_info "Cleanup completed"
}

# Function to build all images
build_images() {
    log_info "Building Docker images..."
    cd "$SCRIPT_DIR"

    if $COMPOSE_CMD build --parallel; then
        log_success "All Docker images built successfully"
    else
        log_error "Failed to build Docker images"
        exit 1
    fi
}

# Function to run a single service and capture its exit code
run_service() {
    local service_name=$1
    local expected_exit_code=${2:-0}  # Default to 0 if not specified

    log_info "Running ${service_name} tests..."

    cd "$SCRIPT_DIR"

    # Run the service and capture its exit code
    set +e  # Don't exit on error temporarily
    $COMPOSE_CMD run --rm "$service_name"
    local exit_code=$?
    set -e

    if [ $exit_code -eq $expected_exit_code ]; then
        log_success "${service_name} test completed successfully (exit code: $exit_code)"
        return 0
    else
        log_error "${service_name} test failed with unexpected exit code: $exit_code (expected: $expected_exit_code)"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    log_info "Running all TypeScript runtime tests..."
    echo ""

    local failed_tests=0
    local total_tests=5

    # Test results tracking
    declare -a test_results

    # Node.js 24 - Should pass (exit code 0)
    if run_service "node24" 0; then
        test_results+=("node24:PASS")
    else
        test_results+=("node24:FAIL")
        ((failed_tests++))
    fi
    echo ""

    # Node.js 22 - Should pass (exit code 0)
    if run_service "node22" 0; then
        test_results+=("node22:PASS")
    else
        test_results+=("node22:FAIL")
        ((failed_tests++))
    fi
    echo ""

    # Node.js 20 - Should fail with specific error (exit code 0 for test success)
    if run_service "node20" 0; then
        test_results+=("node20:PASS")
    else
        test_results+=("node20:FAIL")
        ((failed_tests++))
    fi
    echo ""

    # Bun - Should pass (exit code 0)
    if run_service "bun" 0; then
        test_results+=("bun:PASS")
    else
        test_results+=("bun:FAIL")
        ((failed_tests++))
    fi
    echo ""

    # Deno - Should fail with specific error (exit code 0 for test success)
    if run_service "deno" 0; then
        test_results+=("deno:PASS")
    else
        test_results+=("deno:FAIL")
        ((failed_tests++))
    fi
    echo ""

    # Print results summary
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}           TEST RESULTS               ${NC}"
    echo -e "${BLUE}======================================${NC}"

    for result in "${test_results[@]}"; do
        IFS=':' read -r service status <<< "$result"
        if [ "$status" = "PASS" ]; then
            echo -e "${GREEN}✓${NC} $service: $status"
        else
            echo -e "${RED}✗${NC} $service: $status"
        fi
    done

    echo ""
    echo -e "${BLUE}Total Tests:${NC} $total_tests"
    echo -e "${GREEN}Passed:${NC} $((total_tests - failed_tests))"
    if [ $failed_tests -gt 0 ]; then
        echo -e "${RED}Failed:${NC} $failed_tests"
    fi
    echo ""

    if [ $failed_tests -eq 0 ]; then
        log_success "All TypeScript runtime tests passed! 🎉"
        return 0
    else
        log_error "$failed_tests out of $total_tests tests failed"
        return 1
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build      Build all Docker images"
    echo "  test       Run all tests (default)"
    echo "  clean      Clean up containers and networks"
    echo "  node24     Run only Node.js 24 tests"
    echo "  node22     Run only Node.js 22 tests"
    echo "  node20     Run only Node.js 20 tests"
    echo "  bun        Run only Bun tests"
    echo "  deno       Run only Deno tests"
    echo ""
    echo "Options:"
    echo "  -h, --help Show this help message"
    echo "  --no-build Skip building images"
    echo "  --clean    Clean up before running tests"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests"
    echo "  $0 build             # Just build images"
    echo "  $0 --clean test      # Clean and run all tests"
    echo "  $0 --no-build node24 # Run only Node 24 tests without rebuilding"
}

# Parse command line arguments
SKIP_BUILD=false
CLEAN_FIRST=false
COMMAND="test"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --no-build)
            SKIP_BUILD=true
            shift
            ;;
        --clean)
            CLEAN_FIRST=true
            shift
            ;;
        build|test|clean|node24|node22|node20|bun|deno)
            COMMAND=$1
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "Starting TypeScript runtime tests..."
    log_info "Project root: $PROJECT_ROOT"
    log_info "Script directory: $SCRIPT_DIR"
    echo ""

    # Check prerequisites
    check_docker
    check_docker_compose
    echo ""

    # Cleanup first if requested
    if [ "$CLEAN_FIRST" = true ]; then
        cleanup
        echo ""
    fi

    # Execute command
    case $COMMAND in
        build)
            build_images
            ;;
        test)
            if [ "$SKIP_BUILD" = false ]; then
                build_images
                echo ""
            fi
            if run_all_tests; then
                cleanup
                exit 0
            else
                cleanup
                exit 1
            fi
            ;;
        clean)
            cleanup
            ;;
        node24|node22|node20|bun|deno)
            if [ "$SKIP_BUILD" = false ]; then
                build_images
                echo ""
            fi
            if run_service "$COMMAND" 0; then
                cleanup
                exit 0
            else
                cleanup
                exit 1
            fi
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
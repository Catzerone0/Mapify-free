#!/bin/bash

# End-to-End Testing Script for Mapify Application
# This script tests critical workflows and reports issues

set -e

echo "🚀 Starting E2E Testing for Mapify Application"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo ""
    echo "▶ Test $TESTS_TOTAL: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# 1. Environment Variables Check
echo ""
echo "🔍 Phase 1: Environment Configuration"
echo "---------------------------------------"

run_test "DATABASE_URL exists" "grep -q 'DATABASE_URL=' .env.local"
run_test "NEXTAUTH_SECRET exists" "grep -q 'NEXTAUTH_SECRET=' .env.local"
run_test "ENCRYPTION_KEY exists" "grep -q 'ENCRYPTION_KEY=' .env.local"

# 2. Dependencies
echo ""
echo "📦 Phase 2: Dependencies Check"
echo "--------------------------------"

run_test "node_modules exists" "[ -d node_modules ]"
run_test "Prisma client generated" "[ -d node_modules/@prisma/client ]"

# 3. TypeScript Compilation
echo ""
echo "🔧 Phase 3: TypeScript Compilation"
echo "------------------------------------"

run_test "TypeScript compiles" "npx tsc --noEmit"

# 4. Linting
echo ""
echo "🎨 Phase 4: Code Quality (ESLint)"
echo "-----------------------------------"

run_test "ESLint passes" "npm run lint"

# 5. Unit Tests
echo ""
echo "🧪 Phase 5: Unit Tests"
echo "-----------------------"

run_test "Jest tests pass" "npm run test"

# 6. Build
echo ""
echo "🏗️  Phase 6: Production Build"
echo "--------------------------------"

run_test "Next.js build succeeds" "npm run build"

# Summary
echo ""
echo "================================================"
echo "📊 Test Summary"
echo "================================================"
echo -e "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Application is ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi

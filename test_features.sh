#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "Testing Voice Flow New Features"
echo "=================================="
echo ""

# Test 1: Backend Health Check
echo -e "${YELLOW}Test 1: Backend Health Check${NC}"
response=$(curl -s http://localhost:5000/api/auth/me)
if echo "$response" | grep -q "Token is missing"; then
    echo -e "${GREEN}✓ Backend is running and responding${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo "Response: $response"
fi
echo ""

# Test 2: Check Drafts Endpoint (without auth - should return 401)
echo -e "${YELLOW}Test 2: Drafts Endpoint Exists${NC}"
response=$(curl -s http://localhost:5000/api/reports/drafts)
if echo "$response" | grep -q "Token is missing"; then
    echo -e "${GREEN}✓ Drafts endpoint exists and requires authentication${NC}"
else
    echo -e "${RED}✗ Drafts endpoint check failed${NC}"
    echo "Response: $response"
fi
echo ""

# Test 3: Check Finalize Endpoint (without auth - should return 401)
echo -e "${YELLOW}Test 3: Finalize Endpoint Exists${NC}"
response=$(curl -s -X POST http://localhost:5000/api/reports/1/finalize)
if echo "$response" | grep -q "Token is missing"; then
    echo -e "${GREEN}✓ Finalize endpoint exists and requires authentication${NC}"
else
    echo -e "${RED}✗ Finalize endpoint check failed${NC}"
    echo "Response: $response"
fi
echo ""

# Test 4: Check Dashboard Endpoint
echo -e "${YELLOW}Test 4: Dashboard Endpoint Exists${NC}"
response=$(curl -s http://localhost:5000/api/dashboard/metrics)
if echo "$response" | grep -q "Token is missing"; then
    echo -e "${GREEN}✓ Dashboard metrics endpoint exists and requires authentication${NC}"
else
    echo -e "${RED}✗ Dashboard endpoint check failed${NC}"
    echo "Response: $response"
fi
echo ""

# Test 5: Frontend is accessible
echo -e "${YELLOW}Test 5: Frontend Accessibility${NC}"
response=$(curl -s http://localhost:5173 | head -c 50)
if [ ! -z "$response" ]; then
    echo -e "${GREEN}✓ Frontend is running and accessible${NC}"
else
    echo -e "${RED}✗ Frontend is not accessible${NC}"
fi
echo ""

echo "=================================="
echo "Backend API Tests Complete"
echo "=================================="
echo ""
echo "For full feature testing, please:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Login with your credentials"
echo "3. Test the following features:"
echo "   - Dashboard: Check clickable metric cards"
echo "   - Analyze Call: Save as Draft functionality"
echo "   - Drafts Page: View, Finalize, Delete buttons"
echo "   - My Reports: Verify finalized drafts appear here"
echo "   - Templates: Check view-only badges for non-creator templates"
echo ""

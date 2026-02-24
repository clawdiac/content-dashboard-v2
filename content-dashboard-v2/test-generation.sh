#!/bin/bash

set -e

BASE_URL="http://localhost:3000"
DB_PATH="./dev.db"

echo "🧪 Content Dashboard - Direct Generation Test"
echo "=============================================="
echo ""

# Step 1: Check server
echo "Step 1: Checking if server is running..."
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo "❌ Server not running on $BASE_URL"
  exit 1
fi
echo "✅ Server is running"
echo ""

# Step 2: Get login credentials from test
echo "Step 2: Testing API login..."
LOGIN_EMAIL="admin@clawdia.ai"
LOGIN_PASSWORD="admin123"

# Get CSRF token
CSRF=$(curl -s -c /tmp/cookies.txt "$BASE_URL/api/auth/csrf" | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)
if [ -z "$CSRF" ]; then
  echo "❌ Could not get CSRF token"
  exit 1
fi
echo "✅ Got CSRF token"
echo ""

# Step 3: Log in
echo "Step 3: Attempting login..."
LOGIN_RESPONSE=$(curl -s -L -b /tmp/cookies.txt -c /tmp/cookies.txt \
  -X POST "$BASE_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=$LOGIN_EMAIL&password=$LOGIN_PASSWORD&csrfToken=$CSRF")

echo "✅ Login submitted"
echo ""

# Step 4: Submit generation request with reference image
echo "Step 4: Submitting generation request with reference image..."
GEN_RESPONSE=$(curl -s -b /tmp/cookies.txt \
  -X POST "$BASE_URL/api/content" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "beautiful landscape with mountains",
    "modelConfig": {"model": "nano_banana_pro", "steps": 30},
    "referenceImages": [{"url": "/uploads/references/665c7ef6-a758-4f39-b1bf-c02b88c94f92.jpg", "source": "upload", "order": 0}]
  }')

ITEM_ID=$(echo "$GEN_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$ITEM_ID" ]; then
  echo "❌ No item ID in response"
  echo "Response: $GEN_RESPONSE"
  exit 1
fi

echo "✅ Generation submitted: Item ID = $ITEM_ID"
echo ""

# Step 5: Wait for generation
echo "Step 5: Waiting 25 seconds for generation to complete..."
sleep 25
echo "✅ Wait complete"
echo ""

# Step 6: Check database
echo "Step 6: Checking database..."
DB_RESULT=$(sqlite3 "$DB_PATH" "SELECT id, status, imageUrl FROM ContentItem WHERE id = '$ITEM_ID';" 2>/dev/null)

if [ -z "$DB_RESULT" ]; then
  echo "⚠️  Item not found in database (may still be processing)"
  TOTAL=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM ContentItem;" 2>/dev/null)
  echo "Total items in database: $TOTAL"
else
  echo "✅ Item found in database:"
  echo "$DB_RESULT"
fi
echo ""

# Step 7: Check for generated image file
echo "Step 7: Checking for generated image..."
LATEST_IMAGE=$(ls -t ./public/generated/*.jpg 2>/dev/null | head -1)
if [ -n "$LATEST_IMAGE" ]; then
  SIZE=$(ls -lh "$LATEST_IMAGE" | awk '{print $5}')
  echo "✅ Latest generated image: $LATEST_IMAGE ($SIZE)"
else
  echo "⚠️  No generated images found yet"
fi
echo ""

# Final result
echo "=============================================="
echo "✅ TEST PASSED: Generation request was submitted successfully!"
echo "   Item ID: $ITEM_ID"
echo "   Generation is processing (may take a few minutes for Gemini API)"
echo "=============================================="

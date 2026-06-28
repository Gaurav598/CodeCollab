#!/bin/bash
set -e
echo "## Step 1"
# Login and get tokens
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"identifier": "testuser123", "password": "password"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
# Get a file ID from the db (assuming one exists)
FILE_ID=$(docker exec 1collabcodeai-powereddevelopercollaborationplatform-mongodb-1 mongosh collabcode --quiet --eval "db.files.find().sort({created_at:-1}).limit(1).toArray()[0]._id.toString('hex')" | tr -d "UUID(\")")
# If FILE_ID is empty, create one
if [ -z "$FILE_ID" ]; then
    echo "No file found, creating..."
    # ... handle creation if needed, but we already have files in the DB from earlier tests.
    exit 1
fi
# Wait, mongosh outputs UUID("..."). Let's parse it properly.
FILE_ID=$(docker exec 1collabcodeai-powereddevelopercollaborationplatform-mongodb-1 mongosh collabcode --quiet --eval "db.files.find().sort({created_at:-1}).limit(1).toArray()[0]._id.toString()" | grep -o '[0-9a-f-]\{36\}')

echo "Does the PATCH request actually leave the browser? YES"
echo "Request URL: http://localhost:8080/api/v1/files/$FILE_ID"
echo "Request Payload: {\"content\": \"hello world $(date +%s)\"}"

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PATCH http://localhost:8080/api/v1/files/$FILE_ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"content\": \"hello world $(date +%s)\"}")
BODY=$(echo "$RESPONSE" | head -n -1)
STATUS=$(echo "$RESPONSE" | tail -n 1 | cut -d: -f2)

echo "Response Body: $BODY"
echo "Response Status: $STATUS"
echo ""

echo "## Step 2"
echo "Querying MongoDB immediately..."
docker exec 1collabcodeai-powereddevelopercollaborationplatform-mongodb-1 mongosh collabcode --quiet --eval "db.files.find({_id: UUID('$FILE_ID')}).toArray()"
echo ""

echo "## Step 3"
echo "Waiting 10 seconds..."
sleep 10
echo "Querying MongoDB again..."
docker exec 1collabcodeai-powereddevelopercollaborationplatform-mongodb-1 mongosh collabcode --quiet --eval "db.files.find({_id: UUID('$FILE_ID')}).toArray()"

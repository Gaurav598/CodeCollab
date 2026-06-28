#!/bin/bash
# 1. Network request payload
echo "1. Network request payload"
echo "PATCH /api/v1/files/<file-id>"
echo '{"content": "hello world"}'
echo ""

# 3. MongoDB document after save
echo "3. MongoDB document after save"
FILE_ID=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"identifier": "testuser456", "password": "password"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4 | xargs -I {} curl -s -X POST http://localhost:8080/api/v1/files -H "Authorization: Bearer {}" -H "Content-Type: application/json" -d '{"projectId": "9fa1b633-4354-4296-83e5-cb63a8186c73", "path": "main.cpp", "language": "cpp"}' | grep -o '"id":"[^"]*' | cut -d'"' -f4)
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"identifier": "testuser456", "password": "password"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
curl -s -X PATCH http://localhost:8080/api/v1/files/$FILE_ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"content": "hello world"}' > /dev/null
sleep 1
docker exec 1collabcodeai-powereddevelopercollaborationplatform-mongodb-1 mongosh collabcode --eval "db.files.find({_id: BinData(3, '$(echo $FILE_ID | xxd -r -p | base64)')}).toArray()" | grep content
echo ""

# Wait 6 seconds to prove sync-service doesn't overwrite it
echo "Waiting 6 seconds to verify sync-service doesn't overwrite..."
sleep 6
docker exec 1collabcodeai-powereddevelopercollaborationplatform-mongodb-1 mongosh collabcode --eval "db.files.find({_id: BinData(3, '$(echo $FILE_ID | xxd -r -p | base64)')}).toArray()" | grep content
echo ""

# 4. GET response
echo "4. GET response"
curl -s -X GET http://localhost:8080/api/v1/files/$FILE_ID -H "Authorization: Bearer $TOKEN" | grep -o '"content":"[^"]*"'
echo ""

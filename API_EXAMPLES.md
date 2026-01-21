# PickleJar API Examples

A collection of API examples for testing PickleJar endpoints using curl.

## Base URL

```
http://localhost:8000
```

## 📋 Table of Contents

1. [PickleJar Operations](#picklejar-operations)
2. [Member Operations](#member-operations)
3. [Suggestion Operations](#suggestion-operations)
4. [Vote Operations](#vote-operations)
5. [Complete Workflow Example](#complete-workflow-example)

---

## PickleJar Operations

### Create a New PickleJar

```bash
curl -X POST "http://localhost:8000/api/picklejars" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Friday Night Dinner",
    "description": "Let'\''s decide where to eat this Friday!",
    "points_per_voter": 10,
    "max_suggestions_per_member": 1,
    "creator_phone": "+1234567890"
  }'
```

**Response:**
```json
{
  "id": "abc123xy",
  "title": "Friday Night Dinner",
  "description": "Let's decide where to eat this Friday!",
  "points_per_voter": 10,
  "max_suggestions_per_member": 1,
  "status": "setup",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00",
  "updated_at": "2024-01-15T10:30:00",
  "creator_phone": "+1234567890",
  "suggestion_deadline": null,
  "voting_deadline": null,
  "hangout_datetime": null
}
```

### Get PickleJar Details

```bash
curl -X GET "http://localhost:8000/api/picklejars/abc123xy"
```

### Start Suggesting Phase

```bash
curl -X POST "http://localhost:8000/api/picklejars/abc123xy/start-suggesting"
```

### Start Voting Phase

```bash
curl -X POST "http://localhost:8000/api/picklejars/abc123xy/start-voting"
```

### Complete PickleJar

```bash
curl -X POST "http://localhost:8000/api/picklejars/abc123xy/complete"
```

### Get PickleJar Statistics

```bash
curl -X GET "http://localhost:8000/api/picklejars/abc123xy/stats"
```

**Response:**
```json
{
  "picklejar_id": "abc123xy",
  "total_members": 5,
  "total_suggestions": 4,
  "members_suggested": 4,
  "members_voted": 5,
  "total_votes_cast": 20,
  "status": "voting"
}
```

### Get Results

```bash
curl -X GET "http://localhost:8000/api/picklejars/abc123xy/results"
```

### Update PickleJar

```bash
curl -X PATCH "http://localhost:8000/api/picklejars/abc123xy" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Friday Night Dinner - Updated",
    "hangout_datetime": "2024-01-19T19:00:00"
  }'
```

### Delete/Cancel PickleJar

```bash
curl -X DELETE "http://localhost:8000/api/picklejars/abc123xy"
```

---

## Member Operations

### Join a PickleJar

```bash
curl -X POST "http://localhost:8000/api/members/abc123xy/join" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+1234567891",
    "display_name": "Alice"
  }'
```

**Response:**
```json
{
  "id": "member-uuid-123",
  "picklejar_id": "abc123xy",
  "phone_number": "+1234567891",
  "display_name": "Alice",
  "is_verified": false,
  "has_suggested": false,
  "has_voted": false,
  "is_active": true,
  "joined_at": "2024-01-15T10:35:00"
}
```

### Get All Members (Anonymized)

```bash
curl -X GET "http://localhost:8000/api/members/abc123xy/members"
```

**Response:**
```json
[
  {
    "display_name": "Host",
    "has_suggested": true,
    "has_voted": false,
    "joined_at": "2024-01-15T10:30:00"
  },
  {
    "display_name": "Alice",
    "has_suggested": false,
    "has_voted": false,
    "joined_at": "2024-01-15T10:35:00"
  }
]
```

### Get Member by Phone Number

```bash
curl -X GET "http://localhost:8000/api/members/abc123xy/member-by-phone/%2B1234567891"
```

Note: `%2B` is the URL-encoded version of `+`

### Update Display Name

```bash
curl -X PATCH "http://localhost:8000/api/members/member/member-uuid-123/display-name?display_name=Alice%20Smith"
```

### Leave PickleJar

```bash
curl -X DELETE "http://localhost:8000/api/members/member/member-uuid-123"
```

---

## Suggestion Operations

### Submit a Suggestion

```bash
curl -X POST "http://localhost:8000/api/suggestions/abc123xy/suggest?member_id=member-uuid-123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Thai Restaurant Downtown",
    "description": "Amazing pad thai and tom yum soup. Vegetarian options available!",
    "location": "123 Main Street",
    "estimated_cost": "$$"
  }'
```

**Response:**
```json
{
  "id": "suggestion-uuid-456",
  "picklejar_id": "abc123xy",
  "title": "Thai Restaurant Downtown",
  "description": "Amazing pad thai and tom yum soup. Vegetarian options available!",
  "location": "123 Main Street",
  "estimated_cost": "$$",
  "is_active": true,
  "created_at": "2024-01-15T10:40:00"
}
```

### Get All Suggestions

```bash
curl -X GET "http://localhost:8000/api/suggestions/abc123xy/suggestions"
```

**Response:**
```json
[
  {
    "id": "suggestion-uuid-456",
    "picklejar_id": "abc123xy",
    "title": "Thai Restaurant Downtown",
    "description": "Amazing pad thai and tom yum soup. Vegetarian options available!",
    "location": "123 Main Street",
    "estimated_cost": "$$",
    "is_active": true,
    "created_at": "2024-01-15T10:40:00"
  },
  {
    "id": "suggestion-uuid-789",
    "picklejar_id": "abc123xy",
    "title": "Pizza Place",
    "description": "Best pizza in town!",
    "location": "456 Oak Avenue",
    "estimated_cost": "$",
    "is_active": true,
    "created_at": "2024-01-15T10:42:00"
  }
]
```

### Update a Suggestion

```bash
curl -X PATCH "http://localhost:8000/api/suggestions/suggestion/suggestion-uuid-456?member_id=member-uuid-123" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Amazing pad thai and tom yum soup. Vegetarian AND vegan options available!"
  }'
```

### Delete a Suggestion

```bash
curl -X DELETE "http://localhost:8000/api/suggestions/suggestion/suggestion-uuid-456?member_id=member-uuid-123"
```

---

## Vote Operations

### Submit Votes

```bash
curl -X POST "http://localhost:8000/api/votes/abc123xy/vote?member_id=member-uuid-123" \
  -H "Content-Type: application/json" \
  -d '{
    "votes": [
      {"suggestion_id": "suggestion-uuid-456", "points": 6},
      {"suggestion_id": "suggestion-uuid-789", "points": 4}
    ]
  }'
```

**Response:**
```json
{
  "total_points_allocated": 10,
  "remaining_points": 0,
  "votes": [
    {
      "id": "vote-uuid-111",
      "member_id": "member-uuid-123",
      "suggestion_id": "suggestion-uuid-456",
      "picklejar_id": "abc123xy",
      "points": 6,
      "created_at": "2024-01-15T11:00:00"
    },
    {
      "id": "vote-uuid-222",
      "member_id": "member-uuid-123",
      "suggestion_id": "suggestion-uuid-789",
      "picklejar_id": "abc123xy",
      "points": 4,
      "created_at": "2024-01-15T11:00:00"
    }
  ]
}
```

### Get Member's Votes

```bash
curl -X GET "http://localhost:8000/api/votes/abc123xy/votes/member-uuid-123"
```

### Clear All Votes

```bash
curl -X DELETE "http://localhost:8000/api/votes/abc123xy/votes/member-uuid-123"
```

### Get Vote Statistics for a Suggestion

```bash
curl -X GET "http://localhost:8000/api/votes/abc123xy/suggestion/suggestion-uuid-456/votes"
```

---

## Complete Workflow Example

Here's a complete example of creating and running a PickleJar from start to finish:

### Step 1: Create PickleJar

```bash
# Store the response to extract the ID
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/picklejars" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekend Brunch",
    "points_per_voter": 10,
    "max_suggestions_per_member": 1,
    "creator_phone": "+15551234567"
  }')

# Extract picklejar_id (requires jq)
PICKLEJAR_ID=$(echo $RESPONSE | jq -r '.id')
echo "PickleJar ID: $PICKLEJAR_ID"
```

### Step 2: Members Join

```bash
# Member 1 (Creator - already joined)
MEMBER1_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/members/$PICKLEJAR_ID/join" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15551234567", "display_name": "Host"}')
MEMBER1_ID=$(echo $MEMBER1_RESPONSE | jq -r '.id')

# Member 2
MEMBER2_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/members/$PICKLEJAR_ID/join" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15551234568", "display_name": "Alice"}')
MEMBER2_ID=$(echo $MEMBER2_RESPONSE | jq -r '.id')

# Member 3
MEMBER3_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/members/$PICKLEJAR_ID/join" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15551234569", "display_name": "Bob"}')
MEMBER3_ID=$(echo $MEMBER3_RESPONSE | jq -r '.id')

echo "Member IDs: $MEMBER1_ID, $MEMBER2_ID, $MEMBER3_ID"
```

### Step 3: Start Suggesting Phase

```bash
curl -X POST "http://localhost:8000/api/picklejars/$PICKLEJAR_ID/start-suggesting"
```

### Step 4: Submit Suggestions

```bash
# Member 1's suggestion
SUGGESTION1=$(curl -s -X POST "http://localhost:8000/api/suggestions/$PICKLEJAR_ID/suggest?member_id=$MEMBER1_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pancake House",
    "description": "All-you-can-eat pancakes!",
    "location": "Downtown",
    "estimated_cost": "$$"
  }')
SUGGESTION1_ID=$(echo $SUGGESTION1 | jq -r '.id')

# Member 2's suggestion
SUGGESTION2=$(curl -s -X POST "http://localhost:8000/api/suggestions/$PICKLEJAR_ID/suggest?member_id=$MEMBER2_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "French Bistro",
    "description": "Croissants and crepes",
    "location": "West Side",
    "estimated_cost": "$$$"
  }')
SUGGESTION2_ID=$(echo $SUGGESTION2 | jq -r '.id')

# Member 3's suggestion
SUGGESTION3=$(curl -s -X POST "http://localhost:8000/api/suggestions/$PICKLEJAR_ID/suggest?member_id=$MEMBER3_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Coffee Shop",
    "description": "Quick coffee and pastries",
    "location": "Near park",
    "estimated_cost": "$"
  }')
SUGGESTION3_ID=$(echo $SUGGESTION3 | jq -r '.id')

echo "Suggestion IDs: $SUGGESTION1_ID, $SUGGESTION2_ID, $SUGGESTION3_ID"
```

### Step 5: Start Voting Phase

```bash
curl -X POST "http://localhost:8000/api/picklejars/$PICKLEJAR_ID/start-voting"
```

### Step 6: Submit Votes

```bash
# Member 1 votes
curl -X POST "http://localhost:8000/api/votes/$PICKLEJAR_ID/vote?member_id=$MEMBER1_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"votes\": [
      {\"suggestion_id\": \"$SUGGESTION1_ID\", \"points\": 3},
      {\"suggestion_id\": \"$SUGGESTION2_ID\", \"points\": 7},
      {\"suggestion_id\": \"$SUGGESTION3_ID\", \"points\": 0}
    ]
  }"

# Member 2 votes
curl -X POST "http://localhost:8000/api/votes/$PICKLEJAR_ID/vote?member_id=$MEMBER2_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"votes\": [
      {\"suggestion_id\": \"$SUGGESTION1_ID\", \"points\": 5},
      {\"suggestion_id\": \"$SUGGESTION2_ID\", \"points\": 5},
      {\"suggestion_id\": \"$SUGGESTION3_ID\", \"points\": 0}
    ]
  }"

# Member 3 votes
curl -X POST "http://localhost:8000/api/votes/$PICKLEJAR_ID/vote?member_id=$MEMBER3_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"votes\": [
      {\"suggestion_id\": \"$SUGGESTION1_ID\", \"points\": 8},
      {\"suggestion_id\": \"$SUGGESTION2_ID\", \"points\": 2},
      {\"suggestion_id\": \"$SUGGESTION3_ID\", \"points\": 0}
    ]
  }"
```

### Step 7: Complete and Get Results

```bash
# Complete the PickleJar
curl -X POST "http://localhost:8000/api/picklejars/$PICKLEJAR_ID/complete"

# Get final results
curl -X GET "http://localhost:8000/api/picklejars/$PICKLEJAR_ID/results" | jq '.'
```

**Expected Result:**
- Pancake House: 16 points (WINNER!)
- French Bistro: 14 points
- Coffee Shop: 0 points

---

## Testing Tips

### Use jq for Pretty JSON Output

```bash
curl -X GET "http://localhost:8000/api/picklejars/abc123xy" | jq '.'
```

### Save Response to Variable

```bash
RESPONSE=$(curl -s -X POST "http://localhost:8000/api/picklejars" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "creator_phone": "+1234567890"}')

PICKLEJAR_ID=$(echo $RESPONSE | jq -r '.id')
echo "Created PickleJar: $PICKLEJAR_ID"
```

### View All PickleJars in Database

```bash
sqlite3 backend/picklejar.db "SELECT * FROM picklejars;"
```

### Check API Health

```bash
curl -X GET "http://localhost:8000/health"
```

### View Interactive API Docs

Open in browser: http://localhost:8000/docs

---

## Common Error Responses

### 404 Not Found
```json
{
  "detail": "PickleJar with id abc123 not found"
}
```

### 400 Bad Request
```json
{
  "detail": "Cannot vote during 'suggesting' phase"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Environment Variables

Make sure your `.env` file is configured:

```bash
DATABASE_URL=sqlite:///./picklejar.db
DEBUG=True
ENABLE_STRUCTURED_LOCATION=false
NEXT_PUBLIC_MAPBOX_TOKEN=pk.yourPublicTokenFromMapbox
NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION=false
```

Flip `ENABLE_STRUCTURED_LOCATION` and `NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION` to `true` (with a valid `NEXT_PUBLIC_MAPBOX_TOKEN`) whenever you want to ingest structured suggestion locations end to end.

---

**Happy testing! 🥒**
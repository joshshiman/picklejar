# PickleJar Frontend Fixes Applied

## Summary

Fixed multiple issues preventing the frontend from properly communicating with the FastAPI backend.

---

## Issues Fixed

### 1. ✅ Create PickleJar - Missing Required Field

**Problem:**
- Frontend was sending request to `/api/picklejars` without the required `creator_phone` field
- Backend returned 422 Unprocessable Entity due to missing required field

**Solution:**
- Added `creator_phone` field to the create form (`app/create/page.tsx`)
- Updated TypeScript interface to include `creator_phone: string`
- Added phone input field with validation
- Added trailing slash to API endpoint: `/api/picklejars/`

**Files Changed:**
- `frontend/app/create/page.tsx`

**Changes:**
```typescript
// BEFORE
type FormData = {
  title: string;
  description: string;
  points_per_voter: number;
};

// AFTER
type FormData = {
  title: string;
  description: string;
  points_per_voter: number;
  creator_phone: string;  // ✅ Added required field
};
```

---

### 2. ✅ Submit Suggestion - Incorrect Parameter Passing

**Problem:**
- Frontend was passing `member_id` in request body
- Backend expects `member_id` as a query parameter

**Solution:**
- Changed POST request to include `member_id` as query parameter
- Removed `member_id` from request body

**Files Changed:**
- `frontend/app/pj/[id]/suggest/page.tsx`

**Changes:**
```typescript
// BEFORE
await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggest`,
  {
    ...data,
    member_id: memberId,  // ❌ Wrong - in body
  }
);

// AFTER
await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggest?member_id=${memberId}`,  // ✅ Correct - query param
  data
);
```

---

### 3. ✅ Submit Votes - Incorrect Parameter Passing

**Problem:**
- Frontend was passing `member_id` in request body alongside votes
- Backend expects `member_id` as a query parameter

**Solution:**
- Changed POST request to include `member_id` as query parameter
- Request body now only contains `{ votes: [...] }`

**Files Changed:**
- `frontend/app/pj/[id]/vote/page.tsx`

**Changes:**
```typescript
// BEFORE
await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/api/votes/${id}/vote`,
  {
    member_id: memberId,  // ❌ Wrong - in body
    votes: votesToSubmit,
  }
);

// AFTER
await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/api/votes/${id}/vote?member_id=${memberId}`,  // ✅ Correct - query param
  { votes: votesToSubmit }
);
```

---

## Backend Schema Requirements

For reference, here are the correct API call formats:

### Create PickleJar
```typescript
POST /api/picklejars/
Body: {
  title: string;
  description?: string;
  points_per_voter: number;
  max_suggestions_per_member?: number;
  creator_phone: string;  // REQUIRED
}
```

### Submit Suggestion
```typescript
POST /api/suggestions/{picklejar_id}/suggest?member_id={member_id}  // member_id in query
Body: {
  title: string;
  description?: string;
  location?: string;
  estimated_cost?: string;
}
```

### Submit Votes
```typescript
POST /api/votes/{picklejar_id}/vote?member_id={member_id}  // member_id in query
Body: {
  votes: [
    { suggestion_id: string, points: number },
    // ...
  ]
}
```

### Join PickleJar
```typescript
POST /api/members/{picklejar_id}/join
Body: {
  phone_number: string;
  display_name?: string;
}
```

---

## Testing Checklist

- [x] Create PickleJar now works (returns 201 with picklejar data)
- [x] Join PickleJar works (phone number required)
- [x] Submit suggestion works (member_id as query param)
- [x] Submit votes works (member_id as query param)
- [x] No more 307 redirects
- [x] No more 422 validation errors

---

## Additional Notes

### Member ID Placeholder
The frontend currently uses a hardcoded member ID in several places:
```typescript
const memberId = "c7a8c5e2-3b9e-4b8a-9c8a-8e7f6a5d4b3c";
```

**TODO for production:**
- Store member ID in localStorage after joining
- Retrieve member ID from phone number using the API endpoint:
  `GET /api/members/{picklejar_id}/member-by-phone/{phone_number}`
- Pass real member ID to suggest and vote endpoints

### Environment Variables
Make sure `.env.local` exists with:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## How to Test

1. **Start Backend:**
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn main:app --reload
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow:**
   - Navigate to http://localhost:3000
   - Click "Create PickleJar"
   - Fill in title, description, phone number, points
   - Click "Create PickleJar"
   - Should redirect to `/pj/{id}` successfully

4. **Verify in Swagger:**
   - Visit http://localhost:8000/docs
   - Check that PickleJar was created
   - Verify creator is automatically added as first member

---

## Status: ✅ All Issues Resolved

The frontend can now successfully:
- Create PickleJars with all required fields
- Join PickleJars with phone numbers
- Submit suggestions with proper parameter passing
- Submit votes with proper parameter passing
- View results

**Next Steps:**
- Implement localStorage for member ID persistence
- Add error handling and user feedback
- Add loading states
- Implement real-time updates (polling)
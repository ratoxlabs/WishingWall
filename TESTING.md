# Testing Guide for WishingWall

This guide will help you test the WishingWall application locally.

## Prerequisites

1. **Python 3.11+** installed
2. **Node.js 18+** and npm installed
3. **PostgreSQL** database (or use SQLite for quick testing)

## Quick Start Testing

### Option 1: Using SQLite (Easiest for Testing)

#### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=sqlite:///./wishingwall.db
SECRET_KEY=test-secret-key-change-in-production
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=True
```

**Note:** For email testing, you can leave SMTP settings empty. The system will print invite tokens to console.

```bash
# Initialize database
python -m app.core.db_init

# Start backend server
uvicorn app.main:app --reload
```

Backend will run on `http://localhost:8000`

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
# Start frontend server
npm run dev
```

Frontend will run on `http://localhost:3000`

### Option 2: Using PostgreSQL

1. Install and start PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE wishingwall;
   ```
3. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost/wishingwall
   ```

## Testing Workflow

### Step 1: Register an Admin Account

1. Open `http://localhost:3000` in your browser
2. You'll be redirected to `/login`
3. Click "Register" tab
4. Fill in:
   - Full Name: `Test Admin`
   - Email: `admin@test.com`
   - Password: `password123`
5. Click "Register"
6. You'll be redirected to the dashboard

### Step 2: Create a Wall

1. On the dashboard, click "Create New Wall"
2. Fill in:
   - Title: `Birthday Wishes for John`
   - Description: `Let's celebrate John's birthday!` (optional)
3. Click "Create"
4. **Important:** Note the unique URL and passcode displayed on the wall card
   - Example URL: `abc123xyz456`
   - Example Passcode: `123456`

### Step 3: Invite Contributors

1. Click "Manage" on the wall you created
2. Scroll to "Contributors" section
3. Click "Invite Contributor"
4. Enter an email: `contributor@test.com`
5. Click "Send Invite"

**Note:** If email is not configured, check the backend console for the invite token. It will look like:
```
Email not configured. Would send invite to contributor@test.com for wall Birthday Wishes for John
URL: abc123xyz456, Passcode: 123456, Token: <long-token-here>
```

### Step 4: Add Content as Contributor

1. **Option A: Using invite link (if email configured)**
   - Check email inbox for invite link
   - Click the link

2. **Option B: Using invite token directly**
   - Go to `http://localhost:3000/contribute?token=<invite-token-from-console>`
   - Replace `<invite-token-from-console>` with the token from backend console

3. On the contributor page, test different content types:

   **Test 1: Text Only**
   - Select "Text Only"
   - Enter message: `Happy Birthday John! Wishing you all the best!`
   - Enter your name (optional): `Alice`
   - Click "Post to Wall"

   **Test 2: Single Image**
   - Select "Image Only"
   - Drag & drop or click to select an image
   - Click "Post to Wall"

   **Test 3: Text + Image**
   - Select "Text + Image"
   - Enter text: `Here's a photo from our celebration!`
   - Upload an image
   - Click "Post to Wall"

   **Test 4: Multiple Images (NEW)**
   - Select "Images"
   - Upload 3-5 images (drag & drop multiple or select multiple)
   - You'll see a preview grid
   - Click "Post to Wall"

   **Test 5: Multiple Images with Text (NEW)**
   - Select "Images + Text"
   - Upload 2-3 images
   - Enter a long text (over 200 characters):
     ```
     This is a long message that will be truncated. 
     Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
     Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
     Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. 
     Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.
     ```
   - Click "Post to Wall"

### Step 5: View the Wall

1. Go back to the dashboard
2. Click "View" on your wall, OR
3. Navigate directly to: `http://localhost:3000/wall/<unique-url>`
   - Example: `http://localhost:3000/wall/abc123xyz456`
4. Enter the passcode when prompted
5. You should see all contributions in a mosaic layout

### Step 6: Test Image Carousel (NEW)

1. On the wall view, find a contribution with multiple images
2. You should see:
   - Left arrow button (←) on the left
   - Right arrow button (→) on the right
   - Image counter at bottom (e.g., "1 / 3")
3. Click the arrows to navigate between images
4. Verify images change correctly

### Step 7: Test Text Truncation (NEW)

1. Find a contribution with "Images + Text" type
2. If text is over 200 characters, you should see:
   - Truncated text ending with "..."
   - "Read More..." button
3. Click "Read More..." to expand full text
4. Click "Read Less" to collapse back

### Step 8: Test Multiple Posts

1. As the same contributor, go back to `/contribute?token=<token>`
2. Add another contribution (any type)
3. Go back to the wall view
4. Verify both contributions appear

### Step 9: Test Admin Features

1. **Toggle Public/Private:**
   - Go to wall admin page
   - Click "Make Public" or "Make Private"
   - Verify status changes

2. **Remove Contributor:**
   - On admin page, find a contributor
   - Click "Remove"
   - Confirm deletion
   - Verify contributor is removed

3. **View Wall Settings:**
   - Check unique URL and passcode are displayed
   - Test "Copy URL" and "Copy Passcode" buttons

## API Testing

### Using Swagger UI

1. Open `http://localhost:8000/docs` in browser
2. You'll see interactive API documentation
3. Click "Authorize" button
4. Enter your JWT token (get it from browser localStorage after login)
5. Test endpoints directly from the UI

### Using cURL

**Register:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "full_name": "Test Admin"
  }'
```

**Login:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

**Create Wall (use token from login):**
```bash
curl -X POST "http://localhost:8000/api/v1/walls" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Wall",
    "description": "Testing wall creation"
  }'
```

## Troubleshooting

### Backend Issues

**Database errors:**
- Ensure database is running (PostgreSQL) or file exists (SQLite)
- Check DATABASE_URL in .env
- Try deleting database and running `python -m app.core.db_init` again

**Import errors:**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

**Port already in use:**
- Change port: `uvicorn app.main:app --reload --port 8001`
- Update frontend `.env.local` with new port

### Frontend Issues

**API connection errors:**
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running
- Check browser console for CORS errors

**Build errors:**
- Delete `.next` folder: `rm -rf .next`
- Run `npm install` again
- Run `npm run dev`

### Common Issues

**Images not displaying:**
- Check backend is serving static files
- Verify image URLs in browser network tab
- Ensure uploads directory exists and is writable

**Invite tokens not working:**
- Check token is correct (no extra spaces)
- Verify contributor is active in database
- Check backend logs for errors

## Testing Checklist

- [ ] Admin can register and login
- [ ] Admin can create a wall
- [ ] Admin can invite contributors
- [ ] Contributor can access contribute page with token
- [ ] Contributor can post text-only content
- [ ] Contributor can post single image
- [ ] Contributor can post text + image
- [ ] Contributor can post multiple images (NEW)
- [ ] Contributor can post multiple images with text (NEW)
- [ ] Contributor can post multiple times
- [ ] Wall displays all content in mosaic layout
- [ ] Image carousel works (left/right navigation) (NEW)
- [ ] Text truncation works (Read More/Less) (NEW)
- [ ] Passcode protection works on wall view
- [ ] Admin can toggle wall visibility
- [ ] Admin can remove contributors
- [ ] Images are properly uploaded and displayed

## Next Steps

After testing locally:
1. Set up email service (Gmail, SendGrid, etc.) for production
2. Configure PostgreSQL for production
3. Deploy to Render (see DEPLOYMENT.md)
4. Set up proper file storage (S3, etc.) for production


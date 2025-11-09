# Setup Guide for WishingWall

## Local Development Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SECRET_KEY`: Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - `CORS_ORIGINS`: `["http://localhost:3000"]`
   - Email settings (optional for local dev)

5. **Initialize database:**
   ```bash
   python -m app.core.db_init
   ```

6. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   Server will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and set:
   - `NEXT_PUBLIC_API_URL`: `http://localhost:8000`

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## Database Setup

### Using PostgreSQL

1. Install PostgreSQL locally or use a cloud service
2. Create a database:
   ```sql
   CREATE DATABASE wishingwall;
   ```
3. Update `DATABASE_URL` in backend `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost/wishingwall
   ```

### Using SQLite (for quick testing)

1. Update `DATABASE_URL` in backend `.env`:
   ```
   DATABASE_URL=sqlite:///./wishingwall.db
   ```
2. Note: SQLite is not recommended for production

## Testing the Application

1. **Register an admin account:**
   - Go to `http://localhost:3000/login`
   - Click "Register"
   - Fill in your details

2. **Create a wall:**
   - After login, click "Create New Wall"
   - Enter title and description
   - Note the unique URL and passcode

3. **Invite a contributor:**
   - Go to the wall's admin page
   - Click "Invite Contributor"
   - Enter an email address
   - (Email will be sent if SMTP is configured, otherwise check console)

4. **Add content as contributor:**
   - Use the invite link or go to `/contribute?token=<invite_token>`
   - Add text, image, or both
   - Submit

5. **View the wall:**
   - Go to `/wall/<unique_url>`
   - Enter the passcode
   - View all contributions in mosaic layout

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Troubleshooting

### Backend Issues

- **Import errors**: Ensure you're in the virtual environment
- **Database errors**: Check DATABASE_URL and ensure database exists
- **Port already in use**: Change port with `--port 8001`

### Frontend Issues

- **API connection errors**: Check NEXT_PUBLIC_API_URL
- **Build errors**: Delete `.next` folder and rebuild
- **Type errors**: Run `npm run lint` to check

### Email Issues

- For local development, emails won't send unless SMTP is configured
- Check console logs for invite tokens
- Use invite token directly: `/contribute?token=<token>`


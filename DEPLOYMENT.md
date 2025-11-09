# Deployment Guide for WishingWall

## Prerequisites

1. Render account
2. PostgreSQL database (Render provides this)
3. SMTP email service (Gmail, SendGrid, etc.)

## Backend Deployment

### 1. Database Setup

1. Create a PostgreSQL database on Render
2. Note the internal database URL

### 2. Environment Variables

Set these in Render dashboard for the backend service:

- `DATABASE_URL`: PostgreSQL connection string (use Internal Database URL)
- `SECRET_KEY`: Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- `CORS_ORIGINS`: `https://wishingwall.app,https://www.wishingwall.app`
- `FRONTEND_URL`: `https://wishingwall.app` (for email links)
- `SMTP_HOST`: Your SMTP host (e.g., `smtp.gmail.com`)
- `SMTP_PORT`: `587`
- `SMTP_USER`: Your SMTP username
- `SMTP_PASSWORD`: Your SMTP password/app password
- `SMTP_FROM_EMAIL`: Email address to send from
- `DEBUG`: `False` (for production)

### 3. Deploy Backend

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Select the `backend` directory
4. Use these settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python 3

### 4. Initialize Database

After first deployment, run database migrations:

```bash
# SSH into Render instance or use Render shell
python -m app.core.db_init
```

## Frontend Deployment

### 1. Environment Variables

Set in Render dashboard:

- `NEXT_PUBLIC_API_URL`: `https://api.wishingwall.app` (or your backend subdomain)

### 2. Deploy Frontend

1. Create a new Web Service on Render
2. Select the `frontend` directory
3. Use these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

## Post-Deployment

1. **Set up custom domains:**
   - Frontend: Point `wishingwall.app` to your frontend service
   - Backend: Point `api.wishingwall.app` to your backend service (or use subdomain of your choice)
   - In Render: Go to service settings → Custom Domains → Add domain

2. **Update environment variables:**
   - Backend: Ensure `CORS_ORIGINS` includes `https://wishingwall.app`
   - Backend: Set `FRONTEND_URL=https://wishingwall.app`
   - Frontend: Set `NEXT_PUBLIC_API_URL=https://api.wishingwall.app`

3. Test email functionality

4. Test file uploads (ensure uploads directory is writable)

5. Verify SSL certificates are active (Render handles this automatically)

## Security Checklist

- [ ] SECRET_KEY is strong and unique
- [ ] Database credentials are secure
- [ ] CORS is properly configured
- [ ] SMTP credentials are secure
- [ ] File upload size limits are enforced
- [ ] Rate limiting is enabled
- [ ] HTTPS is enabled (Render does this automatically)

## Troubleshooting

### Database Connection Issues
- Check DATABASE_URL format
- Ensure database is accessible from Render
- Check firewall rules

### Email Not Sending
- Verify SMTP credentials
- Check SMTP port (587 for TLS)
- For Gmail, use App Password, not regular password

### File Upload Issues
- Ensure uploads directory exists and is writable
- Check file size limits
- Verify static file serving is configured


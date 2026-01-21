# Fly.io Deployment Guide for PickleJar

This guide covers deploying the PickleJar backend to Fly.io.

## Prerequisites

1. Install Fly.io CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Sign up/login: `fly auth login`
3. Have a PostgreSQL database ready (Fly Postgres or external like Supabase)

## Initial Setup

### 1. Create Fly.io App

```bash
# From project root
fly launch --no-deploy
```

This will:
- Detect the Dockerfile
- Create a `fly.toml` configuration (already provided)
- Ask you to choose a region (recommend: yyz for Toronto)

### 2. Set Required Secrets

```bash
# Database URL (REQUIRED - use your PostgreSQL connection string)
fly secrets set DATABASE_URL="postgresql://user:password@host:5432/database"

# Secret key for sessions (REQUIRED)
fly secrets set SECRET_KEY="$(openssl rand -hex 32)"

# Optional: CORS origins (if you need custom domains)
fly secrets set CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### 3. Deploy

```bash
fly deploy
```

## Database Options

### Option A: Fly Postgres (Recommended for Production)

```bash
# Create a Postgres cluster
fly postgres create --name picklejar-db

# Attach to your app
fly postgres attach picklejar-db

# This automatically sets DATABASE_URL secret
```

### Option B: Supabase (Good for MVP)

1. Create a Supabase project: https://supabase.com
2. Get connection string from Settings > Database
3. Set as secret:
```bash
fly secrets set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Option C: Other PostgreSQL Provider

Use any PostgreSQL provider (Neon, Railway, etc.) and set the DATABASE_URL accordingly.

## Verify Deployment

```bash
# Check app status
fly status

# View logs
fly logs

# Open in browser
fly open

# Check health endpoint
curl https://your-app.fly.dev/health

# View API docs
curl https://your-app.fly.dev/docs
```

## Environment Variables

Set via `fly secrets set KEY=VALUE`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `SECRET_KEY` | ✅ Yes | Random secret for sessions |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `DEBUG` | No | Set to "true" for debug mode (default: false) |
| `ENABLE_STRUCTURED_LOCATION` | No | Feature flag for accepting structured suggestion payloads; keep `false` until the DB columns are live |
| `TWILIO_*` | No | SMS verification (future feature) |
| `SMTP_*` | No | Email notifications (future feature) |

## Troubleshooting

### App Keeps Restarting

```bash
# Check logs for errors
fly logs

# Common issues:
# 1. Missing DATABASE_URL - set it via fly secrets
# 2. Database connection failed - verify connection string
# 3. Port binding issue - should be fixed in Dockerfile
```

### Database Connection Issues

```bash
# Test database connectivity
fly ssh console
python -c "from sqlalchemy import create_engine; import os; engine = create_engine(os.getenv('DATABASE_URL')); print(engine.connect())"
```

### View All Secrets

```bash
fly secrets list
```

### Update Secrets

```bash
fly secrets set KEY=NEW_VALUE
```

### Scale Resources

```bash
# Increase memory if needed
fly scale memory 512

# Scale to multiple machines
fly scale count 2
```

## Monitoring

```bash
# Live logs
fly logs --follow

# App metrics
fly dashboard

# SSH into machine
fly ssh console
```

## Updates

```bash
# Deploy new version
fly deploy

# Rollback if needed
fly releases
fly releases rollback <version>
```

## Cost Optimization

- Free tier includes 3 shared-cpu-1x VMs with 256MB RAM
- Auto-stop/start configured in fly.toml to minimize costs
- Consider Fly Postgres free tier or Supabase free tier for database

## Production Checklist

- [ ] Set strong SECRET_KEY
- [ ] Use production PostgreSQL database
- [ ] Set DEBUG=false
- [ ] Configure CORS_ORIGINS for your frontend domain
- [ ] Set up monitoring/alerts
- [ ] Configure backups for database
- [ ] Review fly.toml resource limits
- [ ] Test health check endpoint
- [ ] Verify API endpoints work
- [ ] Check logs for errors

## Frontend Integration

Update your frontend environment variables to point to Fly.io:

```env
NEXT_PUBLIC_API_URL=https://your-app.fly.dev
NEXT_PUBLIC_MAPBOX_TOKEN=pk.yourProductionTokenFromMapbox
NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION=false
```

Flip `NEXT_PUBLIC_ENABLE_STRUCTURED_LOCATION` (and ensure the backend `ENABLE_STRUCTURED_LOCATION` secret matches) only when you want the structured location picker live; otherwise leave it `false` so the classic suggestion form stays in place.

## Support

- Fly.io Docs: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- PickleJar Issues: https://github.com/yourusername/picklejar/issues
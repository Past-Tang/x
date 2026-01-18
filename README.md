# Twitter Monitor System

A comprehensive Twitter monitoring and auto-posting system with multi-account management.

## Features

- **Multi-Account AuthToken Management**: Store and manage multiple Twitter account tokens with encryption
- **Monitor Targets**: Track Twitter accounts and detect new tweets
- **Auto-Reply**: Automatically comment on new tweets using content templates
- **Auto-Post**: Schedule automated tweet posts with content rotation
- **Rate Limiting**: Built-in frequency control and random delays
- **Deduplication**: Prevent duplicate replies to the same tweet
- **Execution Logs**: Complete visibility into all operations

## Project Structure

```
├── backend/          # Flask backend
│   ├── models/       # Database models
│   ├── routes/       # API endpoints
│   ├── services/     # Business logic
│   ├── app.py        # Flask application factory
│   ├── config.py     # Configuration
│   └── run.py        # Entry point
│
└── frontend/         # React frontend
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   └── services/    # API client
    └── package.json
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

For development with debug mode enabled:
```bash
FLASK_DEBUG=true python run.py
```

The backend will run on http://localhost:5000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on http://localhost:3000

## API Endpoints

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `POST /api/accounts/:id/toggle-status` - Toggle account status

### Monitor Targets
- `GET /api/targets` - List targets
- `POST /api/targets` - Create target
- `PUT /api/targets/:id` - Update target
- `DELETE /api/targets/:id` - Delete target

### Reply Templates
- `GET /api/reply-templates` - List templates
- `POST /api/reply-templates` - Create template
- `PUT /api/reply-templates/:id` - Update template
- `DELETE /api/reply-templates/:id` - Delete template

### Post Jobs
- `GET /api/post-jobs` - List jobs
- `POST /api/post-jobs` - Create job
- `PUT /api/post-jobs/:id` - Update job
- `DELETE /api/post-jobs/:id` - Delete job
- `POST /api/post-jobs/:id/run` - Run job immediately

### Post Contents
- `GET /api/post-contents` - List contents
- `POST /api/post-contents` - Create content
- `PUT /api/post-contents/:id` - Update content
- `DELETE /api/post-contents/:id` - Delete content

### Logs
- `GET /api/logs` - List logs with filtering
- `GET /api/logs/stats` - Get log statistics

### Settings
- `GET /api/settings` - List settings
- `PUT /api/settings/:key` - Update setting
- `PUT /api/settings/batch` - Update multiple settings

## Configuration

Settings can be configured via the admin UI or directly in the database:

- `twitter_api_base_url` - Base URL for Twitter API
- `twitter_api_key` - API key for Twitter API
- `account_hourly_limit` - Max actions per account per hour
- `global_rate_limit` - Max API calls per minute globally
- `min_random_delay` / `max_random_delay` - Random delay range
- `account_failure_threshold` - Failures before marking account suspect
- `account_selection_strategy` - Selection strategy (round_robin, random, weighted)
- `reply_selection_strategy` - Template selection strategy

## Scheduler

The system includes a built-in scheduler that:
- Checks monitor targets every minute to see if any are due for checking
- Runs post jobs every minute to see if any are due for execution

To disable the scheduler (for development), set:
```bash
ENABLE_SCHEDULER=false python run.py
```

## Security

- Auth tokens are encrypted using Fernet symmetric encryption
- Tokens are displayed as masked values in the UI
- CORS is configured for API endpoints
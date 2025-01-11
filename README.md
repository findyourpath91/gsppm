# GSP Presentation Maker

A containerized Python application for generating presentations from Google Sheets data.

## Prerequisites

- Docker
- Docker Compose
- Google Cloud Platform credentials (if using GCP features)

## Setup

1. Clone the repository
2. Create `.env` file from `.env.template` and fill in required values
3. Build and run the container:

```bash
docker-compose up -d
```

## Configuration

Environment variables (set in `.env`):

- `PORT`: Application port (default: 8111)
- `GOOGLE_CREDENTIALS`: Path to Google credentials JSON file
- `TEMP_DIR`: Temporary file storage directory

## Usage

1. Access the application at: `http://localhost:8111`
2. Send POST requests to `/process` endpoint with presentation data

## Docker Deployment

To build and push the container:

```bash
docker-compose build --no-cache && \
docker tag gsppm findyourpath91/gsp_presentationmaker:0.0.1.Release && \
docker push findyourpath91/gsp_presentationmaker:0.0.1.Release
```

## Google Sheets Script

The Google Apps Script code for integration with Google Sheets is available in [google_sheets_script.js](./google_sheets_script.js).

To use the script:
1. Open your Google Sheets document
2. Go to Extensions > Apps Script
3. Copy and paste the contents of google_sheets_script.js
4. Save and authorize the script
5. Reload your Google Sheets document to see the custom menu

## Maintenance

- View logs: `docker-compose logs -f`
- Stop container: `docker-compose down`
- Update container: `docker-compose pull && docker-compose up -d`

## Troubleshooting

- Check container logs for errors
- Verify environment variables are set correctly
- Ensure required ports are open

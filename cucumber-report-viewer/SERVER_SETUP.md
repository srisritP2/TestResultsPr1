# Server Setup for Report Uploads

This document explains how to set up the backend server for handling report uploads and automatic index generation.

## Overview

The server provides API endpoints to:
- Upload reports to the `public/TestResultsJsons` folder
- Automatically generate/update the `index.json` file
- List, view, and delete uploaded reports
- Serve the reports for GitHub Pages

## Installation

1. Install the required dependencies:
```bash
npm install express cors concurrently
```

2. Start the development server (both frontend and backend):
```bash
npm run dev
```

Or start just the backend server:
```bash
npm run server
```

## API Endpoints

### POST /api/upload-report
Upload a new report and update the index.

**Request Body:**
```json
{
  "reportId": "report-123456789",
  "reportData": { "features": [...] },
  "name": "My Test Report"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report uploaded successfully",
  "filename": "report-123456789-2024-01-15T10-30-00-000Z.json",
  "reportId": "report-123456789",
  "url": "/TestResultsJsons/report-123456789-2024-01-15T10-30-00-000Z.json"
}
```

### GET /api/reports
Get list of available reports from index.json.

**Response:**
```json
{
  "success": true,
  "reports": [...]
}
```

### DELETE /api/reports/:filename
Delete a specific report file and update index.

### POST /api/regenerate-index
Manually trigger index regeneration.

### GET /api/health
Health check endpoint.

## Environment Variables

- `PORT`: Server port (default: 3001)
- `VUE_APP_API_URL`: API base URL for frontend (default: http://localhost:3001/api)

## How It Works

1. **Upload Process:**
   - User selects a JSON file in the frontend
   - Frontend sends the file data to `/api/upload-report`
   - Server saves the file to `public/TestResultsJsons/`
   - Server runs the `generate-index-enhanced.js` script
   - Index.json is updated with the new report

2. **Fallback Strategy:**
   - If server is not available, reports are saved to localStorage
   - Users can still view reports in the current session
   - When server becomes available, reports can be re-uploaded

3. **GitHub Pages Integration:**
   - All files in `public/TestResultsJsons/` are served by GitHub Pages
   - The updated `index.json` makes reports discoverable
   - Reports are accessible via direct URLs

## Development vs Production

### Development
- Run `npm run dev` to start both frontend and backend
- Backend runs on port 3001, frontend on port 8080
- CORS is enabled for cross-origin requests

### Production
- Build the frontend: `npm run build`
- Deploy the `dist/` folder to GitHub Pages
- Run the server separately: `npm start`
- Or use a process manager like PM2

## Troubleshooting

### Server Not Starting
- Check if port 3001 is available
- Ensure all dependencies are installed
- Check the console for error messages

### Upload Failures
- Verify the server is running (`GET /api/health`)
- Check network connectivity
- Ensure the `public/TestResultsJsons` directory exists
- Check file permissions

### Index Not Updating
- Verify `generate-index-enhanced.js` exists
- Check if Node.js can execute the script
- Look for errors in server logs
- Try manual regeneration: `POST /api/regenerate-index`

## Security Considerations

- The server accepts any JSON data - add validation in production
- No authentication is implemented - add auth for production use
- File size limits should be enforced
- Consider rate limiting for uploads
- Sanitize file names and paths

## Future Enhancements

- Add authentication and user management
- Implement file size and type validation
- Add compression for large reports
- Support for batch uploads
- Report versioning and history
- Integration with CI/CD pipelines
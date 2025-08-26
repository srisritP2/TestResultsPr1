# Report Deletion and Sync Management - Requirements

## Introduction

This feature addresses a critical flaw in the current system where delete buttons exist but don't actually remove files from GitHub Pages static hosting. The system needs to handle both local development (full CRUD) and GitHub Pages deployment (static hosting limitations) through a hybrid storage approach.

## Requirements

### Requirement 1: Enhanced Delete Functionality

**User Story:** As a developer, I want to delete reports in local development and have them actually removed from the filesystem, so that the delete functionality works as expected.

#### Acceptance Criteria
1. WHEN a user clicks delete in localhost THEN the system SHALL remove the report file from TestResultsJsons/ directory
2. WHEN a report is deleted locally THEN the system SHALL update index.json to remove the report reference
3. WHEN a report is deleted locally THEN the system SHALL regenerate statistics and UI immediately
4. WHEN a user confirms deletion THEN the system SHALL show confirmation dialog before proceeding
5. IF deletion fails THEN the system SHALL show appropriate error message and maintain data integrity

### Requirement 2: GitHub Pages Soft Delete Management

**User Story:** As a user accessing GitHub Pages, I want deleted reports to not appear in the collection, so that I only see active reports even though files may still exist on the server.

#### Acceptance Criteria
1. WHEN a report is marked as deleted THEN the system SHALL exclude it from index.json display list
2. WHEN GitHub Pages loads reports THEN the system SHALL only show reports marked as active
3. WHEN a deleted report file still exists on GitHub Pages THEN the system SHALL handle it gracefully without errors
4. IF a user tries to access a deleted report directly THEN the system SHALL show appropriate "not found" message
5. WHEN index.json is generated THEN the system SHALL include deletion status for each report

### Requirement 3: Local and GitHub Pages Sync Management

**User Story:** As a developer, I want to track which reports exist locally vs on GitHub Pages, so that I can manage synchronization and cleanup effectively.

#### Acceptance Criteria
1. WHEN working locally THEN the system SHALL track which reports are local-only vs published
2. WHEN a report is deleted locally THEN the system SHALL mark it for cleanup on next deployment
3. WHEN viewing reports THEN the system SHALL show sync status indicators (local, published, deleted, pending-cleanup)
4. IF there are sync conflicts THEN the system SHALL provide resolution options
5. WHEN deploying THEN the system SHALL clean up files marked for deletion

### Requirement 4: Storage State Management

**User Story:** As a system, I need to maintain consistent state between localStorage, server storage, and GitHub Pages, so that users see accurate information regardless of environment.

#### Acceptance Criteria
1. WHEN a report is uploaded THEN the system SHALL track it in all relevant storage layers
2. WHEN a report is deleted THEN the system SHALL update state consistently across all layers
3. WHEN localStorage is cleared THEN the system SHALL rebuild state from server data
4. IF state becomes inconsistent THEN the system SHALL provide recovery mechanisms
5. WHEN switching between local and GitHub Pages THEN the system SHALL maintain consistent user experience

### Requirement 5: Deployment Cleanup Process

**User Story:** As a deployment process, I want to automatically clean up deleted files during GitHub Pages deployment, so that the live site stays clean and doesn't accumulate deleted files.

#### Acceptance Criteria
1. WHEN deploying to GitHub Pages THEN the system SHALL remove files marked for deletion
2. WHEN cleanup runs THEN the system SHALL update index.json to remove deleted report references
3. WHEN cleanup completes THEN the system SHALL log what was cleaned up
4. IF cleanup fails THEN the system SHALL not break the deployment but log errors
5. WHEN cleanup is successful THEN the system SHALL commit the changes automatically

### Requirement 6: User Experience Enhancements

**User Story:** As a user, I want clear feedback about deletion operations and report status, so that I understand what's happening and can take appropriate actions.

#### Acceptance Criteria
1. WHEN hovering over delete button THEN the system SHALL show tooltip explaining the action
2. WHEN deletion is in progress THEN the system SHALL show loading indicator
3. WHEN deletion completes THEN the system SHALL show success message and update UI immediately
4. WHEN viewing reports THEN the system SHALL show status badges (active, deleted, pending-cleanup)
5. IF there are pending cleanups THEN the system SHALL show summary of what needs deployment
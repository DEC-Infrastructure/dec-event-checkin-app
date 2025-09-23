/**
 * Client-side Configuration File for Event Check-In Application
 * 
 * This configuration is loaded by the browser and provides fallback values
 * when the server configuration is not available.
 */

const CONFIG = {
    // API Endpoints - these will be overridden by server configuration
    LOOKUP_ENDPOINT: 'https://automation.decjobboard.online/webhook/lookup-checkin',
    UPDATE_ENDPOINT: 'https://automation.decjobboard.online/webhook/update-checkin',

    // Application Settings
    APP_NAME: 'Event Check-In',
    VERSION: '1.0.0',
    ENVIRONMENT: 'development'
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

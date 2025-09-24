/**
 * Event Check-In Application
 * 
 * This script handles:
 * - Email validation
 * - JWT token generation using Web Crypto API (HS256)
 * - API integration for check-in lookup and update
 * - Response handling and UI updates
 * - Preloader/spinner management
 */

// Configuration variables - will be loaded from server or fallback to defaults
let LOOKUP_ENDPOINT = 'https://automation.decjobboard.online/webhook/lookup-checkin';
let UPDATE_ENDPOINT = 'https://automation.decjobboard.online/webhook/update-checkin';

// Store current attendee data for update operations
let currentAttendeeData = null;

// DOM Elements
const checkinForm = document.getElementById('checkinForm');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('emailError');
const submitBtn = document.getElementById('submitBtn');
const preloader = document.getElementById('preloader');
const responseSection = document.getElementById('responseSection');

/**
 * JWT Token Generation (Secure Server-Side)
 * 
 * Requests a JWT token from the server to ensure JWT_SECRET is never exposed to the client.
 * This is the secure way to handle JWT generation.
 * 
 * @returns {string} JWT token from server
 */
async function getJWT() {
    try {
        const response = await fetch('/api/generate-jwt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.token;
    } catch (error) {
        console.error('Error requesting JWT token:', error);
        throw new Error('Failed to get JWT token from server');
    }
}

/**
 * Email Validation
 * 
 * Validates email format using HTML5 built-in validation and custom regex
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && emailInput.checkValidity();
}

/**
 * Show/Hide Preloader
 * 
 * Controls the visibility of the loading spinner during API calls
 * @param {boolean} show - Whether to show the preloader
 */
function togglePreloader(show) {
    if (show) {
        preloader.classList.add('show');
        submitBtn.disabled = true;
        responseSection.innerHTML = '';
    } else {
        preloader.classList.remove('show');
        submitBtn.disabled = false;
    }
}

/**
 * Display API Response
 * 
 * Handles different response types and updates the UI accordingly
 * @param {Object} response - API response object
 * @param {string} email - Email address for the request
 */
function displayResponse(response, email) {
    const { status, message, attendee } = response;


    let responseHtml = '';
    let responseClass = '';

    switch (status) {
        case 'NOT_FOUND':
            responseClass = 'not-found';
            responseHtml = `
                <div class="response-message ${responseClass}">
                    <h3>Attendee Not Found</h3>
                    <p>${message || 'No attendee found with this email address.'}</p>
                </div>
            `;
            break;

        case 'ALREADY_CHECKED_IN':
            responseClass = 'already-checked-in';
            responseHtml = `
                <div class="response-message ${responseClass}">
                    <h3>Already Checked In</h3>
                    <p>${message || 'This attendee has already been checked in.'}</p>
                    ${attendee ? renderAttendeeDetails(attendee) : ''}
                </div>
            `;
            break;

        case 'CAN_CHECK_IN':
            responseClass = 'can-check-in';
            // Store attendee data for later use in update operation
            currentAttendeeData = attendee;
            responseHtml = `
                <div class="response-message ${responseClass}">
                    <h3>Ready to Check In</h3>
                    <p>${message || 'This attendee is ready to be checked in.'}</p>
                    ${attendee ? renderAttendeeDetails(attendee) : ''}
                    <button class="update-btn" onclick="updateAttendeeStatus('${email}')">
                        Update Attendee Status
                    </button>
                </div>
            `;
            break;

        case 'SUCCESS':
            responseClass = 'success';
            responseHtml = `
                <div class="response-message ${responseClass}">
                    <h3>Check-In Successful</h3>
                    <p>This attendee has been successfully checked in!</p>
                    ${attendee ? renderAttendeeDetails(attendee) : ''}
                </div>
            `;
            break;

        default:
            responseClass = 'not-found';
            responseHtml = `
                <div class="response-message ${responseClass}">
                    <h3>Error</h3>
                    <p>${message || 'An unexpected error occurred.'}</p>
                </div>
            `;
    }

    responseSection.innerHTML = responseHtml;
}

/**
 * Render Attendee Details
 * 
 * Creates HTML for displaying attendee information consistently
 * @param {Object} attendee - Attendee object from API
 * @returns {string} HTML string for attendee details
 */
function renderAttendeeDetails(attendee) {
    console.log('renderAttendeeDetails called with:', attendee);

    if (!attendee) {
        console.log('No attendee data provided');
        return '';
    }

    const formatTime = (timeString) => {
        if (!timeString || timeString === 'null' || timeString === '') return 'Not specified';
        try {
            return new Date(timeString).toLocaleString();
        } catch (e) {
            return timeString;
        }
    };

    // Handle different API response formats
    const name = attendee.fullName || attendee.Name || 'Not specified';
    const email = attendee.email || attendee.Email || 'Not specified';

    // Debug: Log the extracted values
    console.log('Extracted name:', name);
    console.log('Extracted email:', email);
    const phone = attendee.phone || attendee.PhoneNumber || attendee.Phone || null;
    const profession = attendee.profession || attendee.Profession || null;
    const experienceLevel = attendee.experienceLevel || attendee.ExperienceLevel || null;
    const gender = attendee.gender || attendee.Gender || null;
    const registrationDate = attendee['Registration Date'] || attendee.RegistrationDate || null;
    const checkInTime = attendee.checkInTime || attendee.CheckInTime || attendee['CheckIn Time'] || null;

    let html = `
        <div class="attendee-details">
            <h4>Attendee Information</h4>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${email}</span>
            </div>`;

    // Add optional fields if they exist
    if (phone) {
        html += `
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${phone}</span>
            </div>`;
    }

    if (profession) {
        html += `
            <div class="detail-row">
                <span class="detail-label">Profession:</span>
                <span class="detail-value">${profession}</span>
            </div>`;
    }

    if (experienceLevel) {
        html += `
            <div class="detail-row">
                <span class="detail-label">Experience Level:</span>
                <span class="detail-value">${experienceLevel}</span>
            </div>`;
    }

    if (gender) {
        html += `
            <div class="detail-row">
                <span class="detail-label">Gender:</span>
                <span class="detail-value">${gender}</span>
            </div>`;
    }

    if (registrationDate) {
        html += `
            <div class="detail-row">
                <span class="detail-label">Registration Date:</span>
                <span class="detail-value">${formatTime(registrationDate)}</span>
            </div>`;
    }

    html += `
            <div class="detail-row">
                <span class="detail-label">Check-in Time:</span>
                <span class="detail-value">${formatTime(checkInTime)}</span>
            </div>
        </div>`;

    return html;
}

/**
 * Update Attendee Status
 * 
 * Sends POST request to update check-in status for an attendee
 * @param {string} email - Email address of the attendee
 */
async function updateAttendeeStatus(email) {
    const updateBtn = document.querySelector('.update-btn');
    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.textContent = 'Updating...';
    }

    try {
        // Get current timestamp in ISO format
        const currentTime = new Date().toISOString();

        const requestBody = {
            Email: email,
            CheckIn: true,
            'CheckIn Time': currentTime
        };

        const jwtToken = await getJWT();
        const response = await fetch(UPDATE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Update UI to show success with preserved attendee data
        displayResponse({
            status: 'SUCCESS',
            message: 'Check-in completed successfully',
            attendee: {
                ...currentAttendeeData || {},
                checkInTime: currentTime,
                CheckInTime: currentTime,
                'CheckIn Time': currentTime
            }
        }, email);

        // Fire-and-forget: trigger confirmation email (server-side only, no secrets exposed)
        try {
            const name = (currentAttendeeData && (currentAttendeeData.fullName || currentAttendeeData.Name)) || '';
            await fetch('/api/send-checkin-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toEmail: email, fullName: name, checkInTime: currentTime })
            });
        } catch (e) {
            // Intentionally non-blocking; log for diagnostics only
            console.log('Email send trigger failed:', e.message);
        }

    } catch (error) {
        console.error('Error updating attendee status:', error);

        // Show error message
        responseSection.innerHTML = `
            <div class="response-message not-found">
                <h3>Update Failed</h3>
                <p>Failed to update attendee status. Please try again.</p>
                <p style="font-size: 0.8rem; margin-top: 10px; color: #999;">
                    Error: ${error.message}
                </p>
            </div>
        `;
    }

    // Re-enable button
    if (updateBtn) {
        updateBtn.disabled = false;
        updateBtn.textContent = 'Update Attendee Status';
    }
}

/**
 * Handle Form Submission
 * 
 * Main function that orchestrates the check-in lookup process
 * @param {Event} event - Form submission event
 */
async function handleFormSubmission(event) {
    event.preventDefault();

    const email = emailInput.value.trim();

    // Clear previous errors
    emailError.textContent = '';

    // Validate email
    if (!validateEmail(email)) {
        emailError.textContent = 'Please enter a valid email address';
        emailInput.focus();
        return;
    }

    // Clear previous attendee data and show preloader
    currentAttendeeData = null;
    togglePreloader(true);

    try {
        // Prepare request body
        const requestBody = {
            Email: email
        };

        // Make API request
        const jwtToken = await getJWT();
        const response = await fetch(LOOKUP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Display response
        displayResponse(result, email);

    } catch (error) {
        console.error('Error checking attendee status:', error);

        // Display error message
        responseSection.innerHTML = `
            <div class="response-message not-found">
                <h3>Connection Error</h3>
                <p>Failed to check attendee status. Please check your connection and try again.</p>
                <p style="font-size: 0.8rem; margin-top: 10px; color: #999;">
                    Error: ${error.message}
                </p>
            </div>
        `;
    } finally {
        // Hide preloader
        togglePreloader(false);
    }
}

/**
 * Real-time Email Validation
 * 
 * Provides immediate feedback as user types
 */
function setupEmailValidation() {
    emailInput.addEventListener('input', function () {
        const email = this.value.trim();

        if (email && !validateEmail(email)) {
            emailError.textContent = 'Please enter a valid email address';
        } else {
            emailError.textContent = '';
        }
    });

    emailInput.addEventListener('blur', function () {
        const email = this.value.trim();

        if (email && !validateEmail(email)) {
            emailError.textContent = 'Please enter a valid email address';
        }
    });
}

/**
 * Load Configuration from Server
 * 
 * Attempts to load environment variables from the server's /api/config endpoint
 * Falls back to local config if server is not available
 */
async function loadConfiguration() {
    try {
        // Try to load from server first
        const response = await fetch('/api/config');
        if (response.ok) {
            const config = await response.json();
            LOOKUP_ENDPOINT = config.LOOKUP_ENDPOINT || LOOKUP_ENDPOINT;
            UPDATE_ENDPOINT = config.UPDATE_ENDPOINT || UPDATE_ENDPOINT;
            console.log('Configuration loaded from server');
            return;
        }
    } catch (error) {
        console.log('Server config not available, using fallback configuration');
    }

    // Fallback to local config if available
    if (window.CONFIG) {
        LOOKUP_ENDPOINT = window.CONFIG.LOOKUP_ENDPOINT || LOOKUP_ENDPOINT;
        UPDATE_ENDPOINT = window.CONFIG.UPDATE_ENDPOINT || UPDATE_ENDPOINT;
        console.log('Configuration loaded from local config');
    } else {
        console.log('Using default configuration');
    }
}

/**
 * Initialize Application
 * 
 * Sets up event listeners and loads configuration
 */
async function initializeApp() {
    // Load configuration first
    await loadConfiguration();

    // Form submission handler
    checkinForm.addEventListener('submit', handleFormSubmission);

    // Email validation setup
    setupEmailValidation();

    // Clear response when user starts typing new email
    emailInput.addEventListener('input', function () {
        if (responseSection.innerHTML) {
            responseSection.innerHTML = '';
        }
    });

    console.log('Event Check-In application initialized');
    console.log('JWT tokens will be generated securely on the server');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

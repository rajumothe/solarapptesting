// SECURITY NOTE: Token Storage
// 
// Current Implementation: localStorage
// Risk: Vulnerable to XSS attacks if attacker can inject JavaScript
// 
// RECOMMENDATIONS FOR PRODUCTION:
// 1. Use HttpOnly Secure Cookies (Recommended)
//    - Inaccessible to JavaScript, preventing XSS token theft
//    - Secure flag: only sent over HTTPS
//    - SameSite attribute: prevents CSRF attacks
//
// 2. Implementation Steps:
//    a. Backend: Set cookie with HttpOnly, Secure, SameSite flags
//       res.cookie('authToken', token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'strict',
//         maxAge: 24 * 60 * 60 * 1000
//       });
//    
//    b. Frontend: Remove localStorage usage
//    c. Axios will automatically send cookies with requests
//
// 3. Alternative: Double Submit Cookie Pattern
//    - Store token in both httpOnly cookie and regular cookie
//    - CSRF token in regular cookie, verified on backend
//
// 4. Token Refresh Strategy:
//    - Issue short-lived access tokens (15 minutes)
//    - Use refresh tokens (7 days) in httpOnly cookies
//    - Implement token rotation on each refresh
//
// CURRENT IMPLEMENTATION (DEVELOPMENT ONLY):
// localStorage is used for development ease but should be replaced
// with secure cookie mechanism before production deployment.

export const securityConfig = {
    tokenStorageMethod: 'localStorage', // Change to 'httpOnly' for production
    tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
    useSecureCookies: process.env.NODE_ENV === 'production',
    corsCredentials: true
};

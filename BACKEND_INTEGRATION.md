# Backend Integration Guide

This document explains how the frontend has been integrated with the backend authentication service.

## Features Implemented

### 1. Backend API Integration
- **Login**: Email/password authentication with the backend
- **Registration**: User registration with first name, last name, email, password, and optional phone
- **Token Management**: Automatic token storage and refresh
- **Logout**: Proper session cleanup on both frontend and backend
- **Profile Management**: Get and update user profile
- **Password Management**: Change password and password reset functionality
- **Session Management**: View and manage active sessions

### 2. Google OAuth Integration
- **Google Sign-In**: Maintained existing Google OAuth functionality
- **Hybrid Authentication**: Users can choose between email/password or Google OAuth

### 3. Enhanced User Experience
- **Loading States**: Visual feedback during API calls
- **Error Handling**: Comprehensive error messages
- **Form Validation**: Client-side validation with backend integration
- **Remember Me**: Option to extend session duration
- **Responsive Design**: Mobile-friendly login/registration forms

## API Endpoints Used

The frontend integrates with the following backend endpoints:

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh-token` - Token refresh
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile
- `PUT /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/forgot-password` - Send password reset email
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/auth/validate-token` - Validate access token
- `GET /api/v1/auth/sessions` - Get active sessions
- `DELETE /api/v1/auth/sessions/:id` - Deactivate specific session
- `DELETE /api/v1/auth/sessions` - Deactivate all sessions

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3001/api/v1

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
```

## Setup Instructions

### 1. Backend Setup
1. Start the backend authentication service:
   ```bash
   cd gc_backend/backend/services/auth-service
   npm install
   npm start
   ```

2. Ensure the backend is running on `http://localhost:3001`

### 2. Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create `.env` file with the environment variables above

3. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
5. Set Application type to "Web application"
6. Add `http://localhost:5173` to Authorized JavaScript origins
7. Copy the Client ID and update `VITE_GOOGLE_CLIENT_ID` in your `.env` file

## Authentication Flow

### Email/Password Authentication
1. User enters credentials in the login form
2. Frontend sends request to `/api/v1/auth/login`
3. Backend validates credentials and returns user data + tokens
4. Frontend stores tokens in localStorage
5. User is redirected to the home page

### Google OAuth Authentication
1. User clicks "Sign in with Google"
2. Google OAuth popup opens
3. User authorizes the application
4. Frontend receives Google user data
5. User is logged in (no backend token required for Google auth)

### Token Management
- Access tokens are automatically included in API requests
- Refresh tokens are used to get new access tokens when they expire
- If refresh fails, user is automatically logged out
- Tokens are stored securely in localStorage

## Error Handling

The integration includes comprehensive error handling:
- Network errors are caught and displayed to users
- Validation errors from the backend are shown
- Token expiration is handled automatically
- Loading states prevent multiple submissions

## Security Features

- JWT tokens are used for authentication
- Tokens are automatically refreshed before expiration
- Sensitive data is not stored in plain text
- CORS is properly configured
- Input validation on both frontend and backend

## Testing

To test the integration:

1. **Registration**: Try creating a new account with the registration form
2. **Login**: Test login with existing credentials
3. **Google OAuth**: Test Google sign-in functionality
4. **Token Refresh**: Leave the app open for token expiration to test refresh
5. **Logout**: Test logout functionality
6. **Session Management**: Check active sessions in the backend

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend CORS configuration includes your frontend URL
2. **Token Refresh Fails**: Check if refresh tokens are being stored correctly
3. **Google OAuth Not Working**: Verify Google Client ID and redirect URI
4. **API Connection Failed**: Ensure backend is running and accessible

### Debug Mode

Enable debug logging by opening browser developer tools and checking the console for detailed error messages.

## Future Enhancements

- Add password strength indicator
- Implement two-factor authentication
- Add social login options (Facebook, Twitter, etc.)
- Add user profile picture upload
- Implement email verification flow
- Add password reset UI
- Add session management UI

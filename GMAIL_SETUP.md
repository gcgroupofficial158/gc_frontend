# Gmail Login Setup Instructions

## Google OAuth Configuration

To enable Gmail login functionality, you need to set up Google OAuth credentials:

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Identity API** (formerly Google+ API)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set Application type to **"Web application"**
6. Add your domain to **Authorized JavaScript origins**:
   - For development: `http://localhost:5173`
   - For production: your actual domain
7. Copy the **Client ID**

**Note**: This implementation uses Google Identity Services (client-side) which is more secure and doesn't require server-side libraries.

### 2. Environment Configuration

1. Copy `env.example` to `.env` in the frontend directory
2. Replace `your-google-client-id-here` with your actual Google Client ID

```bash
cp env.example .env
```

Then edit `.env`:
```
VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
```

### 3. Features Implemented

- ✅ **Dual Authentication Options**: Users can choose between Gmail OAuth or traditional email/password
- ✅ **Gmail OAuth Integration**: One-click login with Google accounts
- ✅ **Traditional Login**: Email/password authentication with validation
- ✅ **User Data Storage**: Complete user profiles stored in React Context
- ✅ **Persistent Login State**: Login state persists across browser sessions using localStorage
- ✅ **Modern UI Design**: Clean, responsive interface with clear separation of login options
- ✅ **Error Handling**: Comprehensive error handling for both authentication methods
- ✅ **Loading States**: Proper loading indicators and user feedback

### 4. User Data Structure

**Gmail Login User Data:**
```javascript
{
  id: "google-user-id",
  email: "user@gmail.com",
  name: "User Name",
  picture: "profile-picture-url",
  email_verified: true,
  provider: "google"
}
```

**Traditional Login User Data:**
```javascript
{
  id: "user_timestamp",
  email: "user@example.com",
  name: "username", // derived from email prefix
  provider: "email",
  email_verified: true
}
```

### 5. Usage

The login page now provides **two clear authentication options**:

**Option 1: Quick Sign In with Google**
- One-click authentication using Google accounts
- Automatically retrieves user profile information
- No need to remember passwords

**Option 2: Traditional Email/Password Login**
- Enter email and password manually
- Form validation and error handling
- Perfect for users who prefer traditional login

**Common Features:**
- Automatic redirection after successful login
- Persistent login state across browser sessions
- User profile information displayed in navbar
- Secure logout functionality

### 6. Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

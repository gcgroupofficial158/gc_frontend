# 🔧 Environment Configuration Setup

## **Environment-Based URL Configuration**

### **Development Environment (.env.development)**
```env
# Development Environment Configuration
VITE_NODE_ENV=development

# Backend API Configuration
VITE_API_BASE_URL_DEV=http://localhost:3001/api/v1
VITE_API_BASE_URL_PROD=https://your-backend-domain.com/api/v1

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GOOGLE_REDIRECT_URI_DEV=http://localhost:5173
VITE_GOOGLE_REDIRECT_URI_PROD=https://gc-frontend-ten.vercel.app
```

### **Production Environment (Vercel)**
```env
# Production Environment Configuration
VITE_NODE_ENV=production

# Backend API Configuration
VITE_API_BASE_URL_DEV=http://localhost:3001/api/v1
VITE_API_BASE_URL_PROD=https://your-backend-domain.com/api/v1

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GOOGLE_REDIRECT_URI_DEV=http://localhost:5173
VITE_GOOGLE_REDIRECT_URI_PROD=https://gc-frontend-ten.vercel.app
```

---

## **🎯 How It Works**

### **Automatic Environment Detection:**
- **Development:** Uses `VITE_API_BASE_URL_DEV` and `VITE_GOOGLE_REDIRECT_URI_DEV`
- **Production:** Uses `VITE_API_BASE_URL_PROD` and `VITE_GOOGLE_REDIRECT_URI_PROD`

### **Fallback Mode:**
- **When backend is not available:** Automatically switches to mock data
- **No backend required:** App works completely offline
- **Seamless experience:** Users don't notice the difference

### **Environment Info Display:**
- **Login page shows:** Current environment and backend status
- **Console logs:** Detailed configuration info in development
- **Visual indicators:** Green dot for connected, warning for fallback

---

## **🚀 Setup Instructions**

### **Step 1: Create Environment Files**

**Development (.env.development):**
```bash
cd /home/kishlay/per/frontend
cp env.example .env.development
```

**Production (.env.production):**
```bash
cp env.example .env.production
```

### **Step 2: Configure Vercel Environment Variables**

**In Vercel Dashboard:**
1. Go to your project settings
2. Environment Variables section
3. Add these variables:

```env
VITE_NODE_ENV=production
VITE_API_BASE_URL_DEV=http://localhost:3001/api/v1
VITE_API_BASE_URL_PROD=https://your-backend-domain.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
VITE_GOOGLE_REDIRECT_URI_DEV=http://localhost:5173
VITE_GOOGLE_REDIRECT_URI_PROD=https://gc-frontend-ten.vercel.app
```

### **Step 3: Test Both Environments**

**Development Testing:**
```bash
npm run dev
# Should use localhost URLs
```

**Production Testing:**
```bash
npm run build
npm run preview
# Should use production URLs
```

---

## **🎯 Features**

### **✅ Environment Detection:**
- Automatically detects development vs production
- Uses appropriate URLs for each environment
- Console logging in development mode

### **✅ Fallback Mode:**
- Works when backend is not available
- Mock data for all authentication endpoints
- Seamless user experience

### **✅ Google OAuth:**
- Different redirect URIs for dev/prod
- Automatic environment-based configuration
- Works in both modes

### **✅ Visual Feedback:**
- Environment status on login page
- Backend connection status
- Clear indicators for testing mode

---

## **🎯 Benefits**

### **Development:**
- Easy local development
- No backend required for frontend work
- Clear environment indicators

### **Production:**
- Automatic production configuration
- Fallback mode for reliability
- Easy deployment to Vercel

### **Testing:**
- Works without backend
- Mock data for all features
- Easy to test different scenarios

**Your app now works in both development and production environments with automatic fallback!** 🚀

# ResearchNet Frontend

A comprehensive research platform frontend built with React, featuring paper publishing, networking, and collaboration tools for researchers.

## 🚀 Features

### 📊 Dashboard
- **Overview Statistics**: Track published papers, pending reviews, connections, and citations
- **Quick Actions**: Easy access to publish papers and browse research
- **Recent Activity**: Monitor your research activity and engagement
- **Modern UI**: Clean, responsive design with intuitive navigation

### 📝 Paper Publishing
- **Comprehensive Form**: Detailed paper submission with all necessary fields
- **Author Management**: Add multiple authors with affiliations
- **File Upload**: PDF upload with validation
- **Categories**: Organized by research fields (Computer Science, Physics, etc.)
- **Metadata**: DOI, keywords, funding sources, acknowledgments
- **Review Process**: Simulated submission and review workflow

### 📚 Research Papers
- **Browse & Search**: Find papers by title, author, keywords, or category
- **Filtering**: Filter by category and sort by date, citations, or downloads
- **Paper Cards**: Rich paper previews with abstracts, authors, and metrics
- **Statistics**: View citations and download counts
- **Responsive Grid**: Optimized for all screen sizes

### 👥 Research Network
- **Connections**: Manage your research network and collaborations
- **Suggestions**: Discover researchers based on mutual connections
- **Profiles**: View detailed researcher profiles with specializations
- **Statistics**: Track network growth and engagement
- **Connect/Disconnect**: Easy network management

### 👤 Profile Management
- **Personal Info**: Update name, email, phone, and affiliation
- **Professional Details**: Specialization, bio, research interests
- **Online Presence**: Website, ORCID, Google Scholar integration
- **Education & Experience**: Academic and professional background
- **Avatar Support**: Profile picture management

### 🔐 Authentication
- **Email/Password**: Traditional authentication with backend integration
- **Google OAuth**: Social login with Google
- **Token Management**: Automatic token refresh and session handling
- **Protected Routes**: Secure access to all features
- **Form Validation**: Client-side validation with error handling

## 🛠️ Technology Stack

- **React 18**: Modern React with hooks and functional components
- **React Router**: Client-side routing and navigation
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Context API**: State management for authentication and user data
- **Fetch API**: HTTP requests with automatic token handling
- **Vite**: Fast build tool and development server

## 📁 Project Structure

```
src/
├── api/
│   ├── authApi.js          # Backend API integration
│   ├── googleAuth.js       # Google OAuth service
│   └── apiInterceptor.js    # Automatic token refresh
├── components/
│   ├── Navbar.jsx          # Main navigation
│   ├── ProtectedRoute.jsx  # Route protection
│   ├── Sidebar.jsx         # Sidebar component
│   ├── Feed.jsx           # Feed component
│   └── Rightbar.jsx       # Right sidebar
├── contexts/
│   └── AuthContext.jsx     # Authentication context
├── pages/
│   ├── Login.jsx          # Login/Register page
│   ├── Dashboard.jsx      # Main dashboard
│   ├── PublishPaper.jsx   # Paper publishing form
│   ├── Papers.jsx         # Browse research papers
│   ├── Network.jsx        # Research network
│   ├── Profile.jsx        # User profile management
│   └── Home.jsx           # Redirect to dashboard
├── App.jsx                # Main app component
└── main.jsx              # App entry point
```

## 🎨 UI/UX Features

### Design System
- **Consistent Colors**: Blue primary theme with semantic colors
- **Typography**: Clear hierarchy with proper font weights
- **Spacing**: Consistent padding and margins using Tailwind
- **Icons**: SVG icons for better scalability
- **Responsive**: Mobile-first design approach

### User Experience
- **Loading States**: Visual feedback during API calls
- **Error Handling**: Comprehensive error messages and validation
- **Success Feedback**: Confirmation messages for actions
- **Navigation**: Intuitive navigation with breadcrumbs
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Interactive Elements
- **Hover Effects**: Smooth transitions and hover states
- **Form Validation**: Real-time validation with error messages
- **File Upload**: Drag-and-drop file upload interface
- **Search & Filter**: Instant search with filtering options
- **Modal Dialogs**: Clean modal interfaces for actions

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running (optional for demo)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api/v1
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_GOOGLE_REDIRECT_URI=http://localhost:5173
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📱 Pages Overview

### 1. Login/Register (`/login`)
- **Dual Mode**: Toggle between login and registration
- **Google OAuth**: One-click Google authentication
- **Form Validation**: Real-time validation with helpful messages
- **Password Requirements**: Clear password strength indicators

### 2. Dashboard (`/dashboard`)
- **Statistics Cards**: Key metrics at a glance
- **Quick Actions**: Direct access to main features
- **Recent Activity**: Timeline of user actions
- **Welcome Message**: Personalized greeting

### 3. Publish Paper (`/publish`)
- **Multi-step Form**: Organized sections for different data types
- **Author Management**: Add/remove multiple authors
- **File Upload**: PDF upload with preview
- **Rich Text Areas**: For abstracts, methodology, results
- **Validation**: Comprehensive form validation

### 4. Browse Papers (`/papers`)
- **Search Interface**: Multi-field search capabilities
- **Filtering**: Category and sorting options
- **Paper Cards**: Rich previews with metadata
- **Pagination**: Efficient data loading
- **Empty States**: Helpful messages when no results

### 5. Network (`/network`)
- **Connection Management**: Connect/disconnect with researchers
- **Suggestions**: AI-powered connection recommendations
- **Profile Cards**: Detailed researcher information
- **Statistics**: Network growth metrics
- **Tabbed Interface**: Organized view of connections vs suggestions

### 6. Profile (`/profile`)
- **Comprehensive Form**: All user information in one place
- **Profile Summary**: Visual profile overview
- **Professional Details**: Academic and research information
- **Online Presence**: Social and professional links
- **Avatar Management**: Profile picture support

## 🔧 Configuration

### Environment Variables
- `VITE_API_BASE_URL`: Backend API base URL
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `VITE_GOOGLE_REDIRECT_URI`: OAuth redirect URI

### API Integration
- **Base URL**: Configurable API endpoint
- **Authentication**: JWT token-based authentication
- **Error Handling**: Comprehensive error management
- **Token Refresh**: Automatic token renewal

## 🎯 Key Features Explained

### Authentication Flow
1. **Login**: Email/password or Google OAuth
2. **Token Storage**: Secure localStorage management
3. **Auto Refresh**: Seamless token renewal
4. **Logout**: Complete session cleanup

### Paper Publishing Workflow
1. **Form Submission**: Comprehensive paper details
2. **File Upload**: PDF document submission
3. **Review Process**: Simulated peer review
4. **Publication**: Paper becomes available to community

### Network Building
1. **Discovery**: Find researchers by specialization
2. **Connection**: Send connection requests
3. **Collaboration**: Build research partnerships
4. **Growth**: Expand professional network

## 🚀 Future Enhancements

### Planned Features
- **Real-time Chat**: Direct messaging between researchers
- **Collaboration Tools**: Shared workspaces and document editing
- **Citation Management**: Automatic citation tracking
- **Analytics Dashboard**: Detailed research metrics
- **Mobile App**: Native mobile application
- **Advanced Search**: AI-powered paper discovery
- **Review System**: Peer review workflow
- **Notifications**: Real-time updates and alerts

### Technical Improvements
- **PWA Support**: Progressive Web App capabilities
- **Offline Mode**: Offline paper reading and editing
- **Performance**: Code splitting and lazy loading
- **Testing**: Comprehensive test coverage
- **Accessibility**: Enhanced accessibility features
- **Internationalization**: Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**ResearchNet Frontend** - Empowering researchers to discover, collaborate, and publish their work globally.
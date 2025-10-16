# ResearchNet - Complete User Experience Guide

## 🚀 How to Access and Use All Features

### **Step 1: Starting the Application**

1. **Start the Frontend:**
   ```bash
   cd /home/kishlay/per/frontend
   npm run dev
   ```

2. **Open in Browser:**
   ```
   http://localhost:5173
   ```

### **Step 2: User Registration & Login**

#### **Option A: Email/Password Registration**
1. Go to `http://localhost:5173/login`
2. Click "Sign Up" tab
3. Fill in the form:
   - **First Name**: Your first name
   - **Last Name**: Your last name  
   - **Email**: Your email address
   - **Password**: Must contain uppercase, lowercase, and number (e.g., "Password123")
   - **Phone**: Optional phone number
4. Click "Create Account"
5. You'll be automatically logged in and redirected to Dashboard

#### **Option B: Google OAuth Login**
1. Click "Sign in with Google" button
2. Complete Google authentication
3. You'll be logged in and redirected to Dashboard

### **Step 3: Complete User Journey**

## 📊 **Dashboard - Your Research Hub**

**URL:** `http://localhost:5173/dashboard`

**What you'll see:**
- Welcome message with your name
- Statistics cards (Published Papers, Pending Reviews, Connections, Citations)
- Quick action buttons
- Recent activity feed

**What you can do:**
- View your research statistics
- Quick access to publish papers
- Browse research papers
- Navigate to all features

---

## 📝 **Publishing Research Papers**

**URL:** `http://localhost:5173/publish`

**How to publish a paper:**
1. Click "Start Publishing" from Dashboard or "Publish" from Navbar
2. Fill in the comprehensive form:

   **Basic Information:**
   - Title: "Machine Learning in Healthcare"
   - Abstract: Detailed description of your research
   - Keywords: "machine learning, healthcare, AI"

   **Authors:**
   - Add multiple authors with names, emails, affiliations
   - You're automatically added as the first author

   **Research Content:**
   - Methodology: Describe your research methods
   - Results: Present your findings
   - Conclusion: Summarize your conclusions

   **Additional Information:**
   - References: List all citations
   - Funding: Grant information
   - Acknowledgments: Thank contributors

3. Upload a PDF file (simulated)
4. Click "Submit for Review"
5. See success message and get redirected to Papers page

---

## 📚 **Browse Research Papers**

**URL:** `http://localhost:5173/papers`

**Features:**
- **Search**: Find papers by title, author, or keywords
- **Filter**: By category (Computer Science, Physics, etc.)
- **Sort**: By date, citations, downloads, or title
- **Paper Cards**: Rich previews with abstracts and metadata

**How to use:**
1. Use search bar to find specific papers
2. Select category filter to narrow results
3. Choose sorting option
4. Click on any paper card to view details

---

## 📄 **Detailed Paper View**

**URL:** `http://localhost:5173/paper/1` (or any paper ID)

**Features:**
- **Complete Paper**: Full content with all sections
- **Author Profiles**: Detailed author information
- **Statistics**: Views, downloads, citations, bookmarks
- **Actions**: Like, bookmark, share, download, cite
- **Comments**: Full commenting system with replies
- **Related Papers**: Discover similar research

**How to interact:**
1. **Like**: Click heart icon to like the paper
2. **Bookmark**: Save paper for later reading
3. **Share**: Share paper with others
4. **Comment**: Add your thoughts and questions
5. **Reply**: Respond to other comments
6. **Download**: Get the PDF (simulated)

---

## 👥 **Research Network**

**URL:** `http://localhost:5173/network`

**Features:**
- **My Connections**: View your current network
- **Suggestions**: Discover new researchers
- **Connect/Disconnect**: Manage your network
- **Profile Viewing**: See detailed researcher profiles
- **Statistics**: Track network growth

**How to build your network:**
1. **View Suggestions**: See recommended researchers
2. **Connect**: Click "Connect" to add researchers
3. **View Profiles**: Click "View Profile" to see details
4. **Manage Connections**: Disconnect if needed
5. **Track Growth**: Monitor your network statistics

---

## 📱 **Social Feed**

**URL:** `http://localhost:5173/feed`

**Features:**
- **Activity Stream**: See posts and papers from your network
- **Post Types**: General posts, paper shares, collaboration requests
- **Interactions**: Like, comment, and share posts
- **Filtering**: View all activity, papers only, or posts only

**How to use:**
1. **Browse Feed**: See latest activity from your network
2. **Filter Content**: Use tabs to filter by type
3. **Interact**: Like, comment, or share posts
4. **Create Posts**: Click "Share Update" to post

---

## ✍️ **Create Posts & Updates**

**URL:** `http://localhost:5173/create-post`

**Post Types:**
1. **General Post**: Share thoughts and updates
2. **Paper Share**: Discuss research papers
3. **Collaboration Request**: Find research partners

**How to create posts:**
1. Choose post type
2. Write your content (up to 1000 characters)
3. Add relevant tags
4. Set visibility (public, connections only, private)
5. Attach files if needed
6. Click "Share Post"

---

## 👤 **Profile Management**

**URL:** `http://localhost:5173/profile`

**Features:**
- **Personal Info**: Name, email, phone, affiliation
- **Professional Details**: Specialization, bio, research interests
- **Online Presence**: Website, ORCID, Google Scholar
- **Education & Experience**: Academic background

**How to update profile:**
1. Fill in all relevant information
2. Add your research interests
3. Include professional links
4. Update education and experience
5. Click "Update Profile"

---

## 🎯 **Complete User Workflow**

### **For New Users:**

1. **Register/Login** → Dashboard
2. **Update Profile** → Add your information
3. **Browse Papers** → Discover research
4. **Build Network** → Connect with researchers
5. **Publish Paper** → Share your research
6. **Engage Socially** → Post updates and comments

### **For Active Researchers:**

1. **Check Feed** → See latest activity
2. **Read Papers** → Stay updated with research
3. **Comment & Discuss** → Engage with community
4. **Share Updates** → Post about your work
5. **Collaborate** → Find research partners
6. **Publish Results** → Share new findings

---

## 🔧 **Navigation Tips**

### **Main Navigation (Top Bar):**
- **ResearchNet Logo**: Click to go to Dashboard
- **Dashboard**: Your main hub
- **Feed**: Social activity stream
- **Papers**: Browse research papers
- **Network**: Manage connections
- **Publish**: Create new papers

### **Quick Actions:**
- **Dashboard Cards**: Quick access to main features
- **Paper Cards**: Click to view details
- **Profile Links**: Access researcher profiles
- **Action Buttons**: Like, share, comment, connect

---

## 🎨 **User Experience Features**

### **Visual Feedback:**
- **Loading States**: Spinners during actions
- **Success Messages**: Confirmations for actions
- **Error Handling**: Clear error messages
- **Hover Effects**: Interactive elements

### **Responsive Design:**
- **Mobile**: Works on phones and tablets
- **Desktop**: Optimized for large screens
- **Touch**: Touch-friendly interactions

### **Accessibility:**
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Color Contrast**: Accessible color schemes

---

## 🚀 **Getting Started Checklist**

### **First Time Setup:**
- [ ] Register with email/password or Google
- [ ] Complete your profile
- [ ] Add research interests
- [ ] Connect with 3-5 researchers
- [ ] Browse and like some papers
- [ ] Create your first post

### **Regular Usage:**
- [ ] Check feed daily for updates
- [ ] Comment on interesting papers
- [ ] Share your research progress
- [ ] Connect with new researchers
- [ ] Publish new papers
- [ ] Engage in discussions

---

## 💡 **Pro Tips**

### **Building Your Network:**
1. **Connect with colleagues** from your field
2. **Follow researchers** whose work you admire
3. **Engage with comments** to build relationships
4. **Share valuable content** to attract connections

### **Publishing Success:**
1. **Write compelling abstracts** that summarize your work
2. **Use relevant keywords** for discoverability
3. **Include all authors** with proper affiliations
4. **Add comprehensive references** to support your work

### **Social Engagement:**
1. **Post regularly** about your research progress
2. **Comment thoughtfully** on others' work
3. **Share interesting papers** with your network
4. **Request collaborations** when appropriate

---

## 🔍 **Troubleshooting**

### **Common Issues:**

**Can't see papers?**
- Make sure you're logged in
- Check if you have network connections
- Try refreshing the page

**Login not working?**
- Check password requirements (uppercase, lowercase, number)
- Try Google OAuth as alternative
- Clear browser cache

**Features not loading?**
- Check browser console for errors
- Ensure all dependencies are installed
- Try different browser

---

**🎉 You're now ready to explore the complete ResearchNet platform!**

Start with the Dashboard, build your network, publish your research, and engage with the global research community!

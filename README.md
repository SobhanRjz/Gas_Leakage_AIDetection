# Gas Leakage AI Detection System

A modern web application for gas pipeline monitoring and leakage detection using AI technology.

## 🚀 Features

- Real-time pipeline monitoring
- AI-powered leakage detection
- Interactive dashboard
- Responsive design with glassmorphism UI
- Authentication system
- Comprehensive reporting

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Routing**: React Router v6
- **Styling**: CSS with modern design patterns
- **Deployment**: GitHub Pages

## 📦 Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚀 Deployment to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Setup Instructions:

1. **Push to GitHub**: Ensure your code is pushed to the `main` branch of your repository

2. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "GitHub Actions" as the source
   - The workflow will automatically deploy on each push to main

3. **Access your site**: Visit `https://sobhanrjz.github.io/Gas_Leakage_AIDetection`

### Configuration Details:

- **Base Path**: `/Gas_Leakage_AIDetection/` (configured in `vite.config.ts`)
- **Build Output**: `dist/` folder
- **Routing**: React Router configured with basename for GitHub Pages

## 🎨 Design Features

- **Glassmorphism UI**: Modern translucent design with backdrop blur
- **Responsive Layout**: Optimized for all device sizes
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Performance**: Optimized images and lazy loading

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.tsx/css    # Navigation header
│   └── Layout.tsx/css    # App layout wrapper
├── pages/
│   ├── LandingPage.tsx/css  # Home page with hero section
│   ├── LoginPage.tsx/css    # Authentication page
│   ├── OverviewPage.tsx/css # Dashboard overview
│   └── ReportPage.tsx/css   # Reports and analytics
├── services/
│   └── AuthService.tsx   # Authentication logic
└── App.tsx               # Main app with routing
```

## 🔧 Development Notes

- Uses Vite for fast development and optimized builds
- TypeScript for type safety
- CSS custom properties for theming
- Responsive images with WebP support

---

**Live Demo**: [https://sobhanrjz.github.io/Gas_Leakage_AIDetection](https://sobhanrjz.github.io/Gas_Leakage_AIDetection)

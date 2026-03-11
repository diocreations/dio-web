import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { useState, useEffect, createContext, useContext, useRef, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";

// Public Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ProductsPage from "./pages/ProductsPage";
import PortfolioPage from "./pages/PortfolioPage";
import PortfolioDetailPage from "./pages/PortfolioDetailPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import BuilderPage from "./pages/BuilderPage";
import BuilderSuccessPage from "./pages/BuilderSuccessPage";
import ResumeOptimizerPage from "./pages/ResumeOptimizerPage";
import ResumeBuilderPage from "./pages/ResumeBuilderPage";
import UserLoginPage from "./pages/UserLoginPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import CoverLetterPage from "./pages/CoverLetterPage";
import ResumeBuilderLandingPage from "./pages/ResumeBuilderLandingPage";
import ResumeAnalyzerLandingPage from "./pages/ResumeAnalyzerLandingPage";
import CoverLetterLandingPage from "./pages/CoverLetterLandingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Admin Pages (lazy loaded)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminPortfolio = lazy(() => import("./pages/admin/AdminPortfolio"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminContacts = lazy(() => import("./pages/admin/AdminContacts"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminHomepage = lazy(() => import("./pages/admin/AdminHomepage"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAbout = lazy(() => import("./pages/admin/AdminAbout"));
const AdminChatbot = lazy(() => import("./pages/admin/AdminChatbot"));
const AdminResume = lazy(() => import("./pages/admin/AdminResume"));
const AdminResumeBuilder = lazy(() => import("./pages/admin/AdminResumeBuilder"));
const AdminMenus = lazy(() => import("./pages/admin/AdminMenus"));
const AdminCurrency = lazy(() => import("./pages/admin/AdminCurrency"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates"));
const AdminSeo = lazy(() => import("./pages/admin/AdminSeo"));
const AdminCoverLetter = lazy(() => import("./pages/admin/AdminCoverLetter"));
const AdminNewsletter = lazy(() => import("./pages/admin/AdminNewsletter"));
const AdminInvitations = lazy(() => import("./pages/admin/AdminInvitations"));
const AdminLandingPages = lazy(() => import("./pages/admin/AdminLandingPages"));
const AdminCustomPages = lazy(() => import("./pages/admin/AdminCustomPages"));
const AdminContactSettings = lazy(() => import("./pages/admin/AdminContactSettings"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminUserManagement = lazy(() => import("./pages/admin/AdminUserManagement"));
import CustomPage from "./pages/CustomPage";

const queryClient = new QueryClient();
const API_URL = process.env.REACT_APP_BACKEND_URL;

// Set document title (override any external scripts)
const setPageTitle = () => {
  document.title = "DIOCREATIONS | Digital Excellence for Modern Business";
};

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Callback Component
const AuthCallback = () => {
  const hasProcessed = useRef(false);
  const { login } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        try {
          const response = await fetch(`${API_URL}/api/auth/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ session_id: sessionId }),
          });
          
          if (response.ok) {
            const userData = await response.json();
            login(userData);
            window.location.href = "/admin";
          } else {
            window.location.href = "/admin/login";
          }
        } catch (error) {
          console.error("Session exchange error:", error);
          window.location.href = "/admin/login";
        }
      }
    };

    processSession();
  }, [login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// App Router
const AppRouter = () => {
  const location = useLocation();
  const isResumeSubdomain = window.location.hostname.startsWith("resume.");

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  // Subdomain mode: resume.diocreations.eu -> only resume optimizer
  if (isResumeSubdomain) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
        <Routes>
          <Route path="/" element={<ResumeOptimizerPage />} />
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<UserDashboardPage />} />
          <Route path="/cover-letter" element={<CoverLetterPage />} />
          <Route path="*" element={<ResumeOptimizerPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:slug" element={<ServiceDetailPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="/portfolio/:slug" element={<PortfolioDetailPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
      <Route path="/builder" element={<BuilderPage />} />
      <Route path="/builder/success" element={<BuilderSuccessPage />} />
      <Route path="/resume-optimizer" element={<ResumeOptimizerPage />} />
      <Route path="/resume-builder" element={<ResumeBuilderPage />} />
      <Route path="/resume-builder-info" element={<ResumeBuilderLandingPage />} />
      <Route path="/resume-analyzer-info" element={<ResumeAnalyzerLandingPage />} />
      <Route path="/cover-letter-info" element={<CoverLetterLandingPage />} />
      <Route path="/login" element={<UserLoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<UserDashboardPage />} />
      <Route path="/cover-letter" element={<CoverLetterPage />} />
      
      {/* Custom Pages */}
      <Route path="/page/:slug" element={<CustomPage />} />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/services"
        element={
          <ProtectedRoute>
            <AdminServices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute>
            <AdminProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/portfolio"
        element={
          <ProtectedRoute>
            <AdminPortfolio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/blog"
        element={
          <ProtectedRoute>
            <AdminBlog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/testimonials"
        element={
          <ProtectedRoute>
            <AdminTestimonials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contacts"
        element={
          <ProtectedRoute>
            <AdminContacts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leads"
        element={
          <ProtectedRoute>
            <AdminLeads />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/homepage"
        element={
          <ProtectedRoute>
            <AdminHomepage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/chatbot"
        element={
          <ProtectedRoute>
            <AdminChatbot />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resume"
        element={
          <ProtectedRoute>
            <AdminResume />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resume-builder"
        element={
          <ProtectedRoute>
            <AdminResumeBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cover-letter"
        element={
          <ProtectedRoute>
            <AdminCoverLetter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/newsletter"
        element={
          <ProtectedRoute>
            <AdminNewsletter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invitations"
        element={
          <ProtectedRoute>
            <AdminInvitations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/about"
        element={
          <ProtectedRoute>
            <AdminAbout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/menus"
        element={
          <ProtectedRoute>
            <AdminMenus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/currency"
        element={
          <ProtectedRoute>
            <AdminCurrency />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/templates"
        element={
          <ProtectedRoute>
            <AdminTemplates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/seo"
        element={
          <ProtectedRoute>
            <AdminSeo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/landing-pages"
        element={
          <ProtectedRoute>
            <AdminLandingPages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/custom-pages"
        element={
          <ProtectedRoute>
            <AdminCustomPages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contact-settings"
        element={
          <ProtectedRoute>
            <AdminContactSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/faq"
        element={
          <ProtectedRoute>
            <AdminFAQ />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/user-management"
        element={
          <ProtectedRoute>
            <AdminUserManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
};

function App() {
  // Set title on mount and with interval to override external scripts
  useEffect(() => {
    setPageTitle();
    const interval = setInterval(setPageTitle, 1000);
    // Stop after 5 seconds
    setTimeout(() => clearInterval(interval), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;

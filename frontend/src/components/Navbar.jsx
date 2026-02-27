import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "./AnimatedLogo";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Google icon SVG component
const GoogleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="mr-1.5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState(null);
  const [navLinks, setNavLinks] = useState([]);
  const [pubUser, setPubUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/settings`).then(r => r.json()).then(setSettings).catch(() => {});
    fetch(`${API_URL}/api/menus/nav`).then(r => r.json()).then(items => {
      if (Array.isArray(items) && items.length > 0) {
        setNavLinks(items);
      } else {
        setNavLinks(defaultLinks);
      }
    }).catch(() => setNavLinks(defaultLinks));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("pub_user");
    if (stored) setPubUser(JSON.parse(stored));
  }, [location]);

  const defaultLinks = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Products", path: "/products" },
    { label: "Resume AI", path: "/resume-optimizer" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "Blog", path: "/blog" },
    { label: "Contact", path: "/contact" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-lg shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center" data-testid="logo-link">
            <AnimatedLogo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <div key={link.path} className="relative group">
                <Link
                  to={link.path}
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.path) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  {link.children?.length > 0 && <ChevronDown size={14} className="inline ml-0.5" />}
                </Link>
                {link.children?.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-lg py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {link.children.map(child => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className="block px-4 py-2 text-sm hover:bg-primary/5 hover:text-primary"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {pubUser ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => navigate("/dashboard")}
                data-testid="nav-dashboard"
              >
                <User size={14} className="mr-1" /> {pubUser.name || "Dashboard"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => navigate("/login")}
                data-testid="nav-login"
              >
                <User size={14} className="mr-1" /> Sign In
              </Button>
            )}
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
              data-testid="nav-get-started"
            >
              <Link to="/contact">Get Started</Link>
            </Button>
          </div>

          {/* Mobile */}
          <button className="lg:hidden p-2" onClick={() => setIsOpen(!isOpen)} data-testid="mobile-menu-toggle">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t"
          >
            <div className="px-6 py-4 space-y-4">
              {navLinks.map((link) => (
                <div key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block py-2 text-sm font-medium ${
                      isActive(link.path) ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                  {link.children?.map(child => (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={() => setIsOpen(false)}
                      className="block py-1.5 pl-4 text-sm text-muted-foreground"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}
              {pubUser ? (
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link to="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
              )}
              <Button asChild className="w-full bg-primary text-primary-foreground rounded-full">
                <Link to="/contact" onClick={() => setIsOpen(false)}>Get Started</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, User, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLogo from "./AnimatedLogo";

const API_URL = process.env.REACT_APP_BACKEND_URL;

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
    { label: "Resume Builder", path: "/resume-builder" },
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-slate-200 hover:bg-slate-50"
                  onClick={() => {
                    const redirectUrl = `${window.location.origin}/login`;
                    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
                  }}
                  data-testid="nav-google-signin"
                >
                  <GoogleIcon size={16} /> Google
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/login")}
                  data-testid="nav-login"
                >
                  <LogIn size={14} className="mr-1" /> Sign In
                </Button>
              </div>
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
                <div className="space-y-2">
                  <Button
                    className="w-full rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setIsOpen(false);
                      const redirectUrl = `${window.location.origin}/login`;
                      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
                    }}
                  >
                    <GoogleIcon size={18} /> Continue with Google
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link to="/login" onClick={() => setIsOpen(false)}>Sign In with Email</Link>
                  </Button>
                </div>
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

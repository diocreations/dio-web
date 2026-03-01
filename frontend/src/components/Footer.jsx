import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import NewsletterSubscribe from "./NewsletterSubscribe";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Footer = () => {
  const [settings, setSettings] = useState(null);
  const [footerLinks, setFooterLinks] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/settings`).then(r => r.json()).then(setSettings).catch(() => {});
    fetch(`${API_URL}/api/menus/footer`).then(r => r.json()).then(items => {
      if (Array.isArray(items) && items.length > 0) setFooterLinks(items);
      else setFooterLinks(defaultLinks);
    }).catch(() => setFooterLinks(defaultLinks));
  }, []);

  const defaultLinks = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Services", path: "/services" },
    { label: "Products", path: "/products" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "Blog", path: "/blog" },
    { label: "Contact", path: "/contact" },
  ];

  const services = [
    { name: "Web Development", path: "/services/web-mobile-development" },
    { name: "SEO Services", path: "/services/seo" },
    { name: "Local SEO", path: "/services/local-seo" },
    { name: "AI Solutions", path: "/services/private-llms" },
    { name: "Marketing Automation", path: "/services/marketing-automation" },
    { name: "Email Marketing", path: "/services/email-marketing" },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              <AnimatedLogo textColor="text-white" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              {settings?.tagline || "Digital Excellence for Modern Business. We build eCommerce, AI-driven, and mobile app solutions that scale."}
            </p>
            <div className="flex gap-4">
              {settings?.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors" data-testid="social-facebook">
                  <Facebook size={18} />
                </a>
              )}
              {settings?.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors" data-testid="social-twitter">
                  <Twitter size={18} />
                </a>
              )}
              {settings?.social_linkedin && (
                <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors" data-testid="social-linkedin">
                  <Linkedin size={18} />
                </a>
              )}
              {settings?.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors" data-testid="social-instagram">
                  <Instagram size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-slate-400 text-sm hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.path}>
                  <Link to={service.path} className="text-slate-400 text-sm hover:text-primary transition-colors">
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4">
              {settings?.contact_email && (
                <li className="flex items-start gap-3">
                  <Mail size={18} className="text-primary mt-0.5" />
                  <a href={`mailto:${settings.contact_email}`} className="text-slate-400 text-sm hover:text-primary transition-colors">
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings?.contact_phone && (
                <li className="flex items-start gap-3">
                  <Phone size={18} className="text-primary mt-0.5" />
                  <a href={`tel:${settings.contact_phone}`} className="text-slate-400 text-sm hover:text-primary transition-colors">
                    {settings.contact_phone}
                  </a>
                </li>
              )}
              {settings?.contact_address && (
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary mt-0.5" />
                  <span className="text-slate-400 text-sm">{settings.contact_address}</span>
                </li>
              )}
            </ul>
            
            {/* Newsletter Subscription */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h5 className="font-medium text-sm mb-3">Subscribe to our Newsletter</h5>
              <NewsletterSubscribe variant="footer" source="footer" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">{settings?.footer_text || "\u00a9 2025 DioCreations. All rights reserved."}</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-slate-400 text-sm hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-slate-400 text-sm hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

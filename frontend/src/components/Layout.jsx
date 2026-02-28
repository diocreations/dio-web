import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DioChat from "./DioChat";
import GoogleAnalytics from "./GoogleAnalytics";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const accentCssMap = {
  violet: { "--primary": "265 80% 50%", "--ring": "265 80% 50%", "--accent": "265 60% 60%", "--secondary": "265 30% 96%", "--secondary-foreground": "265 80% 30%" },
  blue: { "--primary": "221 83% 53%", "--ring": "221 83% 53%", "--accent": "221 60% 60%", "--secondary": "221 30% 96%", "--secondary-foreground": "221 83% 30%" },
  teal: { "--primary": "172 66% 50%", "--ring": "172 66% 50%", "--accent": "172 50% 55%", "--secondary": "172 30% 96%", "--secondary-foreground": "172 66% 30%" },
  pink: { "--primary": "333 71% 51%", "--ring": "333 71% 51%", "--accent": "333 55% 60%", "--secondary": "333 30% 96%", "--secondary-foreground": "333 71% 30%" },
  orange: { "--primary": "25 95% 53%", "--ring": "25 95% 53%", "--accent": "25 70% 60%", "--secondary": "25 30% 96%", "--secondary-foreground": "25 95% 30%" },
};

// Apply color immediately from localStorage to prevent flash
const applySavedColor = () => {
  const saved = localStorage.getItem("dio_color_scheme");
  if (saved && accentCssMap[saved]) {
    const root = document.documentElement;
    Object.entries(accentCssMap[saved]).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
};

// Call immediately on module load
applySavedColor();

const getRandomIndex = (key, max) => {
  if (max <= 0) return 0;
  const stored = sessionStorage.getItem(key);
  if (stored !== null) return parseInt(stored) % max;
  const idx = Math.floor(Math.random() * max);
  sessionStorage.setItem(key, idx.toString());
  return idx;
};

const HIDE_CHAT_PATHS = ["/resume-optimizer", "/cover-letter"];

// Map route paths to SEO slugs
const pathToSlug = (path) => {
  if (path === "/") return "home";
  return path.replace(/^\//, "").split("/")[0];
};

const Layout = ({ children }) => {
  const location = useLocation();
  const [colorData, setColorData] = useState(null);
  const [seoData, setSeoData] = useState({ global: null, page: null });
  const hideChatbot = HIDE_CHAT_PATHS.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    fetch(`${API_URL}/api/homepage/content`)
      .then((r) => r.json())
      .then((data) => setColorData(data))
      .catch(() => {});
  }, []);

  // Fetch SEO data for current page
  useEffect(() => {
    const slug = pathToSlug(location.pathname);
    Promise.all([
      fetch(`${API_URL}/api/seo/global`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_URL}/api/seo/pages/${slug}`).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([global, page]) => {
      setSeoData({ global, page });
      // Apply SEO meta tags
      const title = page?.title || global?.site_title || "";
      const desc = page?.description || global?.site_description || "";
      const keywords = [...(page?.keywords || []), ...(global?.default_keywords || [])].join(", ");
      const ogTitle = page?.og_title || title;
      const ogDesc = page?.og_description || desc;
      const ogImage = page?.og_image || global?.default_og_image || "";
      const canonical = page?.canonical_url || "";

      if (title) document.title = title;
      setMeta("description", desc);
      setMeta("keywords", keywords);
      setMeta("og:title", ogTitle, "property");
      setMeta("og:description", ogDesc, "property");
      if (ogImage) setMeta("og:image", ogImage, "property");
      setMeta("og:type", "website", "property");
      setMeta("og:url", window.location.href, "property");
      setMeta("twitter:card", "summary_large_image", "name");
      setMeta("twitter:title", ogTitle, "name");
      setMeta("twitter:description", ogDesc, "name");

      // Google/Bing verification
      if (global?.google_verification) setMeta("google-site-verification", global.google_verification);
      if (global?.bing_verification) setMeta("msvalidate.01", global.bing_verification);

      // Canonical
      let link = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
        link.href = canonical;
      } else if (link) { link.remove(); }

      // JSON-LD Schema
      if (global?.schema_org_name) {
        let script = document.getElementById("schema-org-jsonld");
        if (!script) { script = document.createElement("script"); script.id = "schema-org-jsonld"; script.type = "application/ld+json"; document.head.appendChild(script); }
        script.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": global.schema_org_type || "Organization",
          "name": global.schema_org_name,
          "url": global.schema_org_url || window.location.origin,
          "logo": global.schema_org_logo || "",
          "description": global.schema_org_description || desc,
        });
      }
    });
  }, [location.pathname]);

  const accentStyle = useMemo(() => {
    const schemes = colorData?.color_schemes?.filter((s) => s.is_active) || [];
    const settings = colorData?.settings;
    if (settings?.enable_color_rotation && schemes.length > 0) {
      const idx = getRandomIndex("color_idx", schemes.length);
      const name = schemes[idx]?.name?.toLowerCase() || "violet";
      return accentCssMap[name] || accentCssMap.violet;
    }
    return accentCssMap.violet;
  }, [colorData]);

  return (
    <div className="min-h-screen flex flex-col" style={accentStyle}>
      <GoogleAnalytics />
      <Navbar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
      {!hideChatbot && <DioChat />}
    </div>
  );
};

function setMeta(name, content, attr = "name") {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

export default Layout;

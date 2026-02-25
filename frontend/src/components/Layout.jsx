import { useState, useEffect, useMemo } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DioChat from "./DioChat";
import GoogleAnalytics from "./GoogleAnalytics";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Accent color CSS variable mappings
const accentCssMap = {
  violet: { "--primary": "265 80% 50%", "--ring": "265 80% 50%", "--accent": "265 60% 60%", "--secondary": "265 30% 96%", "--secondary-foreground": "265 80% 30%" },
  blue: { "--primary": "221 83% 53%", "--ring": "221 83% 53%", "--accent": "221 60% 60%", "--secondary": "221 30% 96%", "--secondary-foreground": "221 83% 30%" },
  teal: { "--primary": "172 66% 50%", "--ring": "172 66% 50%", "--accent": "172 50% 55%", "--secondary": "172 30% 96%", "--secondary-foreground": "172 66% 30%" },
  pink: { "--primary": "333 71% 51%", "--ring": "333 71% 51%", "--accent": "333 55% 60%", "--secondary": "333 30% 96%", "--secondary-foreground": "333 71% 30%" },
  orange: { "--primary": "25 95% 53%", "--ring": "25 95% 53%", "--accent": "25 70% 60%", "--secondary": "25 30% 96%", "--secondary-foreground": "25 95% 30%" },
};

const getRandomIndex = (key, max) => {
  if (max <= 0) return 0;
  const stored = sessionStorage.getItem(key);
  if (stored !== null) return parseInt(stored) % max;
  const idx = Math.floor(Math.random() * max);
  sessionStorage.setItem(key, idx.toString());
  return idx;
};

const Layout = ({ children }) => {
  const [colorData, setColorData] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/homepage/content`)
      .then((r) => r.json())
      .then((data) => setColorData(data))
      .catch(() => {});
  }, []);

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
      <DioChat />
    </div>
  );
};

export default Layout;

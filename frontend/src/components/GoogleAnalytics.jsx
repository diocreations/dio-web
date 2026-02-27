import { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GoogleAnalytics = () => {
  const [gaId, setGaId] = useState(null);

  useEffect(() => {
    // Fetch GA ID from settings
    fetch(`${API_URL}/api/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.google_analytics_id) {
          setGaId(data.google_analytics_id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!gaId) return;

    // Check if GA is already loaded
    if (window.gtag) return;

    // Load Google Analytics script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", gaId);
  }, [gaId]);

  return null; // This component doesn't render anything
};

export default GoogleAnalytics;

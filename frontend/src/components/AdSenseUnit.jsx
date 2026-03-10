import { useEffect, useRef, useCallback } from "react";

/**
 * AdSenseUnit Component
 * 
 * Properly renders and initializes Google AdSense ad units in a React SPA.
 * Handles the script execution that dangerouslySetInnerHTML cannot do.
 * 
 * @param {string} adsenseCode - The full AdSense code snippet from admin
 * @param {string} className - Optional wrapper className
 */
const AdSenseUnit = ({ adsenseCode, className = "" }) => {
  const adRef = useRef(null);
  const isInitialized = useRef(false);

  // Function to load the global AdSense script if not already loaded
  const loadAdSenseScript = useCallback((adClient) => {
    return new Promise((resolve) => {
      if (!adClient) {
        resolve(false);
        return;
      }
      
      // Check for any existing adsbygoogle script
      const scripts = document.querySelectorAll('script[src*="pagead2.googlesyndication.com"]');
      if (scripts.length > 0) {
        // Script already exists, wait a bit for it to be ready
        setTimeout(resolve, 100, true);
        return;
      }

      // Create and load the script
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.crossOrigin = "anonymous";
      
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      
      document.head.appendChild(script);
    });
  }, []);

  useEffect(() => {
    if (!adsenseCode || !adRef.current || isInitialized.current) return;

    const initializeAd = async () => {
      // Parse the AdSense code to extract the ins element attributes
      const parser = new DOMParser();
      const doc = parser.parseFromString(adsenseCode, "text/html");
      
      // Find the <ins> element (the actual ad container)
      const insElement = doc.querySelector("ins.adsbygoogle");
      
      // Extract ad client from either ins element or script tag
      let adClient = insElement?.getAttribute("data-ad-client");
      if (!adClient) {
        // Try to extract from script src
        const srcMatch = adsenseCode.match(/client=([a-z]+-pub-\d+)/i);
        if (srcMatch) {
          adClient = srcMatch[1];
        }
      }

      if (!adClient) {
        console.warn("AdSense: No valid ad client found in code");
        return;
      }

      // Load the AdSense script first
      await loadAdSenseScript(adClient);

      // Get container and clear it
      const container = adRef.current;
      if (!container) return;
      container.innerHTML = "";

      // Create and append the ins element
      const ins = document.createElement("ins");
      ins.className = "adsbygoogle";
      ins.style.cssText = insElement?.getAttribute("style") || "display:block";
      ins.setAttribute("data-ad-client", adClient);
      
      const adSlot = insElement?.getAttribute("data-ad-slot");
      if (adSlot) {
        ins.setAttribute("data-ad-slot", adSlot);
      }
      
      ins.setAttribute("data-ad-format", insElement?.getAttribute("data-ad-format") || "auto");
      ins.setAttribute("data-full-width-responsive", insElement?.getAttribute("data-full-width-responsive") || "true");
      
      container.appendChild(ins);

      // Mark as initialized BEFORE pushing to prevent duplicates
      isInitialized.current = true;

      // Wait a tick for DOM to update, then push
      requestAnimationFrame(() => {
        try {
          // Check if this specific ins element already has an ad
          if (ins.getAttribute("data-adsbygoogle-status")) {
            return; // Already processed
          }
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
          // Silently handle - common errors include "already have ads" which is fine
          if (!err.message?.includes("already have ads")) {
            console.warn("AdSense push warning:", err.message);
          }
        }
      });
    };

    initializeAd();

    // Cleanup on unmount
    return () => {
      isInitialized.current = false;
    };
  }, [adsenseCode, loadAdSenseScript]);

  if (!adsenseCode) {
    return null;
  }

  return (
    <div 
      ref={adRef} 
      className={`adsense-container ${className}`}
      data-testid="adsense-unit"
    />
  );
};

export default AdSenseUnit;

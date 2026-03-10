import { useEffect, useRef, useState } from "react";

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!adsenseCode || !adRef.current) return;

    // Parse the AdSense code to extract the ins element attributes
    const parser = new DOMParser();
    const doc = parser.parseFromString(adsenseCode, "text/html");
    
    // Find the <ins> element (the actual ad container)
    const insElement = doc.querySelector("ins.adsbygoogle");
    
    if (!insElement) {
      // If no ins element, it might be a different ad format
      // Try to render the raw HTML and execute scripts manually
      try {
        renderRawAdCode();
      } catch (err) {
        setError("Invalid AdSense code format");
      }
      return;
    }

    // Extract attributes from the ins element
    const adClient = insElement.getAttribute("data-ad-client");
    const adSlot = insElement.getAttribute("data-ad-slot");
    const adFormat = insElement.getAttribute("data-ad-format") || "auto";
    const fullWidthResponsive = insElement.getAttribute("data-full-width-responsive") || "true";
    const style = insElement.getAttribute("style") || "display:block";

    // Ensure the global AdSense script is loaded
    loadAdSenseScript(adClient);

    // Create the ad container
    const container = adRef.current;
    container.innerHTML = "";

    // Create and append the ins element
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.cssText = style;
    if (adClient) ins.setAttribute("data-ad-client", adClient);
    if (adSlot) ins.setAttribute("data-ad-slot", adSlot);
    ins.setAttribute("data-ad-format", adFormat);
    ins.setAttribute("data-full-width-responsive", fullWidthResponsive);
    container.appendChild(ins);

    // Push to adsbygoogle to initialize the ad
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setIsLoaded(true);
    } catch (err) {
      console.error("AdSense initialization error:", err);
      setError("Failed to initialize ad");
    }

  }, [adsenseCode]);

  // Function to load the global AdSense script if not already loaded
  const loadAdSenseScript = (adClient) => {
    if (!adClient) return;
    
    // Check if script is already loaded
    const existingScript = document.getElementById("adsense-script");
    if (existingScript && existingScript.src) return;

    // Check for any existing adsbygoogle script
    const scripts = document.querySelectorAll('script[src*="pagead2.googlesyndication.com"]');
    if (scripts.length > 0) return;

    // Create and load the script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
    script.crossOrigin = "anonymous";
    
    // Replace the placeholder script or append to head
    if (existingScript) {
      existingScript.src = script.src;
      existingScript.async = true;
      existingScript.crossOrigin = "anonymous";
    } else {
      document.head.appendChild(script);
    }
  };

  // Fallback function to render raw ad code
  const renderRawAdCode = () => {
    if (!adRef.current || !adsenseCode) return;

    const container = adRef.current;
    
    // Extract any script src from the code
    const srcMatch = adsenseCode.match(/src="([^"]+pagead2\.googlesyndication\.com[^"]+)"/);
    if (srcMatch) {
      loadAdSenseScriptFromSrc(srcMatch[1]);
    }

    // Insert the HTML (without script tags, as they won't execute)
    const cleanHtml = adsenseCode
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .trim();
    
    container.innerHTML = cleanHtml;

    // Try to push to adsbygoogle
    setTimeout(() => {
      try {
        if (container.querySelector(".adsbygoogle")) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("AdSense push error:", err);
      }
    }, 100);
  };

  // Load AdSense script from a full URL
  const loadAdSenseScriptFromSrc = (src) => {
    const scripts = document.querySelectorAll('script[src*="pagead2.googlesyndication.com"]');
    if (scripts.length > 0) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
  };

  if (error) {
    return (
      <div className={`text-center text-sm text-muted-foreground py-4 ${className}`}>
        {/* Silent fail - don't show error to end users */}
      </div>
    );
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

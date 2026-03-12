import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Loader2, Eye, Palette, Edit3, Rocket, ArrowRight, Home, Info,
  Briefcase, Mail, FileText, Check, ChevronLeft, ChevronRight, Globe,
  Star, Shield, Zap, Users, Heart, MapPin, Phone, Clock, Facebook,
  Instagram, Linkedin, Menu, X, Download, Server, ExternalLink, MessageCircle,
  HelpCircle, CreditCard
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Icon mapping for dynamic icons
const iconMap = {
  star: Star, shield: Shield, zap: Zap, users: Users, heart: Heart,
  home: Home, info: Info, briefcase: Briefcase, mail: Mail, file: FileText
};

// Theme configurations
const themes = {
  modern: {
    name: "Modern",
    primary: "#7c3aed",
    secondary: "#a855f7",
    bg: "bg-white",
    text: "text-slate-900",
    accent: "bg-violet-600",
    gradient: "from-violet-600 to-purple-600"
  },
  corporate: {
    name: "Corporate",
    primary: "#1e40af",
    secondary: "#3b82f6",
    bg: "bg-slate-50",
    text: "text-slate-800",
    accent: "bg-blue-700",
    gradient: "from-blue-700 to-blue-500"
  },
  startup: {
    name: "Startup",
    primary: "#059669",
    secondary: "#10b981",
    bg: "bg-white",
    text: "text-gray-900",
    accent: "bg-emerald-600",
    gradient: "from-emerald-600 to-teal-500"
  },
  minimal: {
    name: "Minimal",
    primary: "#18181b",
    secondary: "#3f3f46",
    bg: "bg-white",
    text: "text-zinc-900",
    accent: "bg-zinc-900",
    gradient: "from-zinc-800 to-zinc-600"
  }
};

// Animated Butterfly SVG for branding
const ButterflyIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
    <style>{`
      .butterfly-wing { animation: flap 0.4s ease-in-out infinite alternate; }
      .left-wing { transform-origin: 10px 10px; }
      .right-wing { transform-origin: 10px 10px; }
      @keyframes flap { from { transform: rotate(0deg); } to { transform: rotate(-20deg); } }
    `}</style>
    <g className="right-wing butterfly-wing" style={{animationDelay: '0s'}}>
      <path fill="#4D629A" d="M12.7,16.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98,0.48,6.14,2.64c1.27,1.28,1.52,3.09,0.56,4.06S13.97,17.43,12.7,16.16z"/>
      <path fill="#00A096" d="M16.26,12.5c-3.34,0-6.2-2.48-6.2-2.48s3.16-2.48,6.2-2.48c1.8,0,3.26,1.11,3.26,2.48S18.07,12.5,16.26,12.5z"/>
      <path fill="#89BF4A" d="M16.19,7.39c-2.36,2.36-6.14,2.64-6.14,2.64s0.48-3.99,2.64-6.14c1.27-1.27,3.09-1.52,4.05-0.56S17.47,6.12,16.19,7.39z"/>
    </g>
    <g className="left-wing butterfly-wing" style={{animationDelay: '0.1s', animationDirection: 'alternate-reverse'}}>
      <path fill="#8F5398" d="M7.3,16.11c2.36-2.36,2.64-6.14,2.64-6.14s-3.98,0.48-6.14,2.64c-1.27,1.27-1.52,3.09-0.56,4.06S6.03,17.39,7.3,16.11z"/>
      <path fill="#E16136" d="M3.74,12.45c3.34,0,6.2-2.48,6.2-2.48S6.78,7.5,3.74,7.5c-1.8,0-3.26,1.11-3.26,2.47S1.93,12.45,3.74,12.45z"/>
      <path fill="#F3BE33" d="M3.81,7.34c2.36,2.36,6.14,2.64,6.14,2.64S9.46,6,7.3,3.84C6.03,2.57,4.21,2.32,3.25,3.29S2.53,6.07,3.81,7.34z"/>
    </g>
  </svg>
);

// Large animated butterfly for loading screen
const LoadingButterfly = () => (
  <div className="relative">
    <style>{`
      @keyframes butterfly-float {
        0%, 100% { transform: translateY(0px) rotate(-2deg); }
        50% { transform: translateY(-8px) rotate(2deg); }
      }
      @keyframes wing-flap-left {
        from { transform: rotate(0deg) scaleX(1); }
        to { transform: rotate(-30deg) scaleX(0.9); }
      }
      @keyframes wing-flap-right {
        from { transform: rotate(0deg) scaleX(1); }
        to { transform: rotate(30deg) scaleX(0.9); }
      }
      .loading-butterfly {
        animation: butterfly-float 2s ease-in-out infinite;
      }
      .loading-butterfly .left-wing {
        animation: wing-flap-left 0.3s ease-in-out infinite alternate;
        transform-origin: 10px 10px;
      }
      .loading-butterfly .right-wing {
        animation: wing-flap-right 0.3s ease-in-out infinite alternate;
        transform-origin: 10px 10px;
      }
    `}</style>
    <svg className="loading-butterfly w-24 h-24" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <g className="right-wing">
        <path fill="#4D629A" d="M12.7,16.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98,0.48,6.14,2.64c1.27,1.28,1.52,3.09,0.56,4.06S13.97,17.43,12.7,16.16z"/>
        <path fill="#2F4977" d="M10.06,10.03c0,0,1.91,2.77,6.57,3.13c-0.25-0.33-0.52-0.63-0.83-0.9L10.06,10.03z"/>
        <path fill="#00A096" d="M16.26,12.5c-3.34,0-6.2-2.48-6.2-2.48s3.16-2.48,6.2-2.48c1.8,0,3.26,1.11,3.26,2.48S18.07,12.5,16.26,12.5z"/>
        <path fill="#08877A" d="M10.06,10.03c0,0,3.63,0.39,7.07-2.39c0,0-0.34-0.13-1.51-0.09L10.06,10.03z"/>
        <path fill="#89BF4A" d="M16.19,7.39c-2.36,2.36-6.14,2.64-6.14,2.64s0.48-3.99,2.64-6.14c1.27-1.27,3.09-1.52,4.05-0.56S17.47,6.12,16.19,7.39z"/>
      </g>
      <g className="left-wing">
        <path fill="#8F5398" d="M7.3,16.11c2.36-2.36,2.64-6.14,2.64-6.14s-3.98,0.48-6.14,2.64c-1.27,1.27-1.52,3.09-0.56,4.06S6.03,17.39,7.3,16.11z"/>
        <path fill="#75387F" d="M9.94,9.98c0,0-1.91,2.77-6.57,3.13c0.25-0.33,0.52-0.63,0.83-0.9L9.94,9.98z"/>
        <path fill="#E16136" d="M3.74,12.45c3.34,0,6.2-2.48,6.2-2.48S6.78,7.5,3.74,7.5c-1.8,0-3.26,1.11-3.26,2.47S1.93,12.45,3.74,12.45z"/>
        <path fill="#C34727" d="M9.94,9.98c0,0-3.63,0.39-7.07-2.39c0,0,0.34-0.13,1.51-0.09L9.94,9.98z"/>
        <path fill="#F3BE33" d="M3.81,7.34c2.36,2.36,6.14,2.64,6.14,2.64S9.46,6,7.3,3.84C6.03,2.57,4.21,2.32,3.25,3.29S2.53,6.07,3.81,7.34z"/>
      </g>
    </svg>
  </div>
);

// Loading messages that rotate during generation
const LOADING_MESSAGES = [
  "Analyzing your business details...",
  "Designing your homepage...",
  "Creating service sections...",
  "Generating hero imagery...",
  "Crafting compelling headlines...",
  "Building your about page...",
  "Setting up contact information...",
  "Adding finishing touches...",
  "Preparing your website preview..."
];

const AIBuilderPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("input"); // input, generating, preview
  const [businessTypes, setBusinessTypes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [builderSettings, setBuilderSettings] = useState(null);
  
  // Form state
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  
  // Website state
  const [websiteId, setWebsiteId] = useState(null);
  const [websiteContent, setWebsiteContent] = useState(null);
  const [websiteImages, setWebsiteImages] = useState({});
  const [currentPage, setCurrentPage] = useState("home");
  const [currentTheme, setCurrentTheme] = useState("modern");
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Publish flow state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishStep, setPublishStep] = useState("choice"); // choice, domain, plan, dns, download
  const [hostingChoice, setHostingChoice] = useState(null); // "diocreations" or "self"
  const [purchasedDomain, setPurchasedDomain] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    // Fetch business types and settings
    Promise.all([
      fetch(`${API_URL}/api/ai-builder/business-types`).then(r => r.json()),
      fetch(`${API_URL}/api/ai-builder/settings`).then(r => r.json())
    ]).then(([types, settings]) => {
      setBusinessTypes(types);
      setBuilderSettings(settings);
    }).catch(() => {
      setBusinessTypes([
        "Restaurant & Food", "Professional Services", "Retail & E-commerce",
        "Healthcare & Wellness", "Technology & IT", "Creative & Design", "Other"
      ]);
    });
  }, []);

  const handleGenerate = async () => {
    if (!businessName.trim() || !businessType || !description.trim() || !customerEmail.trim()) {
      toast.error("Please fill in all required fields including email");
      return;
    }
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setStep("generating");
    setGenerating(true);
    setProgress(0);
    setLoadingMessage(LOADING_MESSAGES[0]);

    // Simulate progress for content + images
    let messageIndex = 0;
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 3, 85));
    }, 1000);
    
    // Rotate loading messages
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 2500);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(`${API_URL}/api/ai-builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          business_type: businessType,
          description: description,
          location: location,
          customer_email: customerEmail
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      clearInterval(messageInterval);

      // Check response status
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Generation API error:", response.status, errorText);
        throw new Error(`Generation failed: ${response.status}`);
      }

      // Parse response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server");
      }

      // Validate response has required fields
      if (!data.website_id || !data.content) {
        console.error("Invalid response data:", data);
        throw new Error("Invalid website data received");
      }

      setProgress(100);
      setLoadingMessage("Preparing your website preview...");
      
      setTimeout(() => {
        setWebsiteId(data.website_id);
        setWebsiteContent(data.content);
        setWebsiteImages(data.images || {});
        setStep("preview");
        setGenerating(false);
        toast.success("Your website is ready!");
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      setGenerating(false);
      setStep("input");
      
      // More specific error messages
      if (error.name === 'AbortError') {
        toast.error("Generation timed out. Please try again.");
      } else if (error.message?.includes("503")) {
        toast.error("AI service temporarily unavailable. Please try again later.");
      } else if (error.message?.includes("429")) {
        toast.error("Too many requests. Please wait a moment and try again.");
      } else {
        console.error("Generation error:", error);
        toast.error("Website generation failed. Please try again.");
      }
    }
  };

  const handleThemeChange = async (theme) => {
    setCurrentTheme(theme);
    if (websiteId) {
      try {
        await fetch(`${API_URL}/api/ai-builder/website/${websiteId}/theme`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme })
        });
      } catch {
        // Silent fail - theme is already updated locally
      }
    }
  };

  const updateContent = (path, value) => {
    const newContent = JSON.parse(JSON.stringify(websiteContent));
    const keys = path.split(".");
    let current = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setWebsiteContent(newContent);
  };

  const saveContent = async () => {
    if (websiteId && websiteContent) {
      try {
        await fetch(`${API_URL}/api/ai-builder/website/${websiteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(websiteContent)
        });
        toast.success("Changes saved!");
      } catch {
        toast.error("Failed to save changes");
      }
    }
    setIsEditing(false);
  };

  const handleDomainSubmit = async () => {
    if (!purchasedDomain.trim()) {
      toast.error("Please enter your domain");
      return;
    }
    
    // Basic domain validation
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainPattern.test(purchasedDomain)) {
      toast.error("Please enter a valid domain (e.g., yourdomain.com)");
      return;
    }

    try {
      await fetch(`${API_URL}/api/ai-builder/website/${websiteId}/submit-domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website_id: websiteId, domain: purchasedDomain })
      });
      setPublishStep("plan");
    } catch {
      toast.error("Failed to submit domain");
    }
  };

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    
    try {
      await fetch(`${API_URL}/api/ai-builder/website/${websiteId}/select-hosting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website_id: websiteId, hosting_type: plan })
      });
      
      // Redirect to Stripe payment
      const stripeLink = plan === "waas" ? builderSettings?.waas_stripe_link : builderSettings?.ewaas_stripe_link;
      if (stripeLink) {
        window.open(stripeLink, "_blank");
        setPublishStep("dns");
      } else {
        toast.error("Payment link not configured. Please contact support.");
      }
    } catch {
      toast.error("Failed to select plan");
    }
  };

  const handleDownloadPayment = async () => {
    try {
      await fetch(`${API_URL}/api/ai-builder/website/${websiteId}/select-hosting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website_id: websiteId, hosting_type: "download" })
      });
      
      if (builderSettings?.download_stripe_link) {
        window.open(builderSettings.download_stripe_link, "_blank");
        setPublishStep("download");
      } else {
        // If no payment link, allow direct download (for testing)
        handleDownloadWebsite();
      }
    } catch {
      toast.error("Failed to process download");
    }
  };

  const handleDownloadWebsite = async () => {
    try {
      // First confirm payment (in production, this would be webhook-based)
      await fetch(`${API_URL}/api/ai-builder/website/${websiteId}/confirm-payment`, {
        method: "POST"
      });
      
      const response = await fetch(`${API_URL}/api/ai-builder/website/${websiteId}/download`);
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${businessName.toLowerCase().replace(/\s+/g, '-')}-website.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Website downloaded! Check the README for instructions.");
      setShowPublishModal(false);
    } catch (err) {
      toast.error("Failed to download website");
    }
  };

  const openWhatsApp = () => {
    const number = builderSettings?.whatsapp_number?.replace(/[^0-9]/g, '') || '';
    const message = encodeURIComponent(`Hi! I need help with my AI-generated website (ID: ${websiteId})`);
    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
  };

  const theme = themes[currentTheme];

  // Small butterfly icon for the header
  const HeaderButterfly = () => (
    <svg className="w-8 h-8" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .header-right-wing { animation: header-flap-r 0.4s ease-in-out infinite alternate; transform-origin: 10px 10px; }
        .header-left-wing { animation: header-flap-l 0.4s ease-in-out infinite alternate; transform-origin: 10px 10px; }
        @keyframes header-flap-r { from { transform: rotate(0deg); } to { transform: rotate(20deg); } }
        @keyframes header-flap-l { from { transform: rotate(0deg); } to { transform: rotate(-20deg); } }
      `}</style>
      <g className="header-right-wing">
        <path fill="#fff" fillOpacity="0.9" d="M12.7,16.16c-2.36-2.36-2.64-6.14-2.64-6.14s3.98,0.48,6.14,2.64c1.27,1.28,1.52,3.09,0.56,4.06S13.97,17.43,12.7,16.16z"/>
        <path fill="#fff" fillOpacity="0.8" d="M16.26,12.5c-3.34,0-6.2-2.48-6.2-2.48s3.16-2.48,6.2-2.48c1.8,0,3.26,1.11,3.26,2.48S18.07,12.5,16.26,12.5z"/>
        <path fill="#fff" fillOpacity="0.7" d="M16.19,7.39c-2.36,2.36-6.14,2.64-6.14,2.64s0.48-3.99,2.64-6.14c1.27-1.27,3.09-1.52,4.05-0.56S17.47,6.12,16.19,7.39z"/>
      </g>
      <g className="header-left-wing">
        <path fill="#fff" fillOpacity="0.9" d="M7.3,16.11c2.36-2.36,2.64-6.14,2.64-6.14s-3.98,0.48-6.14,2.64c-1.27,1.27-1.52,3.09-0.56,4.06S6.03,17.39,7.3,16.11z"/>
        <path fill="#fff" fillOpacity="0.8" d="M3.74,12.45c3.34,0,6.2-2.48,6.2-2.48S6.78,7.5,3.74,7.5c-1.8,0-3.26,1.11-3.26,2.47S1.93,12.45,3.74,12.45z"/>
        <path fill="#fff" fillOpacity="0.7" d="M3.81,7.34c2.36,2.36,6.14,2.64,6.14,2.64S9.46,6,7.3,3.84C6.03,2.57,4.21,2.32,3.25,3.29S2.53,6.07,3.81,7.34z"/>
      </g>
    </svg>
  );

  // Input Step
  if (step === "input") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 mb-4">
                <HeaderButterfly />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Build Your Website with AI
              </h1>
              <p className="text-lg text-slate-600">
                Create a complete multi-page website in seconds
              </p>
            </div>

            <Card className="shadow-xl border-0">
              <CardContent className="p-6 space-y-5">
                <div>
                  <Label htmlFor="customerEmail" className="text-sm font-medium">
                    Your Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5"
                    data-testid="ai-builder-email"
                  />
                  <p className="text-xs text-slate-500 mt-1">We'll send your website details here</p>
                </div>
                
                <div>
                  <Label htmlFor="businessName" className="text-sm font-medium">
                    Business Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Acme Solutions"
                    className="mt-1.5"
                    data-testid="ai-builder-business-name"
                  />
                </div>

                <div>
                  <Label htmlFor="businessType" className="text-sm font-medium">
                    Business Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger className="mt-1.5" data-testid="ai-builder-business-type">
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Short Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., We are a local bakery in London specializing in handmade cakes, pastries, and custom birthday desserts for families and events."
                  className="mt-1.5 min-h-[100px]"
                  data-testid="ai-builder-description"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Describe what your business does, who your customers are, and what services you offer.
                </p>
              </div>

              <div>
                <Label htmlFor="location" className="text-sm font-medium">
                  Location <span className="text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="mt-1.5"
                  data-testid="ai-builder-location"
                />
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full h-12 text-base bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                data-testid="ai-builder-generate-btn"
              >
                <Globe className="w-5 h-5 mr-2" />
                Generate My Website
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-slate-500 mt-4">
            Powered by AI • Your website will be ready in seconds
          </p>
        </motion.div>
      </div>
      <Footer />
    </div>
    );
  }

  // Generating Step
  if (step === "generating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <Navbar />
        <div className="pt-24 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {/* Animated Butterfly */}
            <div className="mb-8 flex items-center justify-center">
              <LoadingButterfly />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Generating Your Website
            </h2>
            
            {/* Rotating Loading Message */}
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-slate-600 mb-6 h-6"
              >
                {loadingMessage}
              </motion.p>
            </AnimatePresence>
          
          <div className="w-72 mx-auto">
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 bg-[length:200%_100%]"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${progress}%`,
                  backgroundPosition: ["0% 0%", "100% 0%"]
                }}
                transition={{ 
                  width: { duration: 0.3 },
                  backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" }
                }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-3">{progress}% complete</p>
          </div>
          
          <p className="text-xs text-slate-400 mt-6">
            This usually takes 15-20 seconds
          </p>
        </motion.div>
      </div>
    );
  }

  // Preview Step - Full Website Preview
  if (step === "preview" && websiteContent) {
    const content = websiteContent;
    const brand = content.brand || { name: businessName, tagline: "", primary_color: "#7c3aed" };

    return (
      <div className="min-h-screen bg-slate-100">
        {/* Toolbar */}
        <div className="fixed top-0 left-0 right-0 bg-white border-b z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setStep("input")} data-testid="ai-builder-back-btn">
                <ChevronLeft size={16} className="mr-1" /> Back
              </Button>
              <span className="text-sm font-medium text-slate-600 hidden sm:block">
                Editing: {brand.name}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={currentTheme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-32 h-9" data-testid="ai-builder-theme-selector">
                  <Palette size={14} className="mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(themes).map(([key, t]) => (
                    <SelectItem key={key} value={key}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => isEditing ? saveContent() : setIsEditing(true)}
                data-testid="ai-builder-edit-btn"
              >
                {isEditing ? <><Check size={14} className="mr-1" /> Save</> : <><Edit3 size={14} className="mr-1" /> Edit</>}
              </Button>
              
              <Button
                size="sm"
                className={`bg-gradient-to-r ${theme.gradient} hover:opacity-90`}
                onClick={() => { setShowPublishModal(true); setPublishStep("choice"); }}
                data-testid="ai-builder-publish-btn"
              >
                <Rocket size={14} className="mr-1" /> Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="fixed top-14 left-0 right-0 bg-slate-50 border-b z-40">
          <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
            <div className="flex gap-1 py-2">
              {[
                { id: "home", label: "Home", icon: Home },
                { id: "about", label: "About", icon: Info },
                { id: "services", label: "Services", icon: Briefcase },
                { id: "blog", label: "Blog", icon: FileText },
                { id: "contact", label: "Contact", icon: Mail }
              ].map((page) => (
                <Button
                  key={page.id}
                  variant={currentPage === page.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page.id)}
                  className={currentPage === page.id ? `bg-gradient-to-r ${theme.gradient}` : ""}
                  data-testid={`ai-builder-page-${page.id}`}
                >
                  <page.icon size={14} className="mr-1" /> {page.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Website Preview */}
        <div className="pt-28 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className={`${theme.bg} shadow-2xl rounded-lg overflow-hidden`}>
              {/* Website Header */}
              <header className={`bg-gradient-to-r ${theme.gradient} text-white`}>
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={24} />
                    <span className="font-bold text-lg">{brand.name}</span>
                  </div>
                  <nav className="hidden md:flex items-center gap-6">
                    {["Home", "About", "Services", "Blog", "Contact"].map((item) => (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item.toLowerCase())}
                        className={`text-sm font-medium hover:opacity-80 ${currentPage === item.toLowerCase() ? "border-b-2 border-white pb-1" : ""}`}
                      >
                        {item}
                      </button>
                    ))}
                  </nav>
                  <Button variant="secondary" size="sm" className="hidden md:flex">
                    Contact Us
                  </Button>
                  <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>
              </header>

              {/* Page Content */}
              <main className="min-h-[600px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* HOME PAGE */}
                    {currentPage === "home" && content.homepage && (
                      <div>
                        {/* Hero with optional image */}
                        <section 
                          className={`bg-gradient-to-br ${theme.gradient} text-white py-20 px-6 relative`}
                          style={websiteImages?.hero ? {
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(data:image/png;base64,${websiteImages.hero})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          } : {}}
                        >
                          <div className="max-w-4xl mx-auto text-center relative z-10">
                            <EditableText
                              value={content.homepage.headline}
                              isEditing={isEditing}
                              onChange={(v) => updateContent("homepage.headline", v)}
                              className="text-4xl md:text-5xl font-bold mb-4"
                            />
                            <EditableText
                              value={content.homepage.subheadline}
                              isEditing={isEditing}
                              onChange={(v) => updateContent("homepage.subheadline", v)}
                              className="text-xl opacity-90 mb-8 max-w-2xl mx-auto"
                            />
                            <Button size="lg" variant="secondary" className="text-lg px-8">
                              {content.homepage.cta_text || "Get Started"}
                              <ArrowRight className="ml-2" size={20} />
                            </Button>
                          </div>
                        </section>

                        {/* Features */}
                        {content.homepage.features && (
                          <section className="py-16 px-6">
                            <div className="max-w-5xl mx-auto">
                              <h2 className={`text-3xl font-bold text-center mb-12 ${theme.text}`}>
                                Why Choose Us
                              </h2>
                              <div className="grid md:grid-cols-3 gap-8">
                                {content.homepage.features.map((feature, i) => {
                                  const Icon = iconMap[feature.icon] || Star;
                                  const hasGeneratedIcon = websiteImages?.service_icons?.[i];
                                  return (
                                    <Card key={i} className="text-center p-6 hover:shadow-lg transition-shadow">
                                      {hasGeneratedIcon ? (
                                        <img 
                                          src={`data:image/png;base64,${websiteImages.service_icons[i]}`}
                                          alt={feature.title}
                                          className="w-14 h-14 mx-auto mb-4 rounded-xl object-cover"
                                        />
                                      ) : (
                                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${theme.gradient} text-white mb-4`}>
                                          <Icon size={24} />
                                        </div>
                                      )}
                                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                                      <p className="text-slate-600">{feature.description}</p>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          </section>
                        )}

                        {/* Services Preview */}
                        {content.homepage.services_preview && (
                          <section className="py-16 px-6 bg-slate-50">
                            <div className="max-w-5xl mx-auto">
                              <h2 className={`text-3xl font-bold text-center mb-12 ${theme.text}`}>
                                Our Services
                              </h2>
                              <div className="grid md:grid-cols-3 gap-6">
                                {content.homepage.services_preview.map((service, i) => (
                                  <Card key={i} className="p-6">
                                    <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                                    <p className="text-slate-600 text-sm">{service.description}</p>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </section>
                        )}
                      </div>
                    )}

                    {/* ABOUT PAGE */}
                    {currentPage === "about" && content.about && (
                      <div>
                        <section className={`bg-gradient-to-br ${theme.gradient} text-white py-16 px-6`}>
                          <div className="max-w-4xl mx-auto text-center">
                            <h1 className="text-4xl font-bold mb-4">{content.about.headline || content.about.title}</h1>
                          </div>
                        </section>
                        <section className="py-16 px-6">
                          <div className="max-w-3xl mx-auto">
                            <EditableText
                              value={content.about.content}
                              isEditing={isEditing}
                              onChange={(v) => updateContent("about.content", v)}
                              className={`text-lg ${theme.text} leading-relaxed whitespace-pre-line`}
                              multiline
                            />
                            {content.about.mission && (
                              <div className="mt-12 p-6 bg-slate-50 rounded-xl">
                                <h3 className="font-semibold text-lg mb-2">Our Mission</h3>
                                <p className="text-slate-600">{content.about.mission}</p>
                              </div>
                            )}
                            {content.about.values && (
                              <div className="mt-8">
                                <h3 className="font-semibold text-lg mb-4">Our Values</h3>
                                <div className="flex flex-wrap gap-2">
                                  {content.about.values.map((value, i) => (
                                    <span key={i} className={`px-4 py-2 rounded-full bg-gradient-to-r ${theme.gradient} text-white text-sm`}>
                                      {value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                    )}

                    {/* SERVICES PAGE */}
                    {currentPage === "services" && content.services && (
                      <div>
                        <section className={`bg-gradient-to-br ${theme.gradient} text-white py-16 px-6`}>
                          <div className="max-w-4xl mx-auto text-center">
                            <h1 className="text-4xl font-bold mb-4">{content.services.headline || content.services.title}</h1>
                            <p className="text-xl opacity-90">{content.services.description}</p>
                          </div>
                        </section>
                        <section className="py-16 px-6">
                          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
                            {content.services.services?.map((service, i) => (
                              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                                <h3 className="font-semibold text-xl mb-2">{service.title}</h3>
                                <p className="text-slate-600 mb-4">{service.description}</p>
                                {service.price && (
                                  <p className="font-semibold" style={{ color: theme.primary }}>{service.price}</p>
                                )}
                              </Card>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}

                    {/* BLOG PAGE */}
                    {currentPage === "blog" && content.blog && (
                      <div>
                        <section className={`bg-gradient-to-br ${theme.gradient} text-white py-16 px-6`}>
                          <div className="max-w-4xl mx-auto text-center">
                            <h1 className="text-4xl font-bold mb-4">{content.blog.headline || content.blog.title}</h1>
                          </div>
                        </section>
                        <section className="py-16 px-6">
                          <div className="max-w-4xl mx-auto space-y-6">
                            {content.blog.articles?.map((article, i) => (
                              <Card key={i} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold text-xl mb-2">{article.title}</h3>
                                    <p className="text-slate-600">{article.summary}</p>
                                  </div>
                                  <span className="text-sm text-slate-400">{article.date}</span>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}

                    {/* CONTACT PAGE */}
                    {currentPage === "contact" && content.contact && (
                      <div>
                        <section className={`bg-gradient-to-br ${theme.gradient} text-white py-16 px-6`}>
                          <div className="max-w-4xl mx-auto text-center">
                            <h1 className="text-4xl font-bold mb-4">{content.contact.headline || content.contact.title}</h1>
                            <p className="text-xl opacity-90">{content.contact.description}</p>
                          </div>
                        </section>
                        <section className="py-16 px-6">
                          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                              <h2 className="text-2xl font-bold">Get in Touch</h2>
                              <div className="space-y-4">
                                {content.contact.email && (
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient}`}>
                                      <Mail size={20} className="text-white" />
                                    </div>
                                    <span>{content.contact.email}</span>
                                  </div>
                                )}
                                {content.contact.phone && (
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient}`}>
                                      <Phone size={20} className="text-white" />
                                    </div>
                                    <span>{content.contact.phone}</span>
                                  </div>
                                )}
                                {content.contact.address && (
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient}`}>
                                      <MapPin size={20} className="text-white" />
                                    </div>
                                    <span>{content.contact.address}</span>
                                  </div>
                                )}
                                {content.contact.hours && (
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${theme.gradient}`}>
                                      <Clock size={20} className="text-white" />
                                    </div>
                                    <span>{content.contact.hours}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Card className="p-6">
                              <h3 className="font-semibold text-lg mb-4">Send us a message</h3>
                              <div className="space-y-4">
                                <Input placeholder="Your Name" />
                                <Input placeholder="Your Email" type="email" />
                                <Textarea placeholder="Your Message" rows={4} />
                                <Button className={`w-full bg-gradient-to-r ${theme.gradient}`}>
                                  Send Message
                                </Button>
                              </div>
                            </Card>
                          </div>
                        </section>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* Website Footer with Branding Badge */}
              <footer className="bg-slate-900 text-white py-12 px-6">
                <div className="max-w-5xl mx-auto">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <Globe size={24} />
                      <span className="font-bold text-lg">{brand.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {content.footer?.social_links?.includes("facebook") && <Facebook size={20} className="hover:text-blue-400 cursor-pointer" />}
                      {content.footer?.social_links?.includes("instagram") && <Instagram size={20} className="hover:text-pink-400 cursor-pointer" />}
                      {content.footer?.social_links?.includes("linkedin") && <Linkedin size={20} className="hover:text-blue-400 cursor-pointer" />}
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-400 text-sm">
                      {content.footer?.copyright || `© 2025 ${brand.name}. All rights reserved.`}
                    </p>
                    {/* Diocreations Branding Badge */}
                    <a 
                      href="https://diocreations.eu" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      <ButterflyIcon className="w-5 h-5" />
                      <span>Built with Diocreations AI</span>
                    </a>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>

        {/* Publish Modal */}
        <AnimatePresence>
          {showPublishModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowPublishModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Step 1: Choice */}
                {publishStep === "choice" && (
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-2">Publish Your Website</h2>
                    <p className="text-slate-600 mb-6">Choose how you want to host your website</p>

                    <div className="space-y-4">
                      <button
                        onClick={() => { setHostingChoice("diocreations"); setPublishStep("domain"); }}
                        className="w-full flex items-start gap-4 p-4 rounded-lg border-2 border-slate-200 hover:border-violet-500 hover:bg-violet-50 transition-all text-left"
                        data-testid="publish-host-diocreations"
                      >
                        <div className="p-3 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 shrink-0">
                          <Server size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Host with Diocreations</p>
                          <p className="text-sm text-slate-600">Fully managed hosting with maintenance and updates</p>
                          <p className="text-xs text-violet-600 mt-1">From €{builderSettings?.waas_price || 29.99}/month</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { setHostingChoice("self"); setPublishStep("download"); }}
                        className="w-full flex items-start gap-4 p-4 rounded-lg border-2 border-slate-200 hover:border-violet-500 hover:bg-violet-50 transition-all text-left"
                        data-testid="publish-download"
                      >
                        <div className="p-3 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 shrink-0">
                          <Download size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Host Yourself / Download</p>
                          <p className="text-sm text-slate-600">Download files and host anywhere you want</p>
                          <p className="text-xs text-slate-500 mt-1">One-time payment: €{builderSettings?.download_price || 19.99}</p>
                        </div>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowPublishModal(false)}
                      className="w-full mt-4 py-2 text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Step 2: Domain Registration */}
                {publishStep === "domain" && (
                  <div className="p-6">
                    <Button variant="ghost" size="sm" onClick={() => setPublishStep("choice")} className="mb-4">
                      <ChevronLeft size={16} className="mr-1" /> Back
                    </Button>
                    
                    <h2 className="text-2xl font-bold mb-2">Register Your Domain</h2>
                    <p className="text-slate-600 mb-6">
                      To host your website with Diocreations, you need a domain name.
                    </p>

                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-violet-800 mb-3">
                        <strong>Instructions:</strong>
                      </p>
                      <ol className="text-sm text-violet-700 space-y-2 list-decimal pl-4">
                        <li>Click the button below to open domain registration</li>
                        <li>Purchase your desired domain name</li>
                        <li>Return to this page after purchase</li>
                        <li>Enter your domain below</li>
                      </ol>
                    </div>

                    <Button
                      onClick={() => window.open(builderSettings?.domain_registration_url || "https://www.diocreations.in/products/domain-registration", "_blank")}
                      className="w-full mb-6 bg-gradient-to-r from-violet-600 to-purple-600"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      Register Domain
                    </Button>

                    <div className="border-t pt-6">
                      <Label className="text-sm font-medium">Already purchased? Enter your domain:</Label>
                      <Input
                        value={purchasedDomain}
                        onChange={(e) => setPurchasedDomain(e.target.value)}
                        placeholder="yourdomain.com"
                        className="mt-2 mb-4"
                      />
                      <Button onClick={handleDomainSubmit} className="w-full">
                        Continue with this Domain
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Plan Selection */}
                {publishStep === "plan" && (
                  <div className="p-6">
                    <Button variant="ghost" size="sm" onClick={() => setPublishStep("domain")} className="mb-4">
                      <ChevronLeft size={16} className="mr-1" /> Back
                    </Button>
                    
                    <h2 className="text-2xl font-bold mb-2">Select Hosting Plan</h2>
                    <p className="text-slate-600 mb-2">Domain: <strong>{purchasedDomain}</strong></p>
                    <p className="text-slate-600 mb-6">Choose the plan that fits your needs</p>

                    <div className="space-y-4">
                      {/* WaaS */}
                      <button
                        onClick={() => handlePlanSelect("waas")}
                        className="w-full flex items-start gap-4 p-4 rounded-lg border-2 border-slate-200 hover:border-violet-500 hover:bg-violet-50 transition-all text-left"
                      >
                        <div className="p-3 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 shrink-0">
                          <Globe size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-lg">WaaS</p>
                            <p className="font-bold text-violet-600">€{builderSettings?.waas_price || 29.99}/mo</p>
                          </div>
                          <p className="text-sm text-slate-600">Website as a Service</p>
                          <ul className="text-xs text-slate-500 mt-2 space-y-1">
                            <li>✓ Fully managed hosting</li>
                            <li>✓ Maintenance & updates</li>
                            <li>✓ SSL certificate included</li>
                          </ul>
                        </div>
                      </button>

                      {/* e-WaaS */}
                      <button
                        onClick={() => handlePlanSelect("ewaas")}
                        className="w-full flex items-start gap-4 p-4 rounded-lg border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                      >
                        <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 shrink-0">
                          <CreditCard size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-lg">e-WaaS</p>
                            <p className="font-bold text-emerald-600">€{builderSettings?.ewaas_price || 49.99}/mo</p>
                          </div>
                          <p className="text-sm text-slate-600">eCommerce Website</p>
                          <ul className="text-xs text-slate-500 mt-2 space-y-1">
                            <li>✓ Everything in WaaS</li>
                            <li>✓ Product management</li>
                            <li>✓ Payment integration</li>
                          </ul>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: DNS Configuration */}
                {publishStep === "dns" && (
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                        <Check size={32} className="text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Almost There!</h2>
                      <p className="text-slate-600">Configure your DNS to complete setup</p>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold mb-3">DNS Configuration</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Add this A record in your domain's DNS settings:
                      </p>
                      <div className="bg-white rounded border p-3 font-mono text-sm">
                        <p><strong>Type:</strong> A</p>
                        <p><strong>Host:</strong> @</p>
                        <p><strong>Points to:</strong> {builderSettings?.dns_server_ip || "[Contact support for IP]"}</p>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <HelpCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Need help with DNS?</p>
                          <p className="text-sm text-amber-700 mt-1">
                            Our team can assist you with DNS configuration.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {builderSettings?.whatsapp_number && (
                        <Button onClick={openWhatsApp} variant="outline" className="flex-1">
                          <MessageCircle size={16} className="mr-2" />
                          WhatsApp
                        </Button>
                      )}
                      <Button 
                        onClick={() => window.open(`mailto:${builderSettings?.support_email || 'support@diocreations.eu'}?subject=DNS Help - ${websiteId}`, "_blank")} 
                        variant="outline" 
                        className="flex-1"
                      >
                        <Mail size={16} className="mr-2" />
                        Email
                      </Button>
                    </div>

                    <Button 
                      onClick={() => setShowPublishModal(false)} 
                      className="w-full mt-4 bg-gradient-to-r from-violet-600 to-purple-600"
                    >
                      Done
                    </Button>
                  </div>
                )}

                {/* Download Step */}
                {publishStep === "download" && (
                  <div className="p-6">
                    <Button variant="ghost" size="sm" onClick={() => setPublishStep("choice")} className="mb-4">
                      <ChevronLeft size={16} className="mr-1" /> Back
                    </Button>
                    
                    <h2 className="text-2xl font-bold mb-2">Download Your Website</h2>
                    <p className="text-slate-600 mb-6">
                      Get a complete website package ready for any hosting provider
                    </p>

                    <div className="bg-slate-50 rounded-lg p-4 mb-6">
                      <h3 className="font-semibold mb-3">What's Included</h3>
                      <ul className="text-sm text-slate-600 space-y-2">
                        <li className="flex items-center gap-2">
                          <Check size={16} className="text-green-600" />
                          5 HTML pages (Home, About, Services, Blog, Contact)
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={16} className="text-green-600" />
                          CSS stylesheet with your theme colors
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={16} className="text-green-600" />
                          JavaScript for interactivity
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={16} className="text-green-600" />
                          Generated images (hero & icons)
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={16} className="text-green-600" />
                          README with deployment instructions
                        </li>
                      </ul>
                    </div>

                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-600">One-time payment</span>
                        <span className="text-2xl font-bold">€{builderSettings?.download_price || 19.99}</span>
                      </div>
                      
                      {builderSettings?.download_stripe_link ? (
                        <Button onClick={handleDownloadPayment} className="w-full bg-gradient-to-r from-violet-600 to-purple-600">
                          <CreditCard size={16} className="mr-2" />
                          Pay & Download
                        </Button>
                      ) : (
                        <Button onClick={handleDownloadWebsite} className="w-full bg-gradient-to-r from-violet-600 to-purple-600">
                          <Download size={16} className="mr-2" />
                          Download Website
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
};

// Editable Text Component
const EditableText = ({ value, isEditing, onChange, className, multiline = false }) => {
  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${className} bg-yellow-50 border-2 border-yellow-400 rounded p-2 w-full min-h-[150px]`}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} bg-yellow-50 border-2 border-yellow-400 rounded px-2`}
      />
    );
  }
  return <div className={className}>{value}</div>;
};

export default AIBuilderPage;

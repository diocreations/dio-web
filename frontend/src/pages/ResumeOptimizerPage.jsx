import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Upload, FileText, Zap, Download, CheckCircle, XCircle, AlertTriangle,
  Loader2, Lock, Star, Sparkles, Target, ArrowRight, Linkedin, HardDrive, RotateCcw, Share2, Link,
  Layers, Type,
} from "lucide-react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

import { ScoreRing } from "@/components/resume/ScoreRing";
import ResumePreview from "@/components/resume/ResumePreview";
import ScoreComparison from "@/components/resume/ScoreComparison";
import SectionEditor from "@/components/resume/SectionEditor";
import { VISUAL_TEMPLATES, STEPS } from "@/components/resume/constants";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ResumeOptimizerPage = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [improving, setImproving] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const [resumeId, setResumeId] = useState(null);
  const [textPreview, setTextPreview] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [hasDownloadAccess, setHasDownloadAccess] = useState(false);
  const [improved, setImproved] = useState(null);
  const [linkedinResult, setLinkedinResult] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeVisualTemplate, setActiveVisualTemplate] = useState("classic");
  const [isEditing, setIsEditing] = useState(false);
  const [editorMode, setEditorMode] = useState("preview"); // "preview" | "text" | "sections"
  const [editedText, setEditedText] = useState("");
  const [originalImprovedText, setOriginalImprovedText] = useState(""); // For reset functionality

  const [linkedinForm, setLinkedinForm] = useState({ headline: "", about: "", experience: "" });
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinScraping, setLinkedinScraping] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [driveConfigured, setDriveConfigured] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveToken, setDriveToken] = useState(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveImporting, setDriveImporting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [quickFixing, setQuickFixing] = useState(false);
  const [fixedText, setFixedText] = useState(null);
  const [useOriginalLayout, setUseOriginalLayout] = useState(true);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(null);
  const [pubUser, setPubUser] = useState(null);
  const [ogMeta, setOgMeta] = useState(null);

  // Fetch OG meta for shared links
  useEffect(() => {
    const shareId = searchParams.get("share");
    if (shareId) {
      fetch(`${API_URL}/api/resume/og/${shareId}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setOgMeta(data); })
        .catch(() => {});
    }
  }, [searchParams]);

  // Check for logged in user
  useEffect(() => {
    const stored = localStorage.getItem("pub_user");
    if (stored) setPubUser(JSON.parse(stored));
  }, []);

  // Google Sign-In handler for quick access
  const handleQuickGoogleSignIn = () => {
    const redirectUrl = `${window.location.origin}/login`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const displayPrice = () => {
    const base = pricing?.price || 19.99;
    const curr = pricing?.currency || "EUR";
    if (referralDiscount) {
      const discounted = (base * (1 - referralDiscount.discount_percent / 100)).toFixed(2);
      return <><s className="opacity-50 mr-1">{curr} {base}</s> {curr} {discounted}</>;
    }
    return `${curr} ${base}`;
  };

  useEffect(() => {
    fetch(`${API_URL}/api/resume/pricing`).then((r) => r.json()).then(setPricing).catch(() => {});
    fetch(`${API_URL}/api/resume/templates`).then((r) => r.json()).then(setTemplates).catch(() => {});
    fetch(`${API_URL}/api/drive/status`).then((r) => r.json()).then((d) => setDriveConfigured(d.configured)).catch(() => {});
    // Check for referral code in URL
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      fetch(`${API_URL}/api/referral/validate/${ref}`).then((r) => r.ok ? r.json() : null).then((d) => {
        if (d?.valid) {
          setReferralDiscount(d);
          toast.success(`Referral code applied! ${d.discount_percent}% off your purchase.`);
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const sid = searchParams.get("session_id");
    const rid = searchParams.get("resume_id");
    const dt = searchParams.get("drive_token");
    if (dt) {
      setDriveToken(dt);
      fetch(`${API_URL}/api/drive/list-files`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_id: dt }),
      }).then((r) => r.json()).then((d) => {
        if (d.files?.length > 0) { setDriveFiles(d.files); setShowDrivePicker(true); }
        else toast.info("No PDF/DOCX files found in your Google Drive");
      }).catch(() => toast.error("Could not load Drive files"));
    }
    if (sid && rid) {
      setResumeId(rid);
      setStep(4);
      setPaymentLoading(true);

      // Verify payment FIRST, then load full data (sequential - backend gates responses by payment status)
      const processPaymentReturn = async () => {
        // Step 1: Verify payment with retry
        let paymentConfirmed = false;
        for (let i = 0; i < 3; i++) {
          try {
            const res = await fetch(`${API_URL}/api/resume/verify-payment`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: sid, resume_id: rid }),
            });
            const d = await res.json();
            if (d.paid) { paymentConfirmed = true; break; }
          } catch {}
          if (i < 2) await new Promise(r => setTimeout(r, (i + 1) * 1000));
        }
        // Fallback: check by resume_id
        if (!paymentConfirmed) {
          try {
            const res = await fetch(`${API_URL}/api/resume/payment-status/${rid}`);
            const d = await res.json();
            if (d.paid) paymentConfirmed = true;
          } catch {}
        }

        if (paymentConfirmed) {
          setHasDownloadAccess(true);
          toast.success("Payment successful! You can now download your resume.");
        } else {
          toast.error("Payment verification pending. If you paid, please refresh the page.");
        }

        // Step 2: Load data AFTER payment is verified (so backend returns full text)
        try {
          const analysisRes = await fetch(`${API_URL}/api/resume/analyze`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume_id: rid }),
          });
          if (analysisRes.ok) setAnalysis(await analysisRes.json());

          // Try quick-fix first, then improve
          let gotImproved = false;
          const qfRes = await fetch(`${API_URL}/api/resume/quick-fix`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume_id: rid }),
          });
          if (qfRes.ok) {
            const qfData = await qfRes.json();
            if (qfData.fixed_text && !qfData.is_preview) {
              setImproved({ improved_text: qfData.fixed_text, resume_id: rid, is_preview: false });
              setEditedText(qfData.fixed_text);
              setOriginalImprovedText(qfData.fixed_text); // Store original for reset
              gotImproved = true;
            }
          }
          if (!gotImproved) {
            const improveRes = await fetch(`${API_URL}/api/resume/improve`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resume_id: rid }),
            });
            if (improveRes.ok) {
              const data = await improveRes.json();
              setImproved(data);
              setEditedText(data.improved_text || "");
              setOriginalImprovedText(data.improved_text || ""); // Store original for reset
            }
          }
          // Also re-fetch LinkedIn optimization if it exists (now returns full data after payment)
          try {
            const linkedinRes = await fetch(`${API_URL}/api/resume/linkedin`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resume_id: rid }),
            });
            if (linkedinRes.ok) {
              const lnData = await linkedinRes.json();
              if (!lnData.is_preview) setLinkedinResult(lnData);
            }
          } catch {}
        } catch {}
      };

      processPaymentReturn().finally(() => setPaymentLoading(false));
    }

    // Handle share URL - load shared resume analysis
    const shareId = searchParams.get("share");
    if (shareId && !sid && !rid) {
      setResumeId(shareId);
      setStep(2);
      setAnalyzing(true);
      fetch(`${API_URL}/api/resume/share/${shareId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            setAnalysis(data);
            toast.info("Viewing shared resume analysis. Upload your own resume to get started!");
          } else {
            toast.error("Shared resume not found");
            setStep(1);
          }
        })
        .catch(() => {
          toast.error("Could not load shared resume");
          setStep(1);
        })
        .finally(() => setAnalyzing(false));
    }
  }, [searchParams]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/resume/upload`, { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setResumeId(data.resume_id);
        setTextPreview(data.text_preview);
        setWordCount(data.word_count);
        setStep(2);
        setAnalyzing(true);
        const analysisRes = await fetch(`${API_URL}/api/resume/analyze`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume_id: data.resume_id }),
        });
        if (analysisRes.ok) setAnalysis(await analysisRes.json());
      } else {
        const err = await res.json();
        toast.error(err.detail || "Upload failed");
      }
    } catch { toast.error("Upload failed. Please try again."); }
    finally { setUploading(false); setAnalyzing(false); }
  };

  const handleCheckout = async () => {
    if (!checkoutEmail) {
      setShowEmailPrompt(true);
      return;
    }
    try {
      const body = { resume_id: resumeId, email: checkoutEmail, origin_url: window.location.origin };
      if (referralCode && referralDiscount) body.referral_code = referralCode;
      const res = await fetch(`${API_URL}/api/resume/checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkout_url;
      }
    } catch { toast.error("Checkout failed"); }
  };

  const submitEmailAndCheckout = async () => {
    if (!checkoutEmail || !checkoutEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setShowEmailPrompt(false);
    handleCheckout();
  };

  const handleImprove = async (forceRegenerate = false) => {
    setImproving(true);
    setImproved(null);
    setStep(3);
    try {
      const body = { resume_id: resumeId, force_regenerate: forceRegenerate };
      if (selectedTemplate) body.template_id = selectedTemplate;
      const res = await fetch(`${API_URL}/api/resume/improve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setImproved(data);
        setEditedText(data.improved_text || "");
        setOriginalImprovedText(data.improved_text || ""); // Store original for reset
        setStep(4);
        if (data.is_preview) {
          toast.info("Preview ready! Pay to unlock the full improved resume.");
        }
      }
    } catch { toast.error("Improvement failed"); }
    finally { setImproving(false); }
  };

  const handleLinkedIn = async () => {
    setLinkedinLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/resume/linkedin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: resumeId, ...linkedinForm }),
      });
      if (res.ok) setLinkedinResult(await res.json());
    } catch { toast.error("LinkedIn optimization failed"); }
    finally { setLinkedinLoading(false); }
  };

  const handleLinkedinScrape = async () => {
    if (!linkedinUrl.trim()) return;
    setLinkedinScraping(true);
    try {
      const res = await fetch(`${API_URL}/api/resume/linkedin-scrape`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkedinUrl }),
      });
      const data = await res.json();
      if (data.success && (data.headline || data.about)) {
        setLinkedinForm(prev => ({ headline: data.headline || prev.headline, about: data.about || prev.about, experience: data.experience || prev.experience }));
        toast.success("Profile captured! Review and optimize below.");
      } else {
        toast.info(data.note || "Could not extract. Please paste manually.");
      }
    } catch { toast.error("Could not fetch LinkedIn profile"); }
    finally { setLinkedinScraping(false); }
  };

  const handleGoogleDrive = () => {
    if (!driveConfigured) {
      toast.info("Google Drive integration is not configured yet. Please upload your file directly.");
      return;
    }
    fetch(`${API_URL}/api/drive/connect?redirect_url=${encodeURIComponent(window.location.origin)}`)
      .then((r) => r.json()).then((d) => {
        if (d.authorization_url) window.location.href = d.authorization_url;
        else toast.error("Could not connect to Google Drive");
      }).catch(() => toast.error("Could not connect to Google Drive"));
  };

  const handleDriveImport = async (file) => {
    setDriveImporting(true);
    setShowDrivePicker(false);
    try {
      const res = await fetch(`${API_URL}/api/drive/import-file`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_id: driveToken, file_id: file.id, file_name: file.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setResumeId(data.resume_id);
        setTextPreview(data.text_preview);
        setWordCount(data.word_count);
        toast.success(`Imported "${file.name}" from Google Drive`);
        setStep(2);
        setAnalyzing(true);
        const analysisRes = await fetch(`${API_URL}/api/resume/analyze`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume_id: data.resume_id }),
        });
        if (analysisRes.ok) setAnalysis(await analysisRes.json());
      } else {
        const err = await res.json();
        toast.error(err.detail || "Import failed");
      }
    } catch { toast.error("Import failed"); }
    finally { setDriveImporting(false); setAnalyzing(false); }
  };

  const handleQuickFix = async () => {
    if (!resumeId) return;
    setQuickFixing(true);
    try {
      const res = await fetch(`${API_URL}/api/resume/quick-fix`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: resumeId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFixedText(data.fixed_text);
        setEditedText(data.fixed_text);
        setOriginalImprovedText(data.fixed_text); // Store original for reset
        setImproved({ improved_text: data.fixed_text, resume_id: resumeId, is_preview: data.is_preview || false });
        setStep(4);
        setUseOriginalLayout(true);
        if (data.is_preview) {
          toast.info("Preview ready! Pay to unlock the full improved resume.");
        } else {
          toast.success("Fixes applied! Review and edit your improved resume.");
        }
      } else {
        toast.error("Quick fix failed. Please try again.");
      }
    } catch { toast.error("Quick fix failed."); }
    finally { setQuickFixing(false); }
  };

  // Reset to original improved text
  const handleResetResume = () => {
    if (originalImprovedText) {
      setEditedText(originalImprovedText);
      toast.success("Resume reset to original improved version");
    }
  };

  const extractResumeFilename = (text) => {
    const content = text || editedText || "";
    const lines = content.replace(/<[^>]*>/g, " ").split("\n").filter(l => l.trim());
    let name = "resume";
    let title = "";
    if (lines[0]) {
      name = lines[0].trim().replace(/[^a-zA-Z\s]/g, "").trim();
    }
    // Look for job title in professional summary or first heading content
    for (const line of lines.slice(1, 10)) {
      const cleaned = line.trim();
      if (/^(senior|junior|lead|principal|staff|chief|head|director|manager|engineer|developer|analyst|designer|consultant|architect)/i.test(cleaned)) {
        title = cleaned.split(/[,|•\n]/)[0].trim();
        break;
      }
      // Also check "Title | Company" or "Title, Company" patterns
      if (/developer|engineer|manager|analyst|designer|architect|consultant|director|specialist|coordinator/i.test(cleaned) && cleaned.length < 80) {
        title = cleaned.split(/[,|•\n]/)[0].trim();
        break;
      }
    }
    const namePart = name.split(/\s+/).slice(0, 3).join("-");
    const titlePart = title ? "-" + title.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/).slice(0, 4).join("-") : "";
    const today = new Date();
    const datePart = `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getFullYear()}`;
    return `${namePart}${titlePart}-${datePart}`.toLowerCase().replace(/--+/g, "-");
  };

  const handleDownloadPDF = async () => {
    if (!editedText) return;
    if (!hasDownloadAccess) { handleCheckout(); return; }
    
    toast.info("Generating PDF...", { duration: 2000 });
    const filename = extractResumeFilename(editedText);
    const tpl = activeVisualTemplate || "classic";

    // Template configurations
    const configs = {
      classic: { font: "'Georgia','Times New Roman',serif", accent: "#1a1a2e", nameSize: "20pt", contactSize: "8pt", nameAlign: "center", bodyColor: "#333", h2Style: "border-bottom:1.5px solid #1a1a2e;color:#1a1a2e;padding-bottom:4px;", accentBar: "height:2px;background:#1a1a2e;margin:10px 0 16px;width:100%;" },
      modern: { font: "'Segoe UI',Calibri,sans-serif", accent: "#2563eb", nameSize: "22pt", contactSize: "8pt", nameAlign: "left", bodyColor: "#374151", h2Style: "color:#2563eb;border-left:3px solid #2563eb;padding-left:10px;border-bottom:none;", accentBar: "height:3px;background:#2563eb;margin:10px 0 16px;width:60px;border-radius:2px;" },
      executive: { font: "'Segoe UI',Calibri,sans-serif", accent: "#d97706", nameSize: "22pt", contactSize: "8pt", nameAlign: "left", bodyColor: "#374151", h2Style: "color:#92400e;border-bottom:2px solid #fbbf2440;padding-bottom:4px;", headerBg: "#1e293b", headerColor: "#ffffff", accentBar: "" },
      minimal: { font: "'Helvetica Neue',Helvetica,sans-serif", accent: "#6b7280", nameSize: "18pt", contactSize: "7.5pt", nameAlign: "left", bodyColor: "#4b5563", h2Style: "color:#9ca3af;border-bottom:none;letter-spacing:4px;font-weight:400;font-size:8pt;text-transform:uppercase;", accentBar: "height:1px;background:#e5e7eb;margin:14px 0 20px;width:100%;" },
      bold: { font: "'Inter','Segoe UI',sans-serif", accent: "#dc2626", nameSize: "24pt", contactSize: "8pt", nameAlign: "left", bodyColor: "#1f2937", h2Style: "background:#dc2626;color:#ffffff;padding:6px 12px;border-radius:4px;display:inline-block;border-bottom:none;", accentBar: "height:4px;background:#dc2626;margin:10px 0 16px;width:100%;border-radius:2px;" },
      elegant: { font: "'Georgia','Palatino Linotype',serif", accent: "#0d9488", nameSize: "20pt", contactSize: "8pt", nameAlign: "center", bodyColor: "#374151", h2Style: "color:#0f766e;border-bottom:1px solid #0d948840;padding-bottom:4px;", accentBar: "height:1px;background:linear-gradient(90deg,transparent,#0d9488,transparent);margin:10px 0 16px;width:100%;" },
      corporate: { font: "'Segoe UI',Calibri,sans-serif", accent: "#1e3a5f", nameSize: "20pt", contactSize: "8pt", nameAlign: "left", bodyColor: "#374151", h2Style: "color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:4px;", leftBar: true, accentBar: "height:2px;background:#1e3a5f40;margin:10px 0 16px;width:100%;" },
      creative: { font: "'Inter','Segoe UI',sans-serif", accent: "#7c3aed", nameSize: "24pt", contactSize: "8pt", nameAlign: "left", bodyColor: "#374151", h2Style: "color:#7c3aed;border-bottom:2px solid #e9d5ff;padding-bottom:4px;", accentBar: "height:4px;background:linear-gradient(90deg,#7c3aed,#a78bfa);margin:10px 0 16px;width:80px;border-radius:2px;" },
    };
    const c = configs[tpl] || configs.classic;

    // Clean HTML content - strip highlights, colored text, and non-professional formatting
    const cleanHtmlForPdf = (html) => {
      // Remove background colors (highlights)
      let cleaned = html.replace(/background(-color)?:\s*[^;]+;?/gi, "");
      // Remove colored text - replace with standard black/body color
      cleaned = cleaned.replace(/color:\s*(?!#1a1a2e|#333|#374151|#1f2937|#4b5563)[^;]+;?/gi, "");
      // Remove hiliteColor spans
      cleaned = cleaned.replace(/<span[^>]*style="[^"]*background[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, "$1");
      // Remove font color spans that have non-standard colors
      cleaned = cleaned.replace(/<font[^>]*color="(?!#1a1a2e|#333|black)"[^>]*>([\s\S]*?)<\/font>/gi, "$1");
      return cleaned;
    };

    // Build HTML content
    let extraCss = "";
    if (c.leftBar) extraCss += `body{border-left:5px solid ${c.accent};padding-left:28px;}`;
    if (c.headerBg) {
      extraCss += `.header-block{background:${c.headerBg};color:${c.headerColor};padding:20px 24px 16px;margin:-24px -24px 16px;}`;
      extraCss += `.header-block .resume-name{color:${c.headerColor};}`;
      extraCss += `.header-block .resume-contact{color:rgba(255,255,255,0.7);}`;
    }

    const isHtmlContent = editedText.includes("<h2>") || editedText.includes("<p>") || editedText.includes("<li>");
    let bodyContent = "";

    if (isHtmlContent) {
      let html = cleanHtmlForPdf(editedText);
      let firstP = false, contactDone = false;
      const nameEntries = [];
      
      html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, content) => {
        const text = content.replace(/<[^>]*>/g, "").trim();
        if (!firstP && text && !text.startsWith("-") && !/^[A-Z][A-Z\s\/&,]{3,}$/.test(text)) {
          firstP = true;
          nameEntries.push(`<div class="resume-name">${content}</div>`);
          return "%%NAME%%";
        }
        if (firstP && !contactDone && (text.includes("@") || text.includes("|") || /\+?\d[\d\s\-()]{5,}/.test(text) || /linkedin/i.test(text))) {
          contactDone = true;
          nameEntries.push(`<div class="resume-contact">${content.replace(/\|/g, " &middot; ")}</div>`);
          return "%%CONTACT%%";
        }
        return match;
      });
      
      let nameBlock = nameEntries.join("");
      if (c.headerBg) nameBlock = `<div class="header-block">${nameBlock}</div>`;
      else nameBlock += `<div class="accent-bar"></div>`;
      bodyContent = html.replace("%%NAME%%", nameBlock).replace(/%%CONTACT%%/g, "");
    } else {
      const lines = editedText.split("\n");
      const nameLines = [];
      let bodyStartIdx = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const t = lines[i].trim();
        if (!t) { bodyStartIdx = i + 1; break; }
        const isH = /^[A-Z][A-Z\s\/&,]{3,}$/.test(t) && !t.includes("@") && !t.includes("|") && !t.includes(".com");
        if (isH) { bodyStartIdx = i; break; }
        nameLines.push(t);
        bodyStartIdx = i + 1;
      }
      
      if (c.headerBg) bodyContent += `<div class="header-block">`;
      if (nameLines[0]) bodyContent += `<div class="resume-name">${nameLines[0]}</div>`;
      for (let i = 1; i < nameLines.length; i++) bodyContent += `<div class="resume-contact">${nameLines[i].replace(/\|/g, " &middot; ")}</div>`;
      if (c.headerBg) bodyContent += `</div>`;
      else bodyContent += `<div class="accent-bar"></div>`;
      
      for (let i = bodyStartIdx; i < lines.length; i++) {
        const t = lines[i].trim();
        if (!t) { bodyContent += "<br/>"; continue; }
        const isH = /^[A-Z][A-Z\s\/&,]{3,}$/.test(t) && !t.includes("@") && !t.includes("|") && !t.includes(".com");
        const isBul = /^[-*\u2022]\s+/.test(t);
        const hasDate = /\d{4}\s*[-\u2013]\s*(present|\d{4})/i.test(t);
        if (isH) bodyContent += `<h2>${t}</h2>`;
        else if (isBul) bodyContent += `<li>${t.replace(/^[-*\u2022]\s+/, "")}</li>`;
        else if (hasDate) {
          const dm = t.match(/(\w+\s+\d{4}\s*[-\u2013]\s*(?:Present|\w+\s+\d{4}))/i);
          if (dm) { const rest = t.replace(dm[1], "").replace(/\|/g, "").trim(); bodyContent += `<div class="job-header"><span class="job-title">${rest}</span><span class="job-dates">${dm[1]}</span></div>`; }
          else bodyContent += `<p><strong>${t}</strong></p>`;
        } else bodyContent += `<p>${t}</p>`;
      }
    }

    // Create temporary container for PDF generation
    const container = document.createElement("div");
    container.innerHTML = `
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:${c.font};width:100%;max-width:100%;margin:0;padding:24px;line-height:1.5;color:${c.bodyColor};font-size:10pt;}
        ${extraCss}
        .resume-name{font-size:${c.nameSize};font-weight:700;color:${c.accent};letter-spacing:0.5px;margin-bottom:2px;text-align:${c.nameAlign};}
        .resume-contact{font-size:${c.contactSize};color:#555;margin-bottom:1px;line-height:1.35;text-align:${c.nameAlign};}
        .resume-contact a{color:${c.accent};text-decoration:none;}
        .accent-bar{${c.accentBar || "display:none;"}}
        h2{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:2px;${c.h2Style}margin:14px 0 6px;}
        h3{font-size:9.5pt;font-weight:600;color:${c.bodyColor};margin:8px 0 3px;}
        .job-header{display:flex;justify-content:space-between;align-items:baseline;margin:8px 0 3px;flex-wrap:wrap;gap:6px;}
        .job-title{font-weight:700;font-size:10pt;color:${c.bodyColor};}
        .job-dates{font-style:italic;color:#777;font-size:9pt;}
        p{margin:2px 0;line-height:1.5;font-size:10pt;}
        ul{padding-left:18px;margin:3px 0 6px;list-style-type:disc;}
        ol{padding-left:18px;margin:3px 0 6px;}
        li{margin-bottom:2px;line-height:1.45;font-size:10pt;}
        strong,b{font-weight:700;}em,i{font-style:italic;}
        a{color:${c.accent};text-decoration:none;}
        hr{border:none;border-top:1px solid #ddd;margin:8px 0;}
      </style>
      <div style="font-family:${c.font};padding:24px;line-height:1.5;color:${c.bodyColor};font-size:10pt;${c.leftBar ? `border-left:5px solid ${c.accent};padding-left:28px;` : ""}">${bodyContent}</div>
    `;
    document.body.appendChild(container);

    try {
      const opt = {
        margin: [0.5, 0.6, 0.5, 0.6],
        filename: `${filename}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      await html2pdf().set(opt).from(container.querySelector("div")).save();
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("PDF generation failed. Please try again.");
    } finally {
      document.body.removeChild(container);
    }
  };

  const StepIcon = ({ id }) => {
    const icons = { 1: Upload, 2: FileText, 3: Sparkles, 4: Download };
    const Icon = icons[id];
    return Icon ? <Icon size={16} /> : null;
  };

  return (
    <Layout>
      {/* Dynamic OG Meta for Shared Links */}
      {ogMeta && (
        <Helmet>
          <title>{ogMeta.title}</title>
          <meta property="og:title" content={ogMeta.title} />
          <meta property="og:description" content={ogMeta.description} />
          <meta property="og:image" content={ogMeta.image || "https://www.diocreations.eu/og-resume.jpg"} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={ogMeta.title} />
          <meta name="twitter:description" content={ogMeta.description} />
        </Helmet>
      )}
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-white to-white overflow-hidden">
          <div className="absolute inset-0 gradient-violet-subtle" />
          <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6" data-testid="resume-badge">AI-Powered Resume Tool</span>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4" data-testid="resume-title">
              {pricing?.product_name || "DioAI Resume & LinkedIn Optimizer"}
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Get a free AI analysis of your resume. Unlock pro features to optimize for ATS, rewrite with impact, and supercharge your LinkedIn profile.
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${step >= s.id ? "bg-primary text-white" : "bg-slate-100 text-muted-foreground"}`}>
                    <StepIcon id={s.id} />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <ArrowRight size={16} className="text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 py-12">
          <AnimatePresence mode="wait">
            {/* STEP 1: Upload */}
            {step === 1 && (
              <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className="max-w-xl mx-auto">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Upload size={32} className="text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Upload Your Resume</h2>
                    <p className="text-muted-foreground mb-6">PDF or DOCX format. Max 5MB. Your free analysis starts instantly.</p>
                    <label className="block">
                      <input type="file" accept=".pdf,.docx" onChange={handleUpload} className="hidden" data-testid="resume-upload-input" />
                      <Button asChild disabled={uploading} className="rounded-full px-8" data-testid="resume-upload-btn">
                        <span>{uploading ? <><Loader2 className="animate-spin mr-2" size={18} />Uploading...</> : <><Upload size={16} className="mr-2" />Choose File</>}</span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-4">or import from</p>
                    <div className="flex gap-2 justify-center mt-2">
                      <button onClick={handleGoogleDrive} disabled={driveImporting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-full hover:bg-slate-50 transition-colors cursor-pointer" data-testid="google-drive-btn">
                        {driveImporting ? <Loader2 className="animate-spin w-4 h-4" /> : <HardDrive size={14} />}
                        Google Drive
                      </button>
                    </div>
                    {showDrivePicker && driveFiles.length > 0 && (
                      <div className="mt-4 border rounded-lg p-4 bg-slate-50 max-h-60 overflow-y-auto">
                        <p className="text-sm font-medium mb-3">Select a file from Google Drive:</p>
                        <div className="space-y-2">
                          {driveFiles.map((f) => (
                            <button key={f.id} onClick={() => handleDriveImport(f)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-left border border-transparent hover:border-slate-200" data-testid={`drive-file-${f.id}`}>
                              <FileText size={16} className="text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{f.name}</p>
                                <p className="text-xs text-muted-foreground">{f.mimeType?.includes("pdf") ? "PDF" : "DOCX"}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: Analysis */}
            {step === 2 && (
              <motion.div key="analysis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {analyzing ? (
                  <div className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={40} />
                    <p className="text-lg font-medium">Analyzing your resume...</p>
                    <p className="text-muted-foreground">This takes about 10 seconds</p>
                  </div>
                ) : analysis ? (
                  <div className="space-y-8">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex justify-center gap-12">
                        <ScoreRing score={analysis.overall_score} label="Overall Score" size={120} />
                        <ScoreRing score={analysis.ats_score} label="ATS Score" size={120} />
                      </div>
                      {/* Share Analysis Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/resume-optimizer?share=${resumeId}`;
                          navigator.clipboard.writeText(shareUrl);
                          toast.success("Share link copied! Send it to friends to show your resume score.");
                        }}
                        data-testid="share-analysis-btn"
                      >
                        <Share2 size={14} />
                        Share Your Score
                      </Button>
                    </div>

                    {/* Shared Resume CTA - When viewing someone else's analysis */}
                    {searchParams.get("share") && (
                      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg">
                        <CardContent className="p-6 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <Upload size={24} className="text-primary" />
                          </div>
                          <h3 className="font-bold text-lg mb-2">Want to see your resume score?</h3>
                          <p className="text-muted-foreground text-sm mb-4">Get a free AI analysis of your resume in seconds</p>
                          <Button 
                            onClick={() => {
                              window.location.href = `${window.location.origin}/resume-optimizer`;
                            }} 
                            className="rounded-full px-8"
                            data-testid="try-it-yourself-btn"
                          >
                            <Upload size={16} className="mr-2" />
                            Analyze My Resume
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card><CardContent className="p-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><CheckCircle size={20} className="text-green-500" /> Strengths</h3>
                        <ul className="space-y-2">{analysis.strengths?.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />{s}</li>)}</ul>
                      </CardContent></Card>
                      <Card><CardContent className="p-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><XCircle size={20} className="text-red-500" /> Weaknesses</h3>
                        <ul className="space-y-2">{analysis.weaknesses?.map((w, i) => <li key={i} className="flex items-start gap-2 text-sm"><XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />{w}</li>)}</ul>
                      </CardContent></Card>
                      <Card><CardContent className="p-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Target size={20} className="text-primary" /> Missing Keywords</h3>
                        <div className="flex flex-wrap gap-2">{analysis.missing_keywords?.map((k, i) => <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">{k}</span>)}</div>
                      </CardContent></Card>
                      <Card><CardContent className="p-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Sparkles size={20} className="text-primary" /> Suggestions</h3>
                        <ul className="space-y-2">{analysis.suggestions?.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />{s}</li>)}</ul>
                      </CardContent></Card>
                    </div>

                    {/* Score Comparison */}
                    <ScoreComparison currentAnalysis={analysis} resumeId={resumeId} onCopyToEditor={(text) => {
                      setEditedText(text);
                      setOriginalImprovedText(text); // Store original for reset
                      setImproved({ improved_text: text, resume_id: resumeId });
                      setStep(4);
                      toast.success("Comparison resume loaded into editor. You can now edit and download.");
                    }} />

                    {/* Sign in prompt for non-logged users */}
                    {!pubUser && (
                      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex-1 text-center sm:text-left">
                              <p className="font-medium text-slate-800">Save your progress & access your resume history</p>
                              <p className="text-sm text-slate-600">Sign in to view past analyses and download anytime</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white hover:bg-slate-50 border-slate-300 rounded-full whitespace-nowrap"
                              onClick={handleQuickGoogleSignIn}
                              data-testid="analysis-google-signin"
                            >
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                              Sign in with Google
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quick Fix CTA - Apply AI fixes to original resume */}
                    <Card className="border-2 border-primary/20 shadow-xl">
                      <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <Zap size={32} className="text-green-600" />
                          </div>
                          <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-bold mb-1">Apply AI Fixes to Your Resume</h3>
                            <p className="text-muted-foreground text-sm">One click to fix all issues — improves wording, adds missing keywords, and strengthens bullet points while keeping your original layout.</p>
                          </div>
                          <Button onClick={handleQuickFix} disabled={quickFixing} size="lg" className="rounded-full px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg flex-shrink-0" data-testid="quick-fix-btn">
                            {quickFixing ? <><Loader2 className="animate-spin mr-2" size={18} />Fixing...</> : <><Zap size={18} className="mr-2" />Fix My Resume</>}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Divider */}
                    <div className="relative my-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-muted-foreground font-medium">or choose a different template</span></div></div>

                    {/* Template selection - for users who want a different style */}
                    <Card className="border-0 shadow-md">
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-4 text-center">If your resume isn't ATS-friendly, pick one of our optimized templates below:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                          {templates.map(t => {
                            const isSelected = selectedTemplate === t.template_id;
                            const accentColor = t.style?.accent || t.style?.color || "#1a1a2e";
                            return (
                              <div key={t.template_id} onClick={() => setSelectedTemplate(isSelected ? null : t.template_id)} data-testid={`template-card-${t.template_id}`}
                                className={`relative cursor-pointer rounded-xl border-2 p-3 transition-all hover:shadow-md ${isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}>
                                {isSelected && <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"><CheckCircle size={12} className="text-white" /></div>}
                                <div className="bg-white border rounded-lg p-2 mb-2 h-20 overflow-hidden relative" style={{ borderTopColor: accentColor, borderTopWidth: "3px" }}>
                                  <div className="space-y-1"><div className="h-1.5 w-12 bg-slate-800 rounded-full" /><div className="h-1 w-8 rounded-full" style={{ backgroundColor: accentColor }} /><div className="h-0.5 w-full bg-slate-100 rounded-full mt-1" /><div className="h-0.5 w-4/5 bg-slate-100 rounded-full" /></div>
                                </div>
                                <p className="font-semibold text-xs">{t.name}</p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-center">
                          <Button onClick={() => handleImprove(true)} disabled={!selectedTemplate || improving} variant="outline" className="rounded-full px-8" data-testid="optimize-btn">
                            <Sparkles size={16} className="mr-2" /> {improving ? "Generating..." : "Use Selected Template"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* STEP 3: Optimizing */}
            {step === 3 && !improved && (
              <motion.div key="optimizing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-center py-20">
                  <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={40} />
                  <p className="text-lg font-medium">Generating your improved resume...</p>
                  <p className="text-muted-foreground">AI is rewriting with ATS optimization</p>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Results */}
            {(step === 4 || (step === 3 && improved)) && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {paymentLoading ? (
                  <div className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={40} />
                    <p className="text-lg font-medium">Verifying your payment...</p>
                    <p className="text-muted-foreground">Loading your resume. This takes a few seconds.</p>
                  </div>
                ) : (
                <Tabs defaultValue="resume" className="space-y-6">
                  <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                    <TabsTrigger value="resume" className="flex items-center gap-2"><FileText size={16} /> Improved Resume</TabsTrigger>
                    <TabsTrigger value="linkedin" className="flex items-center gap-2"><Linkedin size={16} /> LinkedIn</TabsTrigger>
                  </TabsList>

                  <TabsContent value="resume">
                    {improved ? (
                      improved.is_preview ? (
                        /* PREVIEW MODE: Show blurred content with paywall */
                        <div className="space-y-4" data-testid="resume-preview-paywall">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <h3 className="text-xl font-bold">AI-Improved Resume Preview</h3>
                          </div>
                          <div className="relative">
                            <Card className="border-0 shadow-lg overflow-hidden"><CardContent className="p-0">
                              <div className="select-none pointer-events-none">
                                <ResumePreview text={editedText} templateId={activeVisualTemplate} fontSize={fontSize} />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-white via-white/95 to-transparent" />
                            </CardContent></Card>
                            <div className="absolute bottom-0 left-0 right-0 pb-8 pt-16 flex flex-col items-center bg-gradient-to-t from-white to-transparent">
                              <Card className="border-2 border-primary/20 shadow-2xl max-w-md w-full">
                                <CardContent className="p-8 text-center">
                                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <Lock size={24} className="text-primary" />
                                  </div>
                                  <h3 className="text-xl font-bold mb-2">Unlock Your Full Resume</h3>
                                  <p className="text-muted-foreground text-sm mb-1">Get the complete AI-improved resume, edit freely, and download as a professional PDF.</p>
                                  <p className="text-xs text-muted-foreground mb-5">One-time payment per resume. Instant access.</p>
                                  <Button onClick={handleCheckout} size="lg" className="rounded-full px-10 shadow-lg" data-testid="preview-pay-btn">
                                    <Lock size={16} className="mr-2" /> Pay {displayPrice()} to Unlock
                                  </Button>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>
                      ) : (
                      /* FULL ACCESS MODE: Editing, templates, download */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <h3 className="text-xl font-bold">Your Improved Resume</h3>
                          <div className="flex gap-2 flex-wrap items-center">
                            {editorMode === "preview" && (
                              <div className="flex items-center border rounded-full overflow-hidden" data-testid="font-size-control">
                                <button className="px-2 py-1 text-xs hover:bg-slate-100" onClick={() => setFontSize(f => Math.max(10, f - 1))} data-testid="font-decrease">A-</button>
                                <span className="px-2 py-1 text-xs border-x bg-slate-50 min-w-[32px] text-center">{fontSize}</span>
                                <button className="px-2 py-1 text-xs hover:bg-slate-100" onClick={() => setFontSize(f => Math.min(18, f + 1))} data-testid="font-increase">A+</button>
                              </div>
                            )}
                            
                            {/* Editor Mode Toggle */}
                            <div className="flex items-center border rounded-full overflow-hidden" data-testid="editor-mode-toggle">
                              <button 
                                onClick={() => { setEditorMode("preview"); setIsEditing(false); }}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors ${editorMode === "preview" ? "bg-primary text-white" : "hover:bg-slate-100"}`}
                                data-testid="mode-preview"
                              >
                                Preview
                              </button>
                              <button 
                                onClick={() => { setEditorMode("text"); setIsEditing(true); }}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${editorMode === "text" ? "bg-primary text-white" : "hover:bg-slate-100"}`}
                                data-testid="mode-text"
                              >
                                <Type size={12} /> Text
                              </button>
                              <button 
                                onClick={() => { setEditorMode("sections"); setIsEditing(true); }}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${editorMode === "sections" ? "bg-primary text-white" : "hover:bg-slate-100"}`}
                                data-testid="mode-sections"
                              >
                                <Layers size={12} /> Sections
                              </button>
                            </div>

                            {editorMode !== "preview" && originalImprovedText && editedText !== originalImprovedText && (
                              <Button variant="ghost" size="sm" className="rounded-full text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={handleResetResume} data-testid="reset-resume-btn">
                                <RotateCcw size={14} className="mr-1" /> Reset
                              </Button>
                            )}
                            {hasDownloadAccess ? (
                              <Button onClick={handleDownloadPDF} className="rounded-full" data-testid="download-pdf-btn"><Download size={18} className="mr-2" /> Download PDF</Button>
                            ) : (
                              <Button onClick={handleCheckout} className="rounded-full bg-primary" data-testid="pay-download-btn"><Lock size={16} className="mr-2" /> Pay {displayPrice()} to Download</Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Template selector - only show in preview mode */}
                        {editorMode === "preview" && (
                          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                            {VISUAL_TEMPLATES.map(vt => (
                              <button key={vt.id} onClick={() => setActiveVisualTemplate(vt.id)} data-testid={`visual-tpl-${vt.id}`}
                                className={`flex-shrink-0 rounded-lg border-2 p-2 transition-all text-left w-32 ${activeVisualTemplate === vt.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-slate-200 hover:border-slate-300"}`}>
                                <div className="h-16 rounded border bg-white mb-1.5 overflow-hidden p-1.5 relative" style={{ borderTopWidth: "2px", borderTopColor: vt.preview.accent }}>
                                  <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: vt.preview.accent }} />
                                  <div className="h-[2px] w-full bg-slate-100 rounded-full mt-1.5" />
                                  <div className="h-[2px] w-4/5 bg-slate-100 rounded-full mt-1" />
                                </div>
                                <p className="text-xs font-semibold truncate">{vt.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{vt.desc}</p>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Editor Content Area */}
                        <Card className="border-0 shadow-lg overflow-hidden">
                          <CardContent className="p-0">
                            {editorMode === "sections" ? (
                              <div className="p-4 bg-slate-50 min-h-[500px]">
                                <SectionEditor value={editedText} onChange={setEditedText} />
                              </div>
                            ) : (
                              <ResumePreview text={editedText} templateId={activeVisualTemplate} editing={editorMode === "text"} onTextChange={setEditedText} fontSize={fontSize} />
                            )}
                          </CardContent>
                        </Card>
                        
                        {!hasDownloadAccess && <p className="text-center text-sm text-muted-foreground">Edit your resume freely. Switch templates instantly. Pay only to download the final version.</p>}
                      </div>
                      )
                    ) : (
                      <Card className="max-w-2xl mx-auto"><CardContent className="p-8 text-center">
                        <Sparkles size={40} className="text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Generate ATS-Optimized Resume</h3>
                        <p className="text-muted-foreground mb-6">AI will rewrite your resume with impact-driven language and ATS-friendly keywords.</p>
                        <Button onClick={() => handleImprove(true)} disabled={improving} className="rounded-full px-8" data-testid="improve-resume-btn">
                          {improving ? <><Loader2 className="animate-spin mr-2" size={18} />Generating...</> : <><Sparkles size={18} className="mr-2" />Generate Improved Resume</>}
                        </Button>
                      </CardContent></Card>
                    )}
                  </TabsContent>

                  <TabsContent value="linkedin">
                    {!linkedinResult ? (
                      <Card className="max-w-2xl mx-auto"><CardContent className="p-8 space-y-4">
                        <div className="text-center mb-4">
                          <Linkedin size={40} className="text-[#0077B5] mx-auto mb-2" />
                          <h3 className="text-xl font-bold">Optimize Your LinkedIn</h3>
                          <p className="text-muted-foreground text-sm">Paste your LinkedIn URL to auto-capture, or enter details manually</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                          <Label className="text-blue-800 font-medium flex items-center gap-1"><Linkedin size={14} /> LinkedIn Profile URL</Label>
                          <div className="flex gap-2">
                            <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/your-profile" className="flex-1" data-testid="linkedin-url-input" />
                            <Button onClick={handleLinkedinScrape} disabled={linkedinScraping} variant="outline" size="sm" data-testid="linkedin-scrape-btn">
                              {linkedinScraping ? <Loader2 className="animate-spin" size={16} /> : "Capture"}
                            </Button>
                          </div>
                          <p className="text-xs text-blue-600">We'll extract your headline, about, and experience automatically</p>
                        </div>
                        <div className="relative my-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-muted-foreground">or enter manually</span></div></div>
                        <div className="space-y-2"><Label>Current Headline</Label><Input value={linkedinForm.headline} onChange={(e) => setLinkedinForm(p => ({ ...p, headline: e.target.value }))} placeholder="e.g., Software Engineer at Google" data-testid="linkedin-headline" /></div>
                        <div className="space-y-2"><Label>About Section</Label><Textarea value={linkedinForm.about} onChange={(e) => setLinkedinForm(p => ({ ...p, about: e.target.value }))} rows={4} placeholder="Paste your About section..." data-testid="linkedin-about" /></div>
                        <div className="space-y-2"><Label>Experience</Label><Textarea value={linkedinForm.experience} onChange={(e) => setLinkedinForm(p => ({ ...p, experience: e.target.value }))} rows={4} placeholder="Paste recent experience..." data-testid="linkedin-experience" /></div>
                        <Button onClick={handleLinkedIn} disabled={linkedinLoading} className="w-full rounded-full" data-testid="linkedin-optimize-btn">
                          {linkedinLoading ? <><Loader2 className="animate-spin mr-2" size={18} />Optimizing...</> : <><Linkedin size={18} className="mr-2" />Optimize LinkedIn</>}
                        </Button>
                      </CardContent></Card>
                    ) : (
                      <div className="space-y-6">
                        {/* PAID: Full results with usage guide */}
                        {hasDownloadAccess ? (
                          <>
                            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0"><CardContent className="p-6">
                              <div className="flex items-center gap-3">
                                <CheckCircle size={28} />
                                <div>
                                  <p className="font-bold text-lg">Your LinkedIn Optimization is Ready</p>
                                  <p className="text-green-100 text-sm">Copy and paste these directly into your LinkedIn profile sections.</p>
                                </div>
                              </div>
                            </CardContent></Card>

                            <Card><CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2"><Star size={20} className="text-primary" /> Headline Variations</h3>
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">Copy your favourite to LinkedIn headline</span>
                              </div>
                              <div className="space-y-3">{linkedinResult.headlines?.map((h, i) => (
                                <div key={i} className="p-3 bg-primary/5 rounded-lg text-sm font-medium flex items-center justify-between gap-3 group">
                                  <span>{h}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(h); toast.success("Copied!"); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary hover:underline flex-shrink-0" data-testid={`copy-headline-${i}`}>Copy</button>
                                </div>
                              ))}</div>
                            </CardContent></Card>

                            <Card><CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg">Optimized About Section</h3>
                                <button onClick={() => { navigator.clipboard.writeText(linkedinResult.about); toast.success("About section copied!"); }} className="text-xs text-primary hover:underline font-medium" data-testid="copy-about">Copy to clipboard</button>
                              </div>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border">{linkedinResult.about}</p>
                              <p className="text-xs text-muted-foreground mt-2">Paste this into your LinkedIn "About" section</p>
                            </CardContent></Card>

                            <Card><CardContent className="p-6">
                              <h3 className="font-bold text-lg mb-2">Keywords to Add</h3>
                              <p className="text-xs text-muted-foreground mb-3">Add these to your headline, about, and experience for better search visibility</p>
                              <div className="flex flex-wrap gap-2">{linkedinResult.keywords?.map((k, i) => <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => { navigator.clipboard.writeText(k); toast.success(`"${k}" copied!`); }}>{k}</span>)}</div>
                            </CardContent></Card>

                            {linkedinResult.experience_bullets?.length > 0 && (
                              <Card><CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-2">Experience Bullet Points</h3>
                                <p className="text-xs text-muted-foreground mb-3">Add these under your latest role in the Experience section</p>
                                <ul className="space-y-2">{linkedinResult.experience_bullets.map((b, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />{b}</li>)}</ul>
                              </CardContent></Card>
                            )}

                            {linkedinResult.post_ideas?.length > 0 && (
                              <Card><CardContent className="p-6">
                                <h3 className="font-bold text-lg mb-2">Engagement Post Ideas</h3>
                                <p className="text-xs text-muted-foreground mb-3">Post these on LinkedIn to boost your visibility and engagement</p>
                                <ul className="space-y-2">{linkedinResult.post_ideas.map((p, i) => <li key={i} className="flex items-start gap-2 text-sm"><Sparkles size={14} className="text-primary mt-0.5" />{p}</li>)}</ul>
                              </CardContent></Card>
                            )}
                          </>
                        ) : (
                          <>
                            {/* UNPAID: Show teaser with server-side partial data */}
                            <Card><CardContent className="p-6">
                              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Star size={20} className="text-primary" /> Headline Variations</h3>
                              <div className="space-y-3">
                                {linkedinResult.headlines?.[0] && (
                                  <div className="p-3 bg-primary/5 rounded-lg text-sm font-medium">{linkedinResult.headlines[0]}</div>
                                )}
                                <div className="relative select-none pointer-events-none">
                                  <div className="space-y-3 blur-[6px] opacity-60">
                                    <div className="p-3 bg-primary/5 rounded-lg text-sm font-medium">Senior Full-Stack Developer | Building Scalable Solutions</div>
                                    <div className="p-3 bg-primary/5 rounded-lg text-sm font-medium">Tech Lead & Problem Solver | Driving Innovation</div>
                                  </div>
                                </div>
                              </div>
                            </CardContent></Card>

                            <Card><CardContent className="p-6">
                              <h3 className="font-bold text-lg mb-4">Optimized About Section</h3>
                              <p className="text-sm leading-relaxed mb-2">{linkedinResult.about}</p>
                              <div className="relative select-none pointer-events-none">
                                <p className="text-sm whitespace-pre-wrap leading-relaxed blur-[6px] opacity-50">
                                  With extensive experience in building enterprise applications and leading cross-functional teams, I bring a unique blend of technical expertise and strategic thinking. My approach focuses on delivering measurable results through innovative solutions and collaborative leadership.
                                </p>
                              </div>
                            </CardContent></Card>

                            <Card><CardContent className="p-6">
                              <h3 className="font-bold text-lg mb-4">Keywords to Add</h3>
                              <div className="relative">
                                <div className="flex flex-wrap gap-2">
                                  {linkedinResult.keywords?.map((k, i) => <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">{k}</span>)}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2 blur-[6px] opacity-50 select-none pointer-events-none">
                                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">Strategic Planning</span>
                                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">Cloud Architecture</span>
                                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">Team Leadership</span>
                                </div>
                              </div>
                            </CardContent></Card>

                            <Card><CardContent className="p-6 relative">
                              <h3 className="font-bold text-lg mb-4">Experience Bullets & Post Ideas</h3>
                              <div className="blur-[6px] opacity-50 select-none pointer-events-none">
                                <ul className="space-y-2">
                                  <li className="flex items-start gap-2 text-sm"><Sparkles size={14} className="text-primary mt-0.5" />Led migration of monolithic architecture to microservices</li>
                                  <li className="flex items-start gap-2 text-sm"><Sparkles size={14} className="text-primary mt-0.5" />Improved system performance by 40% through optimization</li>
                                </ul>
                              </div>
                            </CardContent></Card>

                            {/* Sticky paywall CTA */}
                            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-white shadow-xl sticky bottom-4 z-10">
                              <CardContent className="p-8 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                  <Lock size={24} className="text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Unlock Your Full LinkedIn Optimization</h3>
                                <p className="text-muted-foreground text-sm mb-1">Get all headline variations, complete about section, keywords, experience bullets, and post ideas.</p>
                                <p className="text-xs text-muted-foreground mb-5">One-time payment per resume. Copy-paste ready. Instant access.</p>
                                <Button onClick={handleCheckout} size="lg" className="rounded-full px-10 shadow-lg" data-testid="linkedin-pay-btn">
                                  <Lock size={16} className="mr-2" /> Pay {displayPrice()} to Unlock
                                </Button>
                              </CardContent>
                            </Card>
                          </>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Email prompt modal for checkout */}
      <AnimatePresence>
        {showEmailPrompt && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEmailPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="bg-primary/5 p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Zap size={22} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold" data-testid="email-prompt-title">Almost there!</h3>
                <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a payment receipt</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="checkout-email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    placeholder="you@example.com"
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitEmailAndCheckout()}
                    className="mt-1.5"
                    data-testid="checkout-email-input"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowEmailPrompt(false)}>Cancel</Button>
                  <Button className="flex-1 rounded-full" onClick={submitEmailAndCheckout} data-testid="proceed-to-payment-btn">
                    <Lock size={14} className="mr-1.5" /> Proceed to Payment
                  </Button>
                </div>
                <p className="text-[11px] text-center text-muted-foreground">You'll receive a receipt after successful payment</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
};

export default ResumeOptimizerPage;

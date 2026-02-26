import { useState, useEffect, useCallback } from "react";
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
  Loader2, Lock, Star, Sparkles, Target, ArrowRight, Linkedin,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Score ring component
const ScoreRing = ({ score, label, size = 100 }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "text-green-500" : score >= 40 ? "text-yellow-500" : "text-red-500";
  const strokeColor = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <motion.circle cx={size / 2} cy={size / 2} r={radius} stroke={strokeColor} strokeWidth="6" fill="none"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};

// Resume preview renderer with multiple visual templates + inline editing
const VISUAL_TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    desc: "Traditional serif layout with clean lines",
    preview: { bg: "#fff", accent: "#1a1a2e", font: "serif", layout: "centered" },
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Clean sans-serif with color accents",
    preview: { bg: "#fff", accent: "#2563eb", font: "sans", layout: "left" },
  },
  {
    id: "executive",
    name: "Executive",
    desc: "Dark header bar, premium two-tone feel",
    preview: { bg: "#1e293b", accent: "#f59e0b", font: "sans", layout: "dark-header" },
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Ultra-clean whitespace-driven design",
    preview: { bg: "#fff", accent: "#6b7280", font: "sans", layout: "minimal" },
  },
  {
    id: "bold",
    name: "Bold",
    desc: "Large headers with strong color blocks",
    preview: { bg: "#fff", accent: "#dc2626", font: "sans", layout: "bold" },
  },
];

function parseSections(text) {
  const lines = (text || "").split("\n");
  const sections = [];
  let currentSection = null;
  let nameLines = [];
  let foundFirstSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const isHeader = /^[A-Z][A-Z\s\/&,]{3,}$/.test(trimmed) && !trimmed.includes("@") && !trimmed.includes("|") && !trimmed.includes(".com") && !trimmed.match(/\+?\d[\d\s\-()]{6,}/);
    if (isHeader) {
      foundFirstSection = true;
      if (currentSection) sections.push(currentSection);
      currentSection = { title: trimmed, lines: [] };
    } else if (!foundFirstSection) {
      nameLines.push(trimmed);
    } else if (currentSection) {
      currentSection.lines.push(trimmed);
    }
  }
  if (currentSection) sections.push(currentSection);
  return { nameLines, sections };
}

const ResumePreview = ({ text, templateId, editing, onTextChange }) => {
  if (!text) return null;
  const tpl = templateId || "classic";
  const { nameLines, sections } = parseSections(text);

  const renderBullet = (line, key, bulletClass, textClass) => {
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("\u2022 ")) {
      const content = line.replace(/^[-*\u2022]\s+/, "");
      return <div key={key} className={`flex gap-2 ${textClass} pl-1 py-[2px]`}><span className={`${bulletClass} mt-[5px] flex-shrink-0 w-1.5 h-1.5 rounded-full`} /><span>{content}</span></div>;
    }
    return <div key={key} className={textClass}>{line}</div>;
  };

  if (editing) {
    return (
      <div className="w-full" data-testid="resume-editor">
        <textarea
          className="w-full min-h-[500px] p-6 font-mono text-sm leading-relaxed border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          data-testid="resume-edit-textarea"
        />
      </div>
    );
  }

  // CLASSIC TEMPLATE
  if (tpl === "classic") {
    return (
      <div className="bg-white p-8 md:p-12 max-w-[780px] mx-auto font-serif" data-testid="resume-preview" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {nameLines[0] && <div className="text-center text-2xl font-bold tracking-wide text-slate-900 mb-1">{nameLines[0]}</div>}
        {nameLines.slice(1).map((l, i) => <div key={i} className="text-center text-xs text-slate-500 tracking-wide">{l}</div>)}
        {nameLines.length > 0 && <div className="border-b-2 border-slate-800 mt-4 mb-2" />}
        {sections.map((s, si) => (
          <div key={si} className="mb-4">
            <div className="text-[11px] font-bold tracking-[3px] uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2">{s.title}</div>
            {s.lines.map((l, li) => renderBullet(l, li, "bg-slate-600", "text-[13px] leading-relaxed text-slate-700"))}
          </div>
        ))}
      </div>
    );
  }

  // MODERN TEMPLATE
  if (tpl === "modern") {
    return (
      <div className="bg-white p-8 md:p-12 max-w-[780px] mx-auto" data-testid="resume-preview" style={{ fontFamily: "'Segoe UI', Calibri, Arial, sans-serif" }}>
        {nameLines[0] && <div className="text-3xl font-extrabold text-blue-600 mb-0.5">{nameLines[0]}</div>}
        {nameLines.slice(1).map((l, i) => <div key={i} className="text-sm text-slate-500">{l}</div>)}
        {nameLines.length > 0 && <div className="h-1 bg-blue-600 mt-3 mb-4 w-20 rounded-full" />}
        {sections.map((s, si) => (
          <div key={si} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-3 bg-blue-600 rounded-full" />
              <div className="text-xs font-bold tracking-[2px] uppercase text-blue-600">{s.title}</div>
            </div>
            {s.lines.map((l, li) => renderBullet(l, li, "bg-blue-500", "text-[13px] leading-relaxed text-slate-700"))}
          </div>
        ))}
      </div>
    );
  }

  // EXECUTIVE TEMPLATE
  if (tpl === "executive") {
    return (
      <div className="max-w-[780px] mx-auto overflow-hidden" data-testid="resume-preview" style={{ fontFamily: "'Segoe UI', Calibri, sans-serif" }}>
        <div className="bg-slate-800 text-white px-8 md:px-12 py-8">
          {nameLines[0] && <div className="text-3xl font-bold tracking-wide">{nameLines[0]}</div>}
          {nameLines.slice(1).map((l, i) => <div key={i} className="text-sm text-slate-300 mt-1">{l}</div>)}
        </div>
        <div className="bg-white px-8 md:px-12 py-6">
          {sections.map((s, si) => (
            <div key={si} className="mb-5">
              <div className="text-xs font-bold tracking-[3px] uppercase text-amber-600 border-b-2 border-amber-500/30 pb-1 mb-2">{s.title}</div>
              {s.lines.map((l, li) => renderBullet(l, li, "bg-amber-500", "text-[13px] leading-relaxed text-slate-700"))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // MINIMAL TEMPLATE
  if (tpl === "minimal") {
    return (
      <div className="bg-white p-8 md:p-14 max-w-[780px] mx-auto" data-testid="resume-preview" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        {nameLines[0] && <div className="text-xl font-light tracking-[4px] uppercase text-slate-900 mb-1">{nameLines[0]}</div>}
        {nameLines.slice(1).map((l, i) => <div key={i} className="text-xs text-slate-400 tracking-wide">{l}</div>)}
        {nameLines.length > 0 && <div className="border-b border-slate-200 mt-6 mb-6" />}
        {sections.map((s, si) => (
          <div key={si} className="mb-6">
            <div className="text-[10px] font-medium tracking-[4px] uppercase text-slate-400 mb-3">{s.title}</div>
            {s.lines.map((l, li) => renderBullet(l, li, "bg-slate-300", "text-[13px] leading-[1.8] text-slate-600 font-light"))}
          </div>
        ))}
      </div>
    );
  }

  // BOLD TEMPLATE
  return (
    <div className="bg-white p-8 md:p-12 max-w-[780px] mx-auto" data-testid="resume-preview" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {nameLines[0] && <div className="text-4xl font-black text-slate-900 mb-1">{nameLines[0]}</div>}
      {nameLines.slice(1).map((l, i) => <div key={i} className="text-sm text-slate-500 font-medium">{l}</div>)}
      {nameLines.length > 0 && <div className="h-1.5 bg-red-600 mt-3 mb-5 w-full rounded-full" />}
      {sections.map((s, si) => (
        <div key={si} className="mb-5">
          <div className="bg-red-600 text-white text-[11px] font-bold tracking-[2px] uppercase px-3 py-1.5 rounded mb-2 inline-block">{s.title}</div>
          <div className="mt-1">
            {s.lines.map((l, li) => renderBullet(l, li, "bg-red-500", "text-[13px] leading-relaxed text-slate-700"))}
          </div>
        </div>
      ))}
    </div>
  );
};

const STEPS = [
  { id: 1, label: "Upload", icon: Upload },
  { id: 2, label: "Analysis", icon: FileText },
  { id: 3, label: "Optimize", icon: Sparkles },
  { id: 4, label: "Download", icon: Download },
];

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
  const [editedText, setEditedText] = useState("");

  const [linkedinForm, setLinkedinForm] = useState({ headline: "", about: "", experience: "" });

  // Load pricing and templates
  useEffect(() => {
    fetch(`${API_URL}/api/resume/pricing`).then((r) => r.json()).then(setPricing).catch(() => {});
    fetch(`${API_URL}/api/resume/templates`).then((r) => r.json()).then(setTemplates).catch(() => {});
  }, []);

  // Handle return from Stripe (pay-to-download)
  useEffect(() => {
    const sid = searchParams.get("session_id");
    const rid = searchParams.get("resume_id");
    if (sid && rid) {
      setResumeId(rid);
      setStep(4);
      fetch(`${API_URL}/api/resume/verify-payment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, resume_id: rid }),
      }).then((r) => r.json()).then((d) => {
        if (d.paid) setHasDownloadAccess(true);
      }).catch(() => {});
      // Load existing analysis and improvement
      fetch(`${API_URL}/api/resume/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: rid }),
      }).then((r) => r.json()).then(setAnalysis).catch(() => {});
      fetch(`${API_URL}/api/resume/improve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: rid }),
      }).then((r) => r.json()).then(setImproved).catch(() => {});
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
        // Auto-analyze
        setStep(2);
        setAnalyzing(true);
        const analysisRes = await fetch(`${API_URL}/api/resume/analyze`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resume_id: data.resume_id }),
        });
        if (analysisRes.ok) setAnalysis(await analysisRes.json());
      } else {
        const err = await res.json();
        alert(err.detail || "Upload failed");
      }
    } catch { alert("Upload failed. Please try again."); }
    finally { setUploading(false); setAnalyzing(false); }
  };

  const handleCheckout = async () => {
    try {
      const res = await fetch(`${API_URL}/api/resume/checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: resumeId, origin_url: window.location.origin }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkout_url;
      }
    } catch { alert("Checkout failed"); }
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
        setStep(4);
      }
    } catch { alert("Improvement failed"); }
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
    } catch { alert("LinkedIn optimization failed"); }
    finally { setLinkedinLoading(false); }
  };

  const handleDownloadPDF = () => {
    if (!improved?.improved_text) return;
    if (!hasDownloadAccess) {
      handleCheckout();
      return;
    }
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Resume</title><style>
      body{font-family:'Segoe UI',Calibri,Arial,sans-serif;max-width:780px;margin:30px auto;padding:30px 40px;line-height:1.5;color:#222;font-size:11pt}
      .section-head{font-size:11pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1a1a2e;border-bottom:1.5px solid #1a1a2e;padding-bottom:3px;margin:18px 0 8px}
      .name{font-size:18pt;font-weight:700;text-align:center;margin-bottom:2px}
      .contact{text-align:center;color:#555;font-size:9.5pt;margin-bottom:14px}
      ul{padding-left:18px;margin:4px 0}li{margin-bottom:3px}
      @media print{body{margin:0;padding:20px 30px}}
    </style></head><body>`);
    const text = improved.improved_text;
    const lines = text.split("\n");
    let html = "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { html += "<br/>"; continue; }
      // Detect ALL CAPS section headers (3+ uppercase words)
      if (/^[A-Z][A-Z\s\/&,]{4,}$/.test(trimmed) && !trimmed.includes("@") && !trimmed.includes("|")) {
        html += '<div class="section-head">' + trimmed + "</div>";
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        html += "<li>" + trimmed.slice(2) + "</li>";
      } else {
        html += "<div>" + trimmed + "</div>";
      }
    }
    win.document.write(html);
    win.document.write("</body></html>");
    win.document.close();
    win.print();
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-white to-white overflow-hidden">
          <div className="absolute inset-0 gradient-violet-subtle" />
          <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6" data-testid="resume-badge">
              AI-Powered Resume Tool
            </span>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4" data-testid="resume-title">
              {pricing?.product_name || "DioAI Resume & LinkedIn Optimizer"}
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Get a free AI analysis of your resume. Unlock pro features to optimize for ATS, rewrite with impact, and supercharge your LinkedIn profile.
            </p>

            {/* Step Progress */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const active = step >= s.id;
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      active ? "bg-primary text-white" : "bg-slate-100 text-muted-foreground"
                    }`}>
                      <Icon size={16} />
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && <ArrowRight size={16} className="text-muted-foreground" />}
                  </div>
                );
              })}
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
                        <span>{uploading ? <><Loader2 className="animate-spin mr-2" size={18} />Uploading...</> : "Choose File"}</span>
                      </Button>
                    </label>
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
                    {/* Scores */}
                    <div className="flex justify-center gap-12">
                      <ScoreRing score={analysis.overall_score} label="Overall Score" size={120} />
                      <ScoreRing score={analysis.ats_score} label="ATS Score" size={120} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><CheckCircle size={20} className="text-green-500" /> Strengths</h3>
                          <ul className="space-y-2">
                            {analysis.strengths?.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />{s}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Weaknesses */}
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><XCircle size={20} className="text-red-500" /> Weaknesses</h3>
                          <ul className="space-y-2">
                            {analysis.weaknesses?.map((w, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm"><XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />{w}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Missing Keywords */}
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Target size={20} className="text-primary" /> Missing Keywords</h3>
                          <div className="flex flex-wrap gap-2">
                            {analysis.missing_keywords?.map((k, i) => (
                              <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">{k}</span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Suggestions */}
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Sparkles size={20} className="text-primary" /> Suggestions</h3>
                          <ul className="space-y-2">
                            {analysis.suggestions?.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />{s}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {/* CTA to optimize (free) */}
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-8">
                        <div className="text-center mb-6">
                          <Sparkles size={32} className="mx-auto mb-3 text-primary" />
                          <h3 className="text-2xl font-bold mb-2">Choose a Template & Optimize</h3>
                          <p className="text-muted-foreground">Select how you'd like your resume formatted, then let AI rewrite it for maximum impact.</p>
                        </div>

                        {/* Visual Template Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                          {templates.map(t => {
                            const isSelected = selectedTemplate === t.template_id;
                            const accentColor = t.style?.accent || t.style?.color || "#1a1a2e";
                            return (
                              <div
                                key={t.template_id}
                                onClick={() => setSelectedTemplate(isSelected ? null : t.template_id)}
                                data-testid={`template-card-${t.template_id}`}
                                className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                                  isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <CheckCircle size={14} className="text-white" />
                                  </div>
                                )}
                                {/* Mini template preview */}
                                <div className="bg-white border rounded-lg p-3 mb-3 h-28 overflow-hidden relative" style={{ borderTopColor: accentColor, borderTopWidth: "3px" }}>
                                  <div className="space-y-1.5">
                                    {t.preview?.header_style === "centered" ? (
                                      <div className="text-center">
                                        <div className="h-2 w-16 bg-slate-800 rounded-full mx-auto" />
                                        <div className="h-1 w-24 bg-slate-300 rounded-full mx-auto mt-1" />
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="h-2 w-20 bg-slate-800 rounded-full" />
                                        <div className="h-1 w-28 bg-slate-300 rounded-full mt-1" />
                                      </div>
                                    )}
                                    {t.preview?.section_dividers && <div className="border-b mt-1.5" style={{ borderColor: accentColor + "40" }} />}
                                    <div className="h-1.5 w-12 rounded-full mt-1" style={{ backgroundColor: accentColor }} />
                                    {t.style?.layout === "skills-first" ? (
                                      <>
                                        <div className="flex gap-1 flex-wrap">
                                          {[16, 14, 12, 18, 10].map((w, i) => (
                                            <div key={i} className="h-1 rounded-full bg-slate-200" style={{ width: w }} />
                                          ))}
                                        </div>
                                        <div className="h-1.5 w-14 rounded-full mt-1" style={{ backgroundColor: accentColor }} />
                                      </>
                                    ) : null}
                                    <div className="space-y-0.5">
                                      <div className="h-1 w-full bg-slate-100 rounded-full" />
                                      <div className="h-1 w-5/6 bg-slate-100 rounded-full" />
                                      <div className="h-1 w-4/6 bg-slate-100 rounded-full" />
                                    </div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{t.name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                                </div>
                                <div className="flex gap-1 mt-2">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{t.style?.layout?.replace("-", " ")}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{t.style?.font}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-center">
                          <Button onClick={() => handleImprove(false)} size="lg" className="rounded-full px-10" data-testid="optimize-btn">
                            <Sparkles size={18} className="mr-2" /> {selectedTemplate ? "Optimize with Selected Template" : "Optimize My Resume"}
                          </Button>
                          {!selectedTemplate && <p className="text-xs text-muted-foreground mt-2">No template selected — AI will use the best format for your resume</p>}
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

            {/* STEP 4: Results (pay to download/copy) */}
            {(step === 4 || (step === 3 && improved)) && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Tabs defaultValue="resume" className="space-y-6">
                  <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                    <TabsTrigger value="resume" className="flex items-center gap-2"><FileText size={16} /> Improved Resume</TabsTrigger>
                    <TabsTrigger value="linkedin" className="flex items-center gap-2"><Linkedin size={16} /> LinkedIn</TabsTrigger>
                  </TabsList>

                  {/* Resume Improvement */}
                  <TabsContent value="resume">
                    {improved ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <h3 className="text-xl font-bold">Your Improved Resume</h3>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => { setImproved(null); setStep(2); }}
                              data-testid="change-template-btn"
                            >
                              <Sparkles size={14} className="mr-1" /> Change Template & Regenerate
                            </Button>
                            {hasDownloadAccess ? (
                              <Button onClick={handleDownloadPDF} className="rounded-full" data-testid="download-pdf-btn">
                                <Download size={18} className="mr-2" /> Download / Print
                              </Button>
                            ) : (
                              <Button onClick={handleCheckout} className="rounded-full bg-primary" data-testid="pay-download-btn">
                                <Lock size={16} className="mr-2" /> Pay {pricing?.currency || "EUR"} {pricing?.price || "19.99"} to Download
                              </Button>
                            )}
                          </div>
                        </div>
                        <Card className="border-0 shadow-lg">
                          <CardContent className="p-0">
                            <ResumePreview text={improved.improved_text} />
                          </CardContent>
                        </Card>
                        {!hasDownloadAccess && (
                          <p className="text-center text-sm text-muted-foreground">
                            You can view and edit your improved resume above. Pay to download, copy, or print the final version.
                          </p>
                        )}
                      </div>
                    ) : (
                      <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8 text-center">
                          <Sparkles size={40} className="text-primary mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Generate ATS-Optimized Resume</h3>
                          <p className="text-muted-foreground mb-6">AI will rewrite your resume with impact-driven language and ATS-friendly keywords.</p>
                          <Button onClick={handleImprove} disabled={improving} className="rounded-full px-8" data-testid="improve-resume-btn">
                            {improving ? <><Loader2 className="animate-spin mr-2" size={18} />Generating...</> : <><Sparkles size={18} className="mr-2" />Generate Improved Resume</>}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* LinkedIn Optimizer */}
                  <TabsContent value="linkedin">
                    {!linkedinResult ? (
                      <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8 space-y-4">
                          <div className="text-center mb-4">
                            <Linkedin size={40} className="text-[#0077B5] mx-auto mb-2" />
                            <h3 className="text-xl font-bold">Optimize Your LinkedIn</h3>
                            <p className="text-muted-foreground text-sm">Enter your current LinkedIn content (optional — AI can work from your resume alone)</p>
                          </div>
                          <div className="space-y-2"><Label>Current Headline</Label><Input value={linkedinForm.headline} onChange={(e) => setLinkedinForm((p) => ({ ...p, headline: e.target.value }))} placeholder="e.g., Software Engineer at Google" /></div>
                          <div className="space-y-2"><Label>About Section</Label><Textarea value={linkedinForm.about} onChange={(e) => setLinkedinForm((p) => ({ ...p, about: e.target.value }))} rows={4} placeholder="Paste your current About section..." /></div>
                          <div className="space-y-2"><Label>Experience (key roles)</Label><Textarea value={linkedinForm.experience} onChange={(e) => setLinkedinForm((p) => ({ ...p, experience: e.target.value }))} rows={4} placeholder="Paste recent experience..." /></div>
                          <Button onClick={handleLinkedIn} disabled={linkedinLoading} className="w-full rounded-full" data-testid="linkedin-optimize-btn">
                            {linkedinLoading ? <><Loader2 className="animate-spin mr-2" size={18} />Optimizing...</> : <><Linkedin size={18} className="mr-2" />Optimize LinkedIn</>}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-6">
                        {/* Headlines */}
                        <Card>
                          <CardContent className="p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Star size={20} className="text-primary" /> Headline Variations</h3>
                            <div className="space-y-3">
                              {linkedinResult.headlines?.map((h, i) => (
                                <div key={i} className="p-3 bg-primary/5 rounded-lg text-sm font-medium">{h}</div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        {/* About */}
                        <Card>
                          <CardContent className="p-6">
                            <h3 className="font-bold text-lg mb-4">Optimized About Section</h3>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{linkedinResult.about}</p>
                          </CardContent>
                        </Card>
                        {/* Keywords */}
                        <Card>
                          <CardContent className="p-6">
                            <h3 className="font-bold text-lg mb-4">Keywords to Add</h3>
                            <div className="flex flex-wrap gap-2">
                              {linkedinResult.keywords?.map((k, i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">{k}</span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        {/* Post Ideas */}
                        {linkedinResult.post_ideas?.length > 0 && (
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-bold text-lg mb-4">Engagement Post Ideas</h3>
                              <ul className="space-y-2">
                                {linkedinResult.post_ideas.map((p, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm"><Sparkles size={14} className="text-primary mt-0.5" />{p}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </Layout>
  );
};

export default ResumeOptimizerPage;

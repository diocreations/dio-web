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

  const handleImprove = async () => {
    setImproving(true);
    try {
      const body = { resume_id: resumeId };
      if (selectedTemplate) body.template_id = selectedTemplate;
      const res = await fetch(`${API_URL}/api/resume/improve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setImproved(await res.json());
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
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Improved Resume</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;color:#333}h2{color:#1a1a1a;border-bottom:2px solid #333;padding-bottom:4px}ul{padding-left:20px}li{margin-bottom:4px}</style></head><body>`);
    const html = improved.improved_text
      .replace(/## (.*)/g, "<h2>$1</h2>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^- (.*)/gm, "<li>$1</li>")
      .replace(/\n/g, "<br>");
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

                    {/* CTA to unlock */}
                    <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
                      <CardContent className="p-8 text-center">
                        <Lock size={32} className="mx-auto mb-4 opacity-80" />
                        <h3 className="text-2xl font-bold mb-2">Unlock Pro Optimization</h3>
                        <p className="text-white/80 mb-6">Get an ATS-optimized resume rewrite + LinkedIn profile optimization</p>
                        <div className="flex items-center justify-center gap-3 mb-6">
                          {pricing?.discount_percent > 0 && (
                            <span className="text-lg line-through opacity-60">{pricing.currency} {pricing.original_price}</span>
                          )}
                          <span className="text-3xl font-bold">{pricing?.currency || "EUR"} {pricing?.price || "19.99"}</span>
                        </div>
                        <Button onClick={() => { setStep(3); handleCheckout(); }} size="lg" variant="secondary" className="rounded-full px-10" data-testid="unlock-pro-btn">
                          <Zap size={18} className="mr-2" /> Unlock Now
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* STEP 3: Payment pending */}
            {step === 3 && !isPaid && (
              <motion.div key="payment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-center py-20">
                  <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={40} />
                  <p className="text-lg font-medium">Verifying payment...</p>
                  <p className="text-muted-foreground">You'll be redirected after payment confirmation</p>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Pro Features */}
            {step === 4 && isPaid && (
              <motion.div key="pro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Tabs defaultValue="resume" className="space-y-6">
                  <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                    <TabsTrigger value="resume" className="flex items-center gap-2"><FileText size={16} /> Resume Rewrite</TabsTrigger>
                    <TabsTrigger value="linkedin" className="flex items-center gap-2"><Linkedin size={16} /> LinkedIn</TabsTrigger>
                  </TabsList>

                  {/* Resume Improvement */}
                  <TabsContent value="resume">
                    {!improved ? (
                      <Card className="max-w-2xl mx-auto">
                        <CardContent className="p-8 text-center">
                          <Sparkles size={40} className="text-primary mx-auto mb-4" />
                          <h3 className="text-xl font-bold mb-2">Generate ATS-Optimized Resume</h3>
                          <p className="text-muted-foreground mb-6">AI will rewrite your resume with impact-driven language, quantified achievements, and ATS-friendly keywords.</p>
                          <Button onClick={handleImprove} disabled={improving} className="rounded-full px-8" data-testid="improve-resume-btn">
                            {improving ? <><Loader2 className="animate-spin mr-2" size={18} />Generating...</> : <><Sparkles size={18} className="mr-2" />Generate Improved Resume</>}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">Your Improved Resume</h3>
                          <Button onClick={handleDownloadPDF} variant="outline" className="rounded-full" data-testid="download-pdf-btn">
                            <Download size={18} className="mr-2" /> Download / Print
                          </Button>
                        </div>
                        <Card>
                          <CardContent className="p-6">
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap" data-testid="improved-resume-text">
                              {improved.improved_text}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
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

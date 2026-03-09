import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  PenLine, FileText, Upload, Loader2, Copy, Check,
  Briefcase, Building2, Sparkles, Link, Globe,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CoverLetterPage = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [jobUrl, setJobUrl] = useState("");
  const [form, setForm] = useState({
    resume_text: "",
    job_description: "",
    job_title: "",
    company_name: "",
    tone: "professional",
  });
  const [resumeFile, setResumeFile] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/resume/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setResumeFile({ name: file.name, resume_id: data.resume_id });
      setForm((f) => ({ ...f, resume_text: data.text_preview }));
      toast.success("Resume uploaded!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Fetch job description from URL
  const handleFetchJobUrl = async () => {
    if (!jobUrl.trim()) {
      toast.error("Please enter a job posting URL");
      return;
    }
    
    // Basic URL validation
    try {
      new URL(jobUrl);
    } catch {
      toast.error("Please enter a valid URL (e.g., https://company.com/job/123)");
      return;
    }
    
    setFetchingUrl(true);
    try {
      const res = await fetch(`${API_URL}/api/cover-letter/fetch-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Failed to fetch job details");
      
      // Auto-fill the form with extracted data
      setForm((f) => ({
        ...f,
        job_description: data.job_description || f.job_description,
        job_title: data.job_title || f.job_title,
        company_name: data.company_name || f.company_name,
      }));
      
      toast.success("Job details extracted successfully!");
      setJobUrl(""); // Clear the URL input after success
    } catch (err) {
      toast.error(err.message || "Could not fetch job details from URL");
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.job_description && !form.resume_text) {
      toast.error("Provide a job description or upload your resume");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("pub_session_token");
    try {
      const body = { ...form };
      if (resumeFile?.resume_id) body.resume_id = resumeFile.resume_id;
      const res = await fetch(`${API_URL}/api/cover-letter/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setResult(data);
      toast.success("Cover letter generated!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.cover_letter);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const tones = [
    { value: "professional", label: "Professional" },
    { value: "enthusiastic", label: "Enthusiastic" },
    { value: "concise", label: "Concise" },
    { value: "creative", label: "Creative" },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <PenLine size={16} /> AI Cover Letter Generator
          </div>
          <h1 className="text-4xl font-bold" data-testid="cover-letter-heading">
            Create the Perfect Cover Letter
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Upload your resume and paste the job description. Our AI will craft a personalized, compelling cover letter in seconds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 space-y-4">
                {/* Resume Upload */}
                <div>
                  <Label>Your Resume (optional)</Label>
                  <div className="mt-1 border-2 border-dashed rounded-lg p-4 text-center">
                    {resumeFile ? (
                      <div className="flex items-center gap-2 justify-center text-sm">
                        <FileText size={16} className="text-primary" />
                        <span>{resumeFile.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => { setResumeFile(null); setForm(f => ({ ...f, resume_text: "" })); }}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileUpload} data-testid="cover-letter-file-upload" />
                        {uploading ? (
                          <Loader2 className="animate-spin mx-auto" size={24} />
                        ) : (
                          <>
                            <Upload size={24} className="mx-auto text-muted-foreground mb-1" />
                            <p className="text-sm text-muted-foreground">Upload PDF or DOCX</p>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                {/* Job Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="job-title"><Briefcase size={14} className="inline mr-1" />Job Title</Label>
                    <Input
                      id="job-title"
                      placeholder="e.g. Senior Developer"
                      className="mt-1"
                      data-testid="cover-letter-job-title"
                      value={form.job_title}
                      onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company"><Building2 size={14} className="inline mr-1" />Company</Label>
                    <Input
                      id="company"
                      placeholder="e.g. Google"
                      className="mt-1"
                      data-testid="cover-letter-company"
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <Label htmlFor="jd">Job Description</Label>
                  <Textarea
                    id="jd"
                    placeholder="Paste the job description here..."
                    className="mt-1 min-h-[120px]"
                    data-testid="cover-letter-jd"
                    value={form.job_description}
                    onChange={(e) => setForm({ ...form, job_description: e.target.value })}
                  />
                </div>

                {/* Tone */}
                <div>
                  <Label>Tone</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {tones.map((t) => (
                      <Button
                        key={t.value}
                        variant={form.tone === t.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setForm({ ...form, tone: t.value })}
                        data-testid={`tone-${t.value}`}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={loading}
                  data-testid="generate-cover-letter-btn"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin mr-2" size={16} /> Generating...</>
                  ) : (
                    <><Sparkles size={16} className="mr-2" /> Generate Cover Letter</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Result */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Your Cover Letter</h3>
                  {result && (
                    <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="copy-cover-letter">
                      {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  )}
                </div>
                {result ? (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed" data-testid="cover-letter-result">
                    {result.cover_letter}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
                    <PenLine size={48} className="mb-4 opacity-30" />
                    <p className="text-sm">Your AI-generated cover letter will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CoverLetterPage;

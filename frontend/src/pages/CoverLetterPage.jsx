// ✅ FULL CORRECTED COVER LETTER PAGE
// Includes: UX improvements, editing, download, regenerate, builder integration, better feedback

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
  Briefcase, Building2, Sparkles, Link, Globe, Download, RefreshCw
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
  const [resumeFile, setResumeFile] = useState(null);

  const [form, setForm] = useState({
    resume_text: "",
    job_description: "",
    job_title: "",
    company_name: "",
    tone: "professional",
  });

  // 🔥 Load from Resume Builder
  useEffect(() => {
    const saved = localStorage.getItem("resume_data");
    if (saved) {
      const parsed = JSON.parse(saved);
      setForm(f => ({
        ...f,
        resume_text: JSON.stringify(parsed)
      }));
    }
  }, []);

  // =========================
  // FILE UPLOAD
  // =========================
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/resume/upload`, { method: "POST", body: fd });
      const data = await res.json();

      setResumeFile({ name: file.name, resume_id: data.resume_id });
      setForm(f => ({ ...f, resume_text: data.text_preview }));

      toast.success("Resume uploaded successfully!");
    } catch {
      toast.error("Upload failed");
    }

    setUploading(false);
  };

  // =========================
  // FETCH JOB URL
  // =========================
  const handleFetchJobUrl = async () => {
    if (!jobUrl.trim()) return toast.error("Enter job URL");

    setFetchingUrl(true);

    try {
      const res = await fetch(`${API_URL}/api/cover-letter/fetch-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });

      const data = await res.json();

      setForm(f => ({
        ...f,
        job_description: data.job_description || f.job_description,
        job_title: data.job_title || f.job_title,
        company_name: data.company_name || f.company_name,
      }));

      toast.success("Job details extracted 🚀");
      setJobUrl("");
    } catch {
      toast.error("Failed to fetch job details");
    }

    setFetchingUrl(false);
  };

  // =========================
  // GENERATE
  // =========================
  const handleGenerate = async () => {
    if (!form.job_description && !form.resume_text) {
      return toast.error("Add resume or job description");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/cover-letter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setResult(data);

      toast.success("🔥 Your personalized cover letter is ready!");
    } catch {
      toast.error("Generation failed");
    }

    setLoading(false);
  };

  // =========================
  // COPY
  // =========================
  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.cover_letter);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // =========================
  // DOWNLOAD
  // =========================
  const downloadText = () => {
    const blob = new Blob([result.cover_letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
  };

  const tones = ["professional", "enthusiastic", "concise", "creative"];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* HEADER */}
        <motion.div className="text-center mb-10">
          <h1 className="text-4xl font-bold">AI Cover Letter Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate tailored cover letters instantly 🚀
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT */}
          <Card>
            <CardContent className="p-6 space-y-4">

              {/* Upload */}
              <div>
                <Label>Resume</Label>
                <input type="file" onChange={handleFileUpload} />
              </div>

              {/* Job URL */}
              <div>
                <Label>Job URL</Label>
                <div className="flex gap-2">
                  <Input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
                  <Button onClick={handleFetchJobUrl}>
                    {fetchingUrl ? <Loader2 className="animate-spin" /> : "Fetch"}
                  </Button>
                </div>
              </div>

              {/* Job Info */}
              <Input placeholder="Job Title" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
              <Input placeholder="Company" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />

              <Textarea
                placeholder="Paste job description..."
                value={form.job_description}
                onChange={e => setForm({ ...form, job_description: e.target.value })}
              />

              {/* Tone */}
              <div className="flex gap-2">
                {tones.map(t => (
                  <Button
                    key={t}
                    variant={form.tone === t ? "default" : "outline"}
                    onClick={() => setForm({ ...form, tone: t })}
                  >
                    {t}
                  </Button>
                ))}
              </div>

              <Button onClick={handleGenerate} className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Generate
              </Button>

            </CardContent>
          </Card>

          {/* RIGHT */}
          <Card>
            <CardContent className="p-6 space-y-4">

              <div className="flex justify-between">
                <h3>Your Cover Letter</h3>
                {result && (
                  <Button onClick={copyToClipboard}>
                    {copied ? <Check /> : <Copy />}
                  </Button>
                )}
              </div>

              {result ? (
                <>
                  {/* Editable */}
                  <Textarea
                    value={result.cover_letter}
                    onChange={(e) => setResult({ ...result, cover_letter: e.target.value })}
                    className="min-h-[300px]"
                  />

                  {/* Insights */}
                  <div className="text-sm text-muted-foreground">
                    Tailored for {form.job_title} at {form.company_name}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button onClick={handleGenerate}>
                      <RefreshCw size={14} /> Regenerate
                    </Button>
                    <Button onClick={downloadText}>
                      <Download size={14} /> Download
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  Generate to see result
                </div>
              )}

            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
};

export default CoverLetterPage;

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ScoreRing } from "./ScoreRing";
import {
  Upload, FileText, Loader2, ArrowUpDown, TrendingUp, TrendingDown, Minus,
  CheckCircle, XCircle, Target, Copy,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DeltaBadge = ({ current, previous, label }) => {
  if (previous == null) return null;
  const delta = current - previous;
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const color = delta > 0 ? "text-green-600 bg-green-50" : delta < 0 ? "text-red-600 bg-red-50" : "text-slate-500 bg-slate-50";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`} data-testid={`delta-${label}`}>
      <Icon size={12} /> {delta > 0 ? "+" : ""}{delta}
    </span>
  );
};

const ComparisonBar = ({ label, scoreA, scoreB }) => {
  const delta = scoreB - scoreA;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <DeltaBadge current={scoreB} previous={scoreA} label={label.toLowerCase().replace(/\s/g, "-")} />
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-slate-400"
            initial={{ width: 0 }}
            animate={{ width: `${scoreA}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-mono text-slate-400 w-8 text-right">{scoreA}</span>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${delta >= 0 ? "bg-green-500" : "bg-red-400"}`}
            initial={{ width: 0 }}
            animate={{ width: `${scoreB}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-mono text-slate-600 w-8 text-right font-bold">{scoreB}</span>
      </div>
    </div>
  );
};

const ScoreComparison = ({ currentAnalysis, resumeId, onCopyToEditor }) => {
  const [compareFile, setCompareFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [compareAnalysis, setCompareAnalysis] = useState(null);
  const [compareResumeId, setCompareResumeId] = useState(null);
  const [compareText, setCompareText] = useState(null);

  const handleCompareUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompareFile(file.name);
    setUploading(true);
    setCompareAnalysis(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/resume/upload`, { method: "POST", body: formData });
      if (!res.ok) { toast.error("Upload failed"); return; }
      const data = await res.json();
      setCompareResumeId(data.resume_id);
      if (data.text_preview) setCompareText(data.text_preview);
      setUploading(false);
      setAnalyzing(true);
      const analysisRes = await fetch(`${API_URL}/api/resume/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: data.resume_id }),
      });
      if (analysisRes.ok) {
        setCompareAnalysis(await analysisRes.json());
        toast.success("Comparison ready!");
      } else {
        toast.error("Analysis failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  if (!currentAnalysis) return null;

  const a = currentAnalysis;
  const b = compareAnalysis;

  return (
    <Card className="border-0 shadow-lg" data-testid="score-comparison">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ArrowUpDown size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Score Comparison</h3>
            <p className="text-sm text-muted-foreground">Upload another version to see how it stacks up</p>
          </div>
        </div>

        {!compareAnalysis ? (
          <div className="border-2 border-dashed rounded-xl p-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
            {uploading || analyzing ? (
              <div className="py-4">
                <Loader2 className="animate-spin mx-auto mb-3 text-primary" size={32} />
                <p className="font-medium">{uploading ? "Uploading..." : "Analyzing..."}</p>
                <p className="text-sm text-muted-foreground mt-1">{compareFile}</p>
              </div>
            ) : (
              <>
                <Upload size={28} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium mb-1">Upload a second resume version</p>
                <p className="text-sm text-muted-foreground mb-4">Compare scores side-by-side with your current resume</p>
                <label>
                  <input type="file" accept=".pdf,.docx" onChange={handleCompareUpload} className="hidden" data-testid="compare-upload-input" />
                  <Button asChild variant="outline" className="rounded-full" data-testid="compare-upload-btn">
                    <span><FileText size={16} className="mr-2" /> Choose File to Compare</span>
                  </Button>
                </label>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Score rings side by side */}
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Original</span>
                  <div className="flex justify-center gap-6">
                    <ScoreRing score={a.overall_score} label="Overall" size={90} />
                    <ScoreRing score={a.ats_score} label="ATS" size={90} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.filename}</p>
                </div>
                <div className="text-center space-y-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">New Version</span>
                  <div className="flex justify-center gap-6">
                    <ScoreRing score={b.overall_score} label="Overall" size={90} />
                    <ScoreRing score={b.ats_score} label="ATS" size={90} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{compareFile}</p>
                </div>
              </div>

              {/* Bar comparisons */}
              <div className="space-y-4 pt-2">
                <ComparisonBar label="Overall Score" scoreA={a.overall_score} scoreB={b.overall_score} />
                <ComparisonBar label="ATS Score" scoreA={a.ats_score} scoreB={b.ats_score} />
              </div>

              {/* Detailed diff */}
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> New Strengths</h4>
                  {(b.strengths || []).filter(s => !(a.strengths || []).includes(s)).map((s, i) => (
                    <p key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" /> {s}</p>
                  ))}
                  {(b.strengths || []).filter(s => !(a.strengths || []).includes(s)).length === 0 && <p className="text-xs text-muted-foreground">No new strengths detected</p>}
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5"><XCircle size={14} className="text-red-500" /> Resolved Issues</h4>
                  {(a.weaknesses || []).filter(w => !(b.weaknesses || []).includes(w)).map((w, i) => (
                    <p key={i} className="text-xs text-slate-600 flex items-start gap-1.5 line-through opacity-60"><XCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" /> {w}</p>
                  ))}
                  {(a.weaknesses || []).filter(w => !(b.weaknesses || []).includes(w)).length === 0 && <p className="text-xs text-muted-foreground">Same issues present</p>}
                </div>
              </div>

              {/* Keywords diff */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-sm flex items-center gap-1.5 mb-3"><Target size={14} className="text-primary" /> Keywords Coverage</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(a.missing_keywords || []).map((k, i) => {
                    const fixed = !(b.missing_keywords || []).includes(k);
                    return (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${fixed ? "bg-green-100 text-green-700 line-through" : "bg-red-50 text-red-600"}`}>
                        {k} {fixed && "\u2713"}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Upload another */}
              <div className="text-center pt-2 flex items-center justify-center gap-3 flex-wrap">
                {onCopyToEditor && compareResumeId && (
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-full"
                    data-testid="copy-comparison-to-editor"
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_URL}/api/resume/get-text/${compareResumeId}`);
                        if (res.ok) {
                          const data = await res.json();
                          onCopyToEditor(data.text || compareText || "");
                          toast.success("Comparison resume copied to editor!");
                        } else {
                          if (compareText) {
                            onCopyToEditor(compareText);
                            toast.success("Comparison resume copied to editor!");
                          } else {
                            toast.error("Could not load comparison text");
                          }
                        }
                      } catch {
                        if (compareText) {
                          onCopyToEditor(compareText);
                          toast.success("Comparison resume copied to editor!");
                        } else {
                          toast.error("Could not load comparison text");
                        }
                      }
                    }}
                  >
                    <Copy size={14} className="mr-1.5" /> Copy to Editor
                  </Button>
                )}
                <label>
                  <input type="file" accept=".pdf,.docx" onChange={handleCompareUpload} className="hidden" />
                  <Button asChild variant="ghost" size="sm" className="text-xs" data-testid="compare-another-btn">
                    <span>Upload a different version to compare</span>
                  </Button>
                </label>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default ScoreComparison;

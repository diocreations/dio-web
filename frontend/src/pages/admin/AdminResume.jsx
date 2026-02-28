import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, FileText, Users, DollarSign, TrendingUp, Trash2, CheckCircle, XCircle, Calendar, Loader2, Settings, Database } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminResume = () => {
  const [pricing, setPricing] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchData = async () => {
    try {
      const [pricingRes, analyticsRes, resumesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/resume/pricing`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/resume/analytics`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/resume/list`, { credentials: "include" }),
      ]);
      setPricing(await pricingRes.json());
      setAnalytics(await analyticsRes.json());
      setResumes(await resumesRes.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const savePricing = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/resume/pricing`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(pricing),
      });
      if (res.ok) toast.success("Pricing saved!");
      else toast.error("Failed to save");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDeleteResume = async (resumeId, filename) => {
    if (!window.confirm(`Delete "${filename}" and all associated data? This cannot be undone.`)) return;
    setDeleting(resumeId);
    try {
      const res = await fetch(`${API_URL}/api/admin/resume/${resumeId}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) {
        toast.success("Resume deleted");
        setResumes(resumes.filter(r => r.resume_id !== resumeId));
      } else toast.error("Failed to delete");
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <AdminLayout><div className="animate-pulse space-y-6">{[1, 2, 3].map((i) => <div key={i} className="bg-slate-200 h-32 rounded-lg" />)}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl" data-testid="admin-resume-title">Resume Optimizer</h1>
            <p className="text-muted-foreground">Manage pricing, uploaded resumes, and view analytics</p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="text-blue-600" size={20} /></div>
              <div><p className="text-xl font-bold">{analytics?.total_analyses || 0}</p><p className="text-xs text-muted-foreground">Total Analyses</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Users className="text-green-600" size={20} /></div>
              <div><p className="text-xl font-bold">{analytics?.total_paid_users || 0}</p><p className="text-xs text-muted-foreground">Paid Users</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="text-primary" size={20} /></div>
              <div><p className="text-xl font-bold">{pricing?.currency || "EUR"} {analytics?.total_revenue || 0}</p><p className="text-xs text-muted-foreground">Revenue</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Database className="text-amber-600" size={20} /></div>
              <div><p className="text-xl font-bold">{resumes.length}</p><p className="text-xs text-muted-foreground">Uploads</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="resumes" className="w-full">
          <TabsList>
            <TabsTrigger value="resumes" className="gap-2"><Database size={14} /> Uploaded Resumes</TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2"><Settings size={14} /> Pricing Settings</TabsTrigger>
          </TabsList>

          {/* Resumes Tab */}
          <TabsContent value="resumes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText size={18} /> All Uploaded Resumes</CardTitle>
                <CardDescription>View and delete uploaded resume files</CardDescription>
              </CardHeader>
              <CardContent>
                {resumes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No resumes uploaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {resumes.map((resume) => (
                      <div key={resume.resume_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg ${resume.is_paid ? "bg-green-100" : "bg-slate-100"}`}>
                            <FileText size={16} className={resume.is_paid ? "text-green-600" : "text-slate-400"} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{resume.filename}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(resume.created_at)}</span>
                              {resume.overall_score !== null && (
                                <span className={resume.overall_score >= 70 ? "text-green-600" : resume.overall_score >= 50 ? "text-amber-600" : "text-red-600"}>
                                  Score: {resume.overall_score}%
                                </span>
                              )}
                              {resume.is_paid ? (
                                <span className="flex items-center gap-1 text-green-600"><CheckCircle size={10} /> Paid</span>
                              ) : (
                                <span className="flex items-center gap-1 text-slate-400"><XCircle size={10} /> Free</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost" size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                          onClick={() => handleDeleteResume(resume.resume_id, resume.filename)}
                          disabled={deleting === resume.resume_id}
                          data-testid={`delete-resume-${resume.resume_id}`}
                        >
                          {deleting === resume.resume_id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product & Pricing</CardTitle>
                    <CardDescription>Set the product name, description, and pricing</CardDescription>
                  </div>
                  <Button onClick={savePricing} disabled={saving} className="rounded-full" data-testid="save-pricing-btn">
                    <Save className="mr-2" size={16} />{saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Product Name</Label><Input value={pricing?.product_name || ""} onChange={(e) => setPricing({ ...pricing, product_name: e.target.value })} data-testid="product-name-input" /></div>
                  <div className="space-y-2"><Label>Currency</Label><Input value={pricing?.currency || "EUR"} onChange={(e) => setPricing({ ...pricing, currency: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={pricing?.product_description || ""} onChange={(e) => setPricing({ ...pricing, product_description: e.target.value })} rows={2} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Price</Label><Input type="number" step="0.01" value={pricing?.price || 0} onChange={(e) => setPricing({ ...pricing, price: parseFloat(e.target.value) })} data-testid="price-input" /></div>
                  <div className="space-y-2"><Label>Discount %</Label><Input type="number" value={pricing?.discount_percent || 0} onChange={(e) => setPricing({ ...pricing, discount_percent: parseInt(e.target.value) })} /></div>
                </div>
                <div className="flex gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch checked={pricing?.pricing_enabled !== false} onCheckedChange={(c) => setPricing({ ...pricing, pricing_enabled: c })} data-testid="pricing-enabled-toggle" />
                    <Label className="font-medium">Pricing Enabled</Label>
                    <span className="text-xs text-muted-foreground">(OFF = Free access)</span>
                  </div>
                  <div className="flex items-center gap-2"><Switch checked={pricing?.discount_enabled || false} onCheckedChange={(c) => setPricing({ ...pricing, discount_enabled: c })} /><Label>Enable Discount</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={pricing?.linkedin_enabled !== false} onCheckedChange={(c) => setPricing({ ...pricing, linkedin_enabled: c })} /><Label>LinkedIn Optimization</Label></div>
                </div>
                <div className="space-y-2">
                  <Label>Features (one per line)</Label>
                  <Textarea value={pricing?.features?.join("\n") || ""} onChange={(e) => setPricing({ ...pricing, features: e.target.value.split("\n") })} rows={4} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminResume;

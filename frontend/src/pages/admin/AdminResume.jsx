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

  if (loading) return <AdminLayout><div className="animate-pulse space-y-6">{[1, 2, 3].map((i) => <div key={i} className="bg-slate-200 h-32 rounded-lg" />)}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl" data-testid="admin-resume-title">Resume Optimizer</h1>
            <p className="text-muted-foreground">Manage pricing, view analytics</p>
          </div>
          <Button onClick={savePricing} disabled={saving} className="rounded-full" data-testid="save-pricing-btn">
            <Save className="mr-2" size={18} />{saving ? "Saving..." : "Save Pricing"}
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="text-blue-600" size={24} /></div>
              <div><p className="text-2xl font-bold">{analytics?.total_analyses || 0}</p><p className="text-sm text-muted-foreground">Total Analyses</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center"><Users className="text-green-600" size={24} /></div>
              <div><p className="text-2xl font-bold">{analytics?.total_paid_users || 0}</p><p className="text-sm text-muted-foreground">Paid Users</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"><TrendingUp className="text-primary" size={24} /></div>
              <div><p className="text-2xl font-bold">{pricing?.currency || "EUR"} {analytics?.total_revenue || 0}</p><p className="text-sm text-muted-foreground">Total Revenue</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Product & Pricing</CardTitle>
            <CardDescription>Set the product name, description, and pricing. Changes affect the public page immediately.</CardDescription>
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
            <div className="flex gap-6">
              <div className="flex items-center gap-2"><Switch checked={pricing?.discount_enabled || false} onCheckedChange={(c) => setPricing({ ...pricing, discount_enabled: c })} /><Label>Enable Discount</Label></div>
              <div className="flex items-center gap-2"><Switch checked={pricing?.linkedin_enabled !== false} onCheckedChange={(c) => setPricing({ ...pricing, linkedin_enabled: c })} /><Label>LinkedIn Optimization</Label></div>
            </div>
            <div className="space-y-2">
              <Label>Features (one per line, shown on pricing card)</Label>
              <Textarea value={pricing?.features?.join("\n") || ""} onChange={(e) => setPricing({ ...pricing, features: e.target.value.split("\n") })} rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Recent Analyses */}
        {analytics?.recent_analyses?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Recent Analyses</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.recent_analyses.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                    <span className="font-medium">{a.filename}</span>
                    <div className="flex items-center gap-4">
                      <span>Score: {a.overall_score}/100</span>
                      <span>ATS: {a.ats_score}/100</span>
                      <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminResume;

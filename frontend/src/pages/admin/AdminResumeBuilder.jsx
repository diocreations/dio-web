import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Loader2, FileText, Users, DollarSign, Settings } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminResumeBuilder = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [pricing, setPricing] = useState({
    pricing_enabled: false,
    price: 4.99,
    currency: "EUR",
    product_name: "Resume Builder Pro",
    description: "Create professional resumes with AI assistance"
  });
  const [stats, setStats] = useState({ total_drafts: 0, total_users: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pricing settings
      const pricingRes = await fetch(`${API_URL}/api/builder/resume-pricing`);
      if (pricingRes.ok) {
        const data = await pricingRes.json();
        if (data.pricing_id) {
          setPricing(data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch data:", e);
    }
    setLoading(false);
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_URL}/api/builder/pricing`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(pricing)
      });
      if (res.ok) {
        toast.success("Pricing settings saved!");
      } else {
        toast.error("Failed to save pricing");
      }
    } catch (e) {
      toast.error("Failed to save pricing");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Resume Builder Settings</h1>
          <p className="text-muted-foreground">Manage the AI-powered resume builder feature</p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="settings" className="gap-2"><Settings size={16} /> Settings</TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2"><DollarSign size={16} /> Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure the resume builder feature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Resume Builder Enabled</h3>
                    <p className="text-sm text-muted-foreground">Allow users to access the resume builder</p>
                  </div>
                  <Switch defaultChecked data-testid="builder-enabled-toggle" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">AI Generation</h3>
                    <p className="text-sm text-muted-foreground">Enable AI-powered content generation</p>
                  </div>
                  <Switch defaultChecked data-testid="ai-enabled-toggle" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Allow Guest Access</h3>
                    <p className="text-sm text-muted-foreground">Let non-logged-in users use the builder (without saving)</p>
                  </div>
                  <Switch defaultChecked data-testid="guest-access-toggle" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <FileText className="text-primary" size={24} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.total_drafts}</p>
                          <p className="text-sm text-muted-foreground">Total Drafts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-green-100">
                          <Users className="text-green-600" size={24} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.total_users}</p>
                          <p className="text-sm text-muted-foreground">Unique Users</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Configuration</CardTitle>
                <CardDescription>Set pricing for resume builder exports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 border-amber-200">
                  <div>
                    <h3 className="font-medium">Enable Pricing</h3>
                    <p className="text-sm text-muted-foreground">When OFF, exports are free for all users</p>
                  </div>
                  <Switch 
                    checked={pricing.pricing_enabled || false} 
                    onCheckedChange={(c) => setPricing({...pricing, pricing_enabled: c})}
                    data-testid="pricing-enabled-toggle"
                  />
                </div>

                {pricing.pricing_enabled && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Product Name</Label>
                      <Input 
                        value={pricing.product_name || ""} 
                        onChange={(e) => setPricing({...pricing, product_name: e.target.value})}
                        placeholder="Resume Builder Pro"
                      />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          value={pricing.price || ""} 
                          onChange={(e) => setPricing({...pricing, price: parseFloat(e.target.value)})}
                          placeholder="4.99"
                          className="flex-1"
                        />
                        <select 
                          value={pricing.currency || "EUR"} 
                          onChange={(e) => setPricing({...pricing, currency: e.target.value})}
                          className="px-3 border rounded-md"
                        >
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="INR">INR</option>
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Input 
                        value={pricing.description || ""} 
                        onChange={(e) => setPricing({...pricing, description: e.target.value})}
                        placeholder="Create professional resumes with AI assistance"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={savePricing} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Pricing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminResumeBuilder;

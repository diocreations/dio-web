import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, RefreshCw } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CURRENCY_OPTIONS = [
  { code: "EUR", symbol: "\u20ac", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound" },
  { code: "INR", symbol: "\u20b9", name: "Indian Rupee" },
  { code: "AED", symbol: "\u062f.\u0625", name: "UAE Dirham" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkCurrency, setBulkCurrency] = useState("EUR");
  const [updatingCurrency, setUpdatingCurrency] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        toast.success("Settings saved!");
      } else throw new Error("Failed");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (<div key={i} className="animate-pulse bg-slate-200 h-48 rounded-lg" />))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your website settings</p>
          </div>
          <Button type="submit" disabled={saving} className="rounded-full" data-testid="save-settings-btn">
            <Save className="mr-2" size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input id="site_name" name="site_name" value={settings?.site_name || ""} onChange={handleChange} data-testid="settings-site-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" name="tagline" value={settings?.tagline || ""} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL (220x100)</Label>
                <Input id="logo_url" name="logo_url" value={settings?.logo_url || ""} onChange={handleChange} placeholder="https://..." />
                <p className="text-xs text-muted-foreground">For animated SVG logos, paste the full URL</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="favicon_url">Favicon URL</Label>
                <Input id="favicon_url" name="favicon_url" value={settings?.favicon_url || ""} onChange={handleChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input id="contact_email" name="contact_email" type="email" value={settings?.contact_email || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input id="contact_phone" name="contact_phone" value={settings?.contact_phone || ""} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_address">Address</Label>
              <Textarea id="contact_address" name="contact_address" value={settings?.contact_address || ""} onChange={handleChange} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Social Media</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="social_facebook">Facebook URL</Label>
                <Input id="social_facebook" name="social_facebook" value={settings?.social_facebook || ""} onChange={handleChange} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_twitter">Twitter URL</Label>
                <Input id="social_twitter" name="social_twitter" value={settings?.social_twitter || ""} onChange={handleChange} placeholder="https://twitter.com/..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="social_linkedin">LinkedIn URL</Label>
                <Input id="social_linkedin" name="social_linkedin" value={settings?.social_linkedin || ""} onChange={handleChange} placeholder="https://linkedin.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_instagram">Instagram URL</Label>
                <Input id="social_instagram" name="social_instagram" value={settings?.social_instagram || ""} onChange={handleChange} placeholder="https://instagram.com/..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Footer & Analytics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="footer_text">Footer Copyright Text</Label>
              <Input id="footer_text" name="footer_text" value={settings?.footer_text || ""} onChange={handleChange} placeholder="© 2025 Company Name. All rights reserved." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
              <Input id="google_analytics_id" name="google_analytics_id" value={settings?.google_analytics_id || ""} onChange={handleChange} placeholder="G-XXXXXXXXXX" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Settings (Stripe)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Enter your Stripe Secret Key to enable real payments. 
                Get your key from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a>.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stripe_api_key">Stripe Secret Key</Label>
                <Input 
                  id="stripe_api_key" 
                  name="stripe_api_key" 
                  type="password"
                  value={settings?.stripe_api_key || ""} 
                  onChange={handleChange} 
                  placeholder="sk_live_..." 
                  data-testid="stripe-api-key"
                />
                <p className="text-xs text-muted-foreground">Starts with sk_live_ for live mode or sk_test_ for sandbox</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe_mode">Payment Mode</Label>
                <select 
                  id="stripe_mode" 
                  name="stripe_mode" 
                  value={settings?.stripe_mode || "test"} 
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border px-3"
                  data-testid="stripe-mode"
                >
                  <option value="test">🧪 Test/Sandbox Mode</option>
                  <option value="live">🟢 Live Mode</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {settings?.stripe_mode === "live" 
                    ? "Real payments are enabled" 
                    : "Using test mode - no real charges"}
                </p>
              </div>
            </div>
            {settings?.stripe_api_key && (
              <div className={`p-3 rounded-lg ${settings?.stripe_mode === "live" ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"}`}>
                <p className={`text-sm ${settings?.stripe_mode === "live" ? "text-green-700" : "text-blue-700"}`}>
                  {settings?.stripe_mode === "live" 
                    ? "✅ Live payments are configured. Real charges will be processed."
                    : "ℹ️ Sandbox mode active. Use test card 4242 4242 4242 4242 for testing."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bulk Currency Update</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Change the base currency for <strong>all products</strong> at once. This updates the currency field on every product in your catalog.
              </p>
            </div>
            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="bulk_currency">New Base Currency</Label>
                <select
                  id="bulk_currency"
                  value={bulkCurrency}
                  onChange={(e) => setBulkCurrency(e.target.value)}
                  className="w-full h-10 rounded-md border px-3"
                  data-testid="bulk-currency-select"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={updatingCurrency}
                onClick={async () => {
                  if (!window.confirm(`Update ALL products to ${bulkCurrency}? This cannot be undone.`)) return;
                  setUpdatingCurrency(true);
                  try {
                    const res = await fetch(`${API_URL}/api/products/bulk-currency`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ currency: bulkCurrency }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      toast.success(`Updated ${data.updated_count} products to ${bulkCurrency}`);
                    } else throw new Error("Failed");
                  } catch { toast.error("Failed to update currency"); }
                  finally { setUpdatingCurrency(false); }
                }}
                className="rounded-full"
                data-testid="bulk-currency-btn"
              >
                <RefreshCw className={`mr-2 ${updatingCurrency ? "animate-spin" : ""}`} size={16} />
                {updatingCurrency ? "Updating..." : "Update All Products"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ResellerClub Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>ResellerClub Integration:</strong> Enter your API credentials to enable domain registration and hosting services. 
                Get your credentials from <a href="https://manage.resellerclub.com" target="_blank" rel="noopener noreferrer" className="underline">ResellerClub Panel</a> → Settings → API.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resellerclub_reseller_id">Reseller ID (Auth-Userid)</Label>
                <Input 
                  id="resellerclub_reseller_id" 
                  name="resellerclub_reseller_id" 
                  value={settings?.resellerclub_reseller_id || ""} 
                  onChange={handleChange} 
                  placeholder="Your Reseller ID" 
                  data-testid="resellerclub-reseller-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resellerclub_api_key">API Key</Label>
                <Input 
                  id="resellerclub_api_key" 
                  name="resellerclub_api_key" 
                  type="password"
                  value={settings?.resellerclub_api_key || ""} 
                  onChange={handleChange} 
                  placeholder="Your API Key" 
                  data-testid="resellerclub-api-key"
                />
              </div>
            </div>
            {settings?.resellerclub_api_key && settings?.resellerclub_reseller_id && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">
                  ✅ ResellerClub credentials configured. Domain and hosting services are enabled.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="rounded-full">
            <Save className="mr-2" size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminSettings;

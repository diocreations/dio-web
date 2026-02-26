import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Globe, DollarSign } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const REGION_PRESETS = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AE", name: "UAE" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "SG", name: "Singapore" },
  { code: "CH", name: "Switzerland" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
];

const AdminCurrency = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/currency/settings`, { credentials: "include" });
      setSettings(await res.json());
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/currency/settings`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast.success("Currency settings saved!");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const updateRegion = (code, currency) => {
    setSettings(prev => ({
      ...prev,
      region_currencies: { ...prev.region_currencies, [code]: currency },
    }));
  };

  const updateRate = (currency, rate) => {
    setSettings(prev => ({
      ...prev,
      rates: { ...prev.rates, [currency]: parseFloat(rate) || 0 },
    }));
  };

  if (loading) return <AdminLayout><div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div></AdminLayout>;

  const currencies = Object.keys(settings?.rates || {});

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="admin-currency-heading">Currency Settings</h1>
            <p className="text-sm text-muted-foreground">Configure regional currencies and exchange rates</p>
          </div>
          <Button onClick={save} disabled={saving} data-testid="save-currency-btn">
            {saving ? <Loader2 className="animate-spin mr-1" size={16} /> : <Save size={16} className="mr-1" />}
            Save
          </Button>
        </div>

        {/* Default Currency */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Label className="flex items-center gap-2 mb-3"><Globe size={16} /> Default Currency (for unrecognized regions)</Label>
            <select
              className="border rounded px-3 py-2 text-sm w-48"
              value={settings?.default_currency || "USD"}
              onChange={(e) => setSettings(prev => ({ ...prev, default_currency: e.target.value }))}
              data-testid="default-currency-select"
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </CardContent>
        </Card>

        {/* Regional Currencies */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe size={16} /> Regional Currency Mapping</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REGION_PRESETS.map(r => (
                <div key={r.code} className="flex items-center gap-2">
                  <span className="text-sm w-28 font-medium">{r.name}:</span>
                  <select
                    className="border rounded px-2 py-1.5 text-sm flex-1"
                    value={settings?.region_currencies?.[r.code] || "EUR"}
                    onChange={(e) => updateRegion(r.code, e.target.value)}
                    data-testid={`region-${r.code}`}
                  >
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rates */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><DollarSign size={16} /> Exchange Rates (base: EUR)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currencies.map(c => (
                <div key={c} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-12">{c}:</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="h-8 text-sm"
                    value={settings?.rates?.[c] ?? ""}
                    onChange={(e) => updateRate(c, e.target.value)}
                    data-testid={`rate-${c}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCurrency;

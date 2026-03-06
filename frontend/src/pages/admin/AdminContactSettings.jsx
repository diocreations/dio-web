import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, DollarSign, Briefcase } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminContactSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/contact-settings`);
      const data = await res.json();
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/contact-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        toast.success("Contact form settings saved!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateBudgetRange = (index, value) => {
    setSettings(prev => {
      const ranges = [...(prev.budget_ranges || [])];
      ranges[index] = value;
      return { ...prev, budget_ranges: ranges };
    });
  };

  const addBudgetRange = () => {
    setSettings(prev => ({
      ...prev,
      budget_ranges: [...(prev.budget_ranges || []), ""]
    }));
  };

  const removeBudgetRange = (index) => {
    setSettings(prev => ({
      ...prev,
      budget_ranges: (prev.budget_ranges || []).filter((_, i) => i !== index)
    }));
  };

  const updateServiceOption = (index, value) => {
    setSettings(prev => {
      const options = [...(prev.service_options || [])];
      options[index] = value;
      return { ...prev, service_options: options };
    });
  };

  const addServiceOption = () => {
    setSettings(prev => ({
      ...prev,
      service_options: [...(prev.service_options || []), ""]
    }));
  };

  const removeServiceOption = (index) => {
    setSettings(prev => ({
      ...prev,
      service_options: (prev.service_options || []).filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="admin-contact-settings-title">Contact Form Settings</h1>
            <p className="text-muted-foreground">Customize dropdown options for the contact form</p>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="rounded-full" data-testid="save-contact-settings">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget Ranges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign size={18} /> Budget Ranges
              </CardTitle>
              <CardDescription>
                Options shown in the "Budget Range" dropdown. Include currency symbols as needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(settings?.budget_ranges || []).map((range, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={range}
                    onChange={(e) => updateBudgetRange(index, e.target.value)}
                    placeholder="e.g., €1,000 - €5,000"
                    data-testid={`budget-range-${index}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBudgetRange(index)}
                    className="flex-shrink-0"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addBudgetRange}
                className="w-full"
                data-testid="add-budget-range"
              >
                <Plus size={14} className="mr-1" /> Add Budget Range
              </Button>
            </CardContent>
          </Card>

          {/* Service Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase size={18} /> Service Options
              </CardTitle>
              <CardDescription>
                Options shown in the "Service Interest" dropdown on the contact form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(settings?.service_options || []).map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={option}
                    onChange={(e) => updateServiceOption(index, e.target.value)}
                    placeholder="e.g., Web Development"
                    data-testid={`service-option-${index}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeServiceOption(index)}
                    className="flex-shrink-0"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addServiceOption}
                className="w-full"
                data-testid="add-service-option"
              >
                <Plus size={14} className="mr-1" /> Add Service Option
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> For budget ranges, include your currency symbol (€, $, £) directly in the text. 
              Example: "€1,000 - €5,000" or "Under £500"
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminContactSettings;

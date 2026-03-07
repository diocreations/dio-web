import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Loader2, FileText, Palette, Check } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingSaves, setPendingSaves] = useState({});

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/resume/templates`, { credentials: "include" });
      setTemplates(await res.json());
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  const addTemplate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/resume/templates`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Template", description: "", category: "professional" }),
      });
      const tpl = await res.json();
      setTemplates(prev => [...prev, tpl]);
      toast.success("Template created - don't forget to save your changes!");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const updateTemplate = (templateId, updates) => {
    setTemplates(prev => prev.map(t => t.template_id === templateId ? { ...t, ...updates } : t));
    setPendingSaves(prev => ({ ...prev, [templateId]: true }));
  };

  const saveTemplate = async (templateId) => {
    const template = templates.find(t => t.template_id === templateId);
    if (!template) return;
    
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/admin/resume/templates/${templateId}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      setPendingSaves(prev => ({ ...prev, [templateId]: false }));
      toast.success("Template saved!");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const saveAllTemplates = async () => {
    setSaving(true);
    const pendingIds = Object.keys(pendingSaves).filter(id => pendingSaves[id]);
    try {
      for (const templateId of pendingIds) {
        const template = templates.find(t => t.template_id === templateId);
        if (template) {
          await fetch(`${API_URL}/api/admin/resume/templates/${templateId}`, {
            method: "PUT", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(template),
          });
        }
      }
      setPendingSaves({});
      toast.success("All templates saved!");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await fetch(`${API_URL}/api/admin/resume/templates/${templateId}`, { method: "DELETE", credentials: "include" });
      setTemplates(prev => prev.filter(t => t.template_id !== templateId));
      setPendingSaves(prev => { const n = { ...prev }; delete n[templateId]; return n; });
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const hasPendingChanges = Object.values(pendingSaves).some(v => v);

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="admin-templates-heading">Resume Templates</h1>
            <p className="text-sm text-muted-foreground">Manage ATS-friendly resume templates for users</p>
          </div>
          <div className="flex gap-2">
            {hasPendingChanges && (
              <Button onClick={saveAllTemplates} disabled={saving} variant="default" className="bg-green-600 hover:bg-green-700" data-testid="save-all-templates-btn">
                {saving ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Save size={16} className="mr-1" />}
                Save All Changes
              </Button>
            )}
            <Button onClick={addTemplate} disabled={saving} variant="outline" data-testid="add-template-btn">
              <Plus size={16} className="mr-1" /> Add Template
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="animate-spin mx-auto" /></div>
        ) : templates.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No templates. Click "Add Template" to create one.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {templates.map(tpl => (
              <Card key={tpl.template_id} data-testid={`template-${tpl.template_id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={tpl.name}
                          onChange={(e) => updateTemplate(tpl.template_id, { name: e.target.value })}
                          className="h-8 text-sm font-medium"
                          placeholder="Template name"
                        />
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={tpl.category || "professional"}
                          onChange={(e) => updateTemplate(tpl.template_id, { category: e.target.value })}
                        >
                          <option value="professional">Professional</option>
                          <option value="modern">Modern</option>
                          <option value="creative">Creative</option>
                          <option value="ats">ATS-Optimized</option>
                        </select>
                      </div>
                      <Input
                        value={tpl.description || ""}
                        onChange={(e) => updateTemplate(tpl.template_id, { description: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="Description"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Layout:</Label>
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={tpl.style?.layout || "single-column"}
                            onChange={(e) => updateTemplate(tpl.template_id, { style: { ...tpl.style, layout: e.target.value } })}
                          >
                            <option value="single-column">Single Column</option>
                            <option value="two-column">Two Column</option>
                            <option value="sidebar">Sidebar</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Color:</Label>
                          <input
                            type="color"
                            value={tpl.style?.color || "#1a1a2e"}
                            onChange={(e) => updateTemplate(tpl.template_id, { style: { ...tpl.style, color: e.target.value } })}
                            className="w-8 h-6 rounded cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs">Active:</Label>
                          <Switch
                            checked={tpl.is_active !== false}
                            onCheckedChange={(v) => updateTemplate(tpl.template_id, { is_active: v })}
                          />
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteTemplate(tpl.template_id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTemplates;

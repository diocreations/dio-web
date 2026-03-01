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
import { Save, Plus, Trash2, MessageCircle, BookOpen, Sparkles, Settings, Smartphone } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminChatbot = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chatbot/settings`, { credentials: "include" });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (e) {
      toast.error("Failed to load chatbot settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/chatbot/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Chatbot settings saved! Active chat sessions will use the new settings.");
      } else {
        toast.error("Failed to save");
      }
    } catch (e) {
      toast.error("Failed to save chatbot settings");
    } finally {
      setSaving(false);
    }
  };

  // Greeting helpers
  const updateGreeting = (index, value) => {
    const updated = [...(settings?.greetings || [])];
    updated[index] = value;
    setSettings({ ...settings, greetings: updated });
  };

  const addGreeting = () => {
    const updated = [...(settings?.greetings || []), ""];
    setSettings({ ...settings, greetings: updated });
  };

  const removeGreeting = (index) => {
    const updated = settings.greetings.filter((_, i) => i !== index);
    setSettings({ ...settings, greetings: updated });
  };

  // Knowledge base helpers
  const updateKB = (index, field, value) => {
    const updated = [...(settings?.knowledge_base || [])];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({ ...settings, knowledge_base: updated });
  };

  const addKB = () => {
    const updated = [
      ...(settings?.knowledge_base || []),
      { title: "", content: "", enabled: true },
    ];
    setSettings({ ...settings, knowledge_base: updated });
  };

  const removeKB = (index) => {
    const updated = settings.knowledge_base.filter((_, i) => i !== index);
    setSettings({ ...settings, knowledge_base: updated });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-slate-200 h-48 rounded-lg" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground" data-testid="chatbot-admin-title">
              Chatbot Manager
            </h1>
            <p className="text-muted-foreground">
              Customize Dio's greetings, knowledge base, and personality
            </p>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="rounded-full"
            data-testid="save-chatbot-btn"
          >
            <Save className="mr-2" size={18} />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>

        <Tabs defaultValue="greetings" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="greetings" className="flex items-center gap-2">
              <MessageCircle size={16} /> Greetings
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <BookOpen size={16} /> Knowledge
            </TabsTrigger>
            <TabsTrigger value="personality" className="flex items-center gap-2">
              <Sparkles size={16} /> Personality
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings size={16} /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Greetings Tab */}
          <TabsContent value="greetings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Open Greetings</CardTitle>
                <CardDescription>
                  Dio will auto-open and greet visitors with a random message from this
                  list. Each visit gets a different greeting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(settings?.greetings || []).map((greeting, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-xs text-muted-foreground mt-3 w-6 text-right shrink-0">
                      {index + 1}.
                    </span>
                    <Textarea
                      value={greeting}
                      onChange={(e) => updateGreeting(index, e.target.value)}
                      rows={2}
                      className="flex-1"
                      placeholder="Enter a greeting message..."
                      data-testid={`greeting-input-${index}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGreeting(index)}
                      className="text-red-500 mt-1"
                      data-testid={`remove-greeting-${index}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addGreeting}
                  data-testid="add-greeting-btn"
                >
                  <Plus size={16} className="mr-2" /> Add Greeting
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                  Add information about DioCreations that Dio will use to answer
                  questions. Each entry is injected into Dio's context — no code
                  deployment needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(settings?.knowledge_base || []).length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No knowledge base entries yet. Add one below.
                  </p>
                )}
                {(settings?.knowledge_base || []).map((entry, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-slate-50 space-y-3"
                    data-testid={`kb-entry-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Input
                          value={entry.title || ""}
                          onChange={(e) => updateKB(index, "title", e.target.value)}
                          placeholder="Topic title (e.g., 'Pricing', 'Tech Stack')"
                          className="font-medium"
                          data-testid={`kb-title-${index}`}
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Switch
                          checked={entry.enabled !== false}
                          onCheckedChange={(v) => updateKB(index, "enabled", v)}
                          data-testid={`kb-toggle-${index}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKB(index)}
                          className="text-red-500"
                          data-testid={`remove-kb-${index}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={entry.content || ""}
                      onChange={(e) => updateKB(index, "content", e.target.value)}
                      rows={4}
                      placeholder="Enter knowledge content... (e.g., service details, pricing, FAQs, capabilities)"
                      data-testid={`kb-content-${index}`}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addKB}
                  data-testid="add-kb-btn"
                >
                  <Plus size={16} className="mr-2" /> Add Knowledge Entry
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personality Tab */}
          <TabsContent value="personality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Personality & Context</CardTitle>
                <CardDescription>
                  Add any extra instructions or context for Dio. This text is appended
                  to Dio's personality. Use it for tone adjustments, special
                  promotions, or seasonal messaging.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings?.personality || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, personality: e.target.value })
                  }
                  rows={8}
                  placeholder="E.g., 'We're running a 20% discount on all web development packages this month. Mention it when users ask about pricing.'"
                  data-testid="personality-textarea"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone size={18} /> Display Settings
                </CardTitle>
                <CardDescription>
                  Control when and where the Dio chatbot appears
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Hide on Mobile Devices</Label>
                    <p className="text-sm text-muted-foreground">
                      Hide the Dio chatbot on phones and tablets (screens smaller than 768px)
                    </p>
                  </div>
                  <Switch
                    checked={settings?.hide_on_mobile || false}
                    onCheckedChange={(v) => setSettings({ ...settings, hide_on_mobile: v })}
                    data-testid="hide-mobile-toggle"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="font-medium">Enable Chatbot</Label>
                    <p className="text-sm text-muted-foreground">
                      Master toggle to enable or disable the chatbot entirely
                    </p>
                  </div>
                  <Switch
                    checked={settings?.enabled !== false}
                    onCheckedChange={(v) => setSettings({ ...settings, enabled: v })}
                    data-testid="chatbot-enabled-toggle"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminChatbot;

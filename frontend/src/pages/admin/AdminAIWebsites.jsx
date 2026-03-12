import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Globe, Download, Settings, Trash2, Eye, Search, RefreshCw,
  CheckCircle, Clock, CreditCard, ExternalLink, MessageCircle,
  User, Edit, Pause, Play, Link as LinkIcon
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Currency configuration - same as main Diocreations site
const CURRENCIES = {
  EUR: { symbol: "€", code: "EUR", name: "Euro" },
  USD: { symbol: "$", code: "USD", name: "US Dollar" },
  GBP: { symbol: "£", code: "GBP", name: "British Pound" },
  INR: { symbol: "₹", code: "INR", name: "Indian Rupee" }
};

const AdminAIWebsites = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("websites");
  const [websites, setWebsites] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editingWebsite, setEditingWebsite] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [websitesRes, statsRes, settingsRes, siteSettingsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/ai-builder/admin/websites`),
        fetch(`${API_URL}/api/ai-builder/admin/stats`),
        fetch(`${API_URL}/api/ai-builder/admin/settings`),
        fetch(`${API_URL}/api/settings`),
        fetch(`${API_URL}/api/ai-builder/admin/users`)
      ]);
      
      if (websitesRes.ok) {
        const data = await websitesRes.json();
        setWebsites(data.websites || []);
      }
      if (statsRes.ok) setStats(await statsRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (siteSettingsRes.ok) setSiteSettings(await siteSettingsRes.json());
      if (usersRes.ok) {
        const userData = await usersRes.json();
        setUsers(userData.users || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch data");
    }
    setLoading(false);
  };

  // Get currency from site settings (same logic as main site)
  const getCurrency = () => {
    const currencyCode = siteSettings?.currency || "EUR";
    return CURRENCIES[currencyCode] || CURRENCIES.EUR;
  };

  const formatPrice = (price) => {
    const currency = getCurrency();
    return `${currency.symbol}${parseFloat(price || 0).toFixed(2)}`;
  };

  const handlePreviewWebsite = (websiteId) => {
    window.open(`/ai-builder/preview/${websiteId}`, '_blank');
  };

  const handleDownloadWebsite = async (websiteId, businessName) => {
    try {
      const response = await fetch(`${API_URL}/api/ai-builder/website/${websiteId}/download`);
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${businessName.toLowerCase().replace(/\s+/g, '-')}-website.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Website downloaded!");
    } catch (error) {
      toast.error("Failed to download website");
    }
  };

  const handleDeleteWebsite = async (websiteId) => {
    if (!confirm("Are you sure you want to delete this website?")) return;
    
    try {
      const response = await fetch(`${API_URL}/api/ai-builder/admin/website/${websiteId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setWebsites(websites.filter(w => w.website_id !== websiteId));
        toast.success("Website deleted");
      }
    } catch (error) {
      toast.error("Failed to delete website");
    }
  };

  const handleToggleUserStatus = async (userEmail, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/ai-builder/admin/user/${encodeURIComponent(userEmail)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: currentStatus === "active" ? "paused" : "active" })
      });
      if (response.ok) {
        fetchData();
        toast.success(`User ${currentStatus === "active" ? "paused" : "activated"}`);
      }
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userEmail) => {
    if (!confirm("Are you sure you want to delete this user? This will also remove all their websites.")) return;
    
    try {
      const response = await fetch(`${API_URL}/api/ai-builder/admin/user/${encodeURIComponent(userEmail)}`, {
        method: "DELETE"
      });
      if (response.ok) {
        fetchData();
        toast.success("User deleted");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleReassignWebsite = async (websiteId, newOwnerEmail) => {
    try {
      const response = await fetch(`${API_URL}/api/ai-builder/admin/website/${websiteId}/reassign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_owner_email: newOwnerEmail })
      });
      if (response.ok) {
        fetchData();
        setEditingWebsite(null);
        toast.success("Website reassigned");
      }
    } catch (error) {
      toast.error("Failed to reassign website");
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai-builder/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        toast.success("Settings saved!");
      } else {
        throw new Error("Save failed");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      preview: "bg-slate-100 text-slate-700",
      pending_domain: "bg-yellow-100 text-yellow-700",
      pending_payment: "bg-orange-100 text-orange-700",
      pending_download_payment: "bg-orange-100 text-orange-700",
      deployed: "bg-green-100 text-green-700",
      download_ready: "bg-blue-100 text-blue-700",
      paused: "bg-red-100 text-red-700"
    };
    const labels = {
      preview: "Preview",
      pending_domain: "Pending Domain",
      pending_payment: "Pending Payment",
      pending_download_payment: "Pending Download Payment",
      deployed: "Deployed",
      download_ready: "Download Ready",
      paused: "Paused"
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.preview}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getUserStatusBadge = (status) => {
    const isActive = status !== "paused";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
        {isActive ? "Active" : "Paused"}
      </span>
    );
  };

  const filteredWebsites = websites.filter(w =>
    w.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currency = getCurrency();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Website Builder</h1>
            <p className="text-slate-600">Manage generated websites, users, and settings</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-violet-600">{stats.total_websites}</p>
                <p className="text-sm text-slate-600">Total Websites</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-600">{stats.preview}</p>
                <p className="text-sm text-slate-600">Preview</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.deployed}</p>
                <p className="text-sm text-slate-600">Deployed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.downloaded}</p>
                <p className="text-sm text-slate-600">Downloaded</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.pending_payment}</p>
                <p className="text-sm text-slate-600">Pending Payment</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("websites")}
            className={`px-4 py-2 font-medium ${activeTab === "websites" ? "border-b-2 border-violet-600 text-violet-600" : "text-slate-600"}`}
          >
            <Globe size={16} className="inline mr-2" />
            Websites
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium ${activeTab === "users" ? "border-b-2 border-violet-600 text-violet-600" : "text-slate-600"}`}
          >
            <User size={16} className="inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 font-medium ${activeTab === "settings" ? "border-b-2 border-violet-600 text-violet-600" : "text-slate-600"}`}
          >
            <Settings size={16} className="inline mr-2" />
            Settings
          </button>
        </div>

        {/* Websites Tab */}
        {activeTab === "websites" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Websites</CardTitle>
                <div className="relative w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search websites..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-slate-500">Loading...</p>
              ) : filteredWebsites.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No websites found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-slate-600">
                        <th className="pb-3 font-medium">Website</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Domain</th>
                        <th className="pb-3 font-medium">Plan</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWebsites.map((website) => (
                        <tr key={website.website_id} className="border-b last:border-0">
                          <td className="py-4">
                            <div className="font-medium">{website.business_name}</div>
                            <div className="text-xs text-slate-500">{website.business_type}</div>
                          </td>
                          <td className="py-4">
                            <div className="text-sm">{website.customer_email}</div>
                          </td>
                          <td className="py-4">
                            {website.domain ? (
                              <a href={`https://${website.domain}`} target="_blank" rel="noopener" className="text-violet-600 hover:underline text-sm">
                                {website.domain}
                              </a>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className="text-sm capitalize">{website.hosting_type || "-"}</span>
                          </td>
                          <td className="py-4">{getStatusBadge(website.hosting_status)}</td>
                          <td className="py-4 text-sm text-slate-600">
                            {new Date(website.generated_at).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewWebsite(website.website_id)}
                                title="Preview Website"
                                className="text-violet-600 hover:text-violet-700 h-8 w-8 p-0"
                              >
                                <Eye size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadWebsite(website.website_id, website.business_name)}
                                title="Download ZIP"
                                className="h-8 w-8 p-0"
                              >
                                <Download size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingWebsite(website)}
                                title="Reassign Owner"
                                className="h-8 w-8 p-0"
                              >
                                <LinkIcon size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteWebsite(website.website_id)}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI Builder Users</CardTitle>
                <div className="relative w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-slate-500">Loading...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No users found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-slate-600">
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Websites</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Joined</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.email} className="border-b last:border-0">
                          <td className="py-4">
                            <div className="font-medium">{user.email}</div>
                          </td>
                          <td className="py-4">
                            <span className="text-sm">{user.websites_generated || 0} websites</span>
                          </td>
                          <td className="py-4">{getUserStatusBadge(user.status)}</td>
                          <td className="py-4 text-sm text-slate-600">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                          </td>
                          <td className="py-4">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleUserStatus(user.email, user.status)}
                                title={user.status === "paused" ? "Activate User" : "Pause Service"}
                                className={`h-8 w-8 p-0 ${user.status === "paused" ? "text-green-600" : "text-orange-600"}`}
                              >
                                {user.status === "paused" ? <Play size={16} /> : <Pause size={16} />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.email)}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && settings && (
          <div className="grid gap-6">
            {/* Currency Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Current currency: <strong>{currency.name} ({currency.symbol})</strong>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Currency is managed in the main site settings
                </p>
              </CardContent>
            </Card>

            {/* Domain Registration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Domain Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Domain Registration URL</Label>
                  <Input
                    value={settings.domain_registration_url || ""}
                    onChange={(e) => setSettings({...settings, domain_registration_url: e.target.value})}
                    placeholder="https://www.diocreations.in/products/domain-registration"
                  />
                  <p className="text-xs text-slate-500 mt-1">Link to GoDaddy/domain purchase page</p>
                </div>
              </CardContent>
            </Card>

            {/* Hosting Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hosting Plans & Pricing ({currency.symbol})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* WaaS */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-3">WaaS (Website as a Service)</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Price (Monthly) {currency.symbol}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.waas_price || ""}
                        onChange={(e) => setSettings({...settings, waas_price: parseFloat(e.target.value)})}
                        placeholder="29.99"
                      />
                    </div>
                    <div>
                      <Label>Stripe Payment Link</Label>
                      <Input
                        value={settings.waas_stripe_link || ""}
                        onChange={(e) => setSettings({...settings, waas_stripe_link: e.target.value})}
                        placeholder="https://buy.stripe.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* e-WaaS */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-3">e-WaaS (eCommerce Website)</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Price (Monthly) {currency.symbol}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.ewaas_price || ""}
                        onChange={(e) => setSettings({...settings, ewaas_price: parseFloat(e.target.value)})}
                        placeholder="49.99"
                      />
                    </div>
                    <div>
                      <Label>Stripe Payment Link</Label>
                      <Input
                        value={settings.ewaas_stripe_link || ""}
                        onChange={(e) => setSettings({...settings, ewaas_stripe_link: e.target.value})}
                        placeholder="https://buy.stripe.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Download */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium mb-3">Download (One-time)</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Price (One-time) {currency.symbol}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={settings.download_price || ""}
                        onChange={(e) => setSettings({...settings, download_price: parseFloat(e.target.value)})}
                        placeholder="19.99"
                      />
                    </div>
                    <div>
                      <Label>Stripe Payment Link</Label>
                      <Input
                        value={settings.download_stripe_link || ""}
                        onChange={(e) => setSettings({...settings, download_stripe_link: e.target.value})}
                        placeholder="https://buy.stripe.com/..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DNS & Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DNS & Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>DNS Server IP Address</Label>
                  <Input
                    value={settings.dns_server_ip || ""}
                    onChange={(e) => setSettings({...settings, dns_server_ip: e.target.value})}
                    placeholder="123.456.789.0"
                  />
                  <p className="text-xs text-slate-500 mt-1">Shown to users for A record configuration</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>WhatsApp Support Number</Label>
                    <Input
                      value={settings.whatsapp_number || ""}
                      onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                      placeholder="+1234567890"
                    />
                    <p className="text-xs text-slate-500 mt-1">Users can chat for DNS help</p>
                  </div>
                  <div>
                    <Label>Support Email</Label>
                    <Input
                      value={settings.support_email || ""}
                      onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                      placeholder="support@diocreations.eu"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveSettings} className="w-full md:w-auto">
              Save Settings
            </Button>
          </div>
        )}

        {/* Reassign Website Modal */}
        {editingWebsite && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingWebsite(null)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Reassign Website</h3>
              <p className="text-sm text-slate-600 mb-4">
                Reassign "{editingWebsite.business_name}" to a different user
              </p>
              <div className="mb-4">
                <Label>Current Owner</Label>
                <p className="text-sm text-slate-700">{editingWebsite.customer_email}</p>
              </div>
              <div className="mb-4">
                <Label>New Owner Email</Label>
                <Select onValueChange={(email) => handleReassignWebsite(editingWebsite.website_id, email)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => u.email !== editingWebsite.customer_email)
                      .map(user => (
                        <SelectItem key={user.email} value={user.email}>{user.email}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingWebsite(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAIWebsites;

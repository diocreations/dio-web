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
import { Save, FileText, Users, DollarSign, TrendingUp, Trash2, CheckCircle, XCircle, Calendar, Loader2, Settings, Database, AlertTriangle, Mail, CreditCard, UserCheck, UserX, Search, Linkedin } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminResume = () => {
  const [pricing, setPricing] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [paidUsers, setPaidUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [grantingAccess, setGrantingAccess] = useState(null);
  const [revokingAccess, setRevokingAccess] = useState(null);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantResumeId, setGrantResumeId] = useState("");

  const fetchData = async () => {
    try {
      const [pricingRes, analyticsRes, resumesRes, paidUsersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/resume/pricing`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/resume/analytics`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/resume/list`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/resume/paid-users`, { credentials: "include" }),
      ]);
      setPricing(await pricingRes.json());
      setAnalytics(await analyticsRes.json());
      setResumes(await resumesRes.json());
      if (paidUsersRes.ok) setPaidUsers(await paidUsersRes.json());
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

  const handleDeleteAllResumes = async () => {
    if (resumes.length === 0) {
      toast.info("No resumes to delete");
      return;
    }
    const confirmed = window.confirm(`⚠️ DELETE ALL ${resumes.length} RESUMES?\n\nThis will permanently delete:\n- All uploaded resume files (PDFs/DOCXs)\n- All analysis data\n- All improvement data\n\nThis action CANNOT be undone!`);
    if (!confirmed) return;
    
    // Double confirmation for safety
    const doubleConfirm = window.confirm(`Are you ABSOLUTELY sure? Type count: ${resumes.length} resumes will be deleted forever.`);
    if (!doubleConfirm) return;
    
    setDeletingAll(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/resume/delete-all`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Deleted ${data.deleted_count || resumes.length} resumes`);
        setResumes([]);
        fetchData(); // Refresh analytics
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete all resumes");
      }
    } catch { toast.error("Failed to delete all resumes"); }
    finally { setDeletingAll(false); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleGrantAccess = async (resumeId, email) => {
    if (!resumeId) {
      toast.error("Resume ID is required");
      return;
    }
    setGrantingAccess(resumeId);
    try {
      const res = await fetch(`${API_URL}/api/admin/resume/grant-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resume_id: resumeId, email }),
      });
      if (res.ok) {
        toast.success("Access granted successfully");
        fetchData();
        setGrantEmail("");
        setGrantResumeId("");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to grant access");
      }
    } catch {
      toast.error("Failed to grant access");
    } finally {
      setGrantingAccess(null);
    }
  };

  const handleRevokeAccess = async (resumeId) => {
    if (!window.confirm("Revoke paid access for this resume? The user will need to pay again.")) return;
    setRevokingAccess(resumeId);
    try {
      const res = await fetch(`${API_URL}/api/admin/resume/revoke-access/${resumeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Access revoked");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to revoke access");
      }
    } catch {
      toast.error("Failed to revoke access");
    } finally {
      setRevokingAccess(null);
    }
  };

  const filteredPaidUsers = paidUsers.filter(u => 
    !searchTerm || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.resume_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <TabsTrigger value="paid-users" className="gap-2"><UserCheck size={14} /> Paid Users</TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2"><Settings size={14} /> Pricing Settings</TabsTrigger>
          </TabsList>

          {/* Resumes Tab */}
          <TabsContent value="resumes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><FileText size={18} /> All Uploaded Resumes</CardTitle>
                    <CardDescription>View and delete uploaded resume files and their PDFs</CardDescription>
                  </div>
                  {resumes.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDeleteAllResumes}
                      disabled={deletingAll}
                      className="gap-2"
                      data-testid="delete-all-resumes-btn"
                    >
                      {deletingAll ? (
                        <><Loader2 size={14} className="animate-spin" /> Deleting...</>
                      ) : (
                        <><AlertTriangle size={14} /> Delete All ({resumes.length})</>
                      )}
                    </Button>
                  )}
                </div>
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
                              {resume.has_file && (
                                <span className="text-blue-500">PDF/DOCX</span>
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
                          title="Delete resume and all associated data"
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

          {/* Paid Users Tab */}
          <TabsContent value="paid-users">
            <div className="space-y-4">
              {/* Grant Access Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><UserCheck size={18} /> Grant Paid Access</CardTitle>
                  <CardDescription>Manually grant paid access to a user's resume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Resume ID</Label>
                      <Input
                        placeholder="e.g. resume_abc123..."
                        value={grantResumeId}
                        onChange={(e) => setGrantResumeId(e.target.value)}
                        data-testid="grant-resume-id"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">User Email (optional)</Label>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={grantEmail}
                        onChange={(e) => setGrantEmail(e.target.value)}
                        data-testid="grant-email"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => handleGrantAccess(grantResumeId, grantEmail)}
                        disabled={!grantResumeId || grantingAccess}
                        className="gap-2"
                        data-testid="grant-access-btn"
                      >
                        {grantingAccess ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                        Grant Access
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Paid Users List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><CreditCard size={18} /> Paid Users List</CardTitle>
                      <CardDescription>{paidUsers.length} users have paid for Resume AI</CardDescription>
                    </div>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search by email or resume..."
                        className="pl-9 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        data-testid="paid-users-search"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredPaidUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {searchTerm ? "No matching paid users found" : "No paid users yet"}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {filteredPaidUsers.map((user, idx) => (
                        <div key={user.resume_id || idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-green-100">
                              <CreditCard size={16} className="text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate flex items-center gap-1">
                                  <Mail size={12} className="text-muted-foreground" />
                                  {user.email || "No email"}
                                </p>
                                {user.amount && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    {user.currency || "EUR"} {user.amount}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1" title="Resume ID">
                                  <FileText size={10} /> {user.filename || user.resume_id?.slice(0, 20) + "..."}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar size={10} /> Paid: {formatDate(user.paid_at)}
                                </span>
                                {user.overall_score !== null && (
                                  <span className={user.overall_score >= 70 ? "text-green-600" : "text-amber-600"}>
                                    Score: {user.overall_score}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                            onClick={() => handleRevokeAccess(user.resume_id)}
                            disabled={revokingAccess === user.resume_id}
                            data-testid={`revoke-access-${user.resume_id}`}
                          >
                            {revokingAccess === user.resume_id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <><UserX size={14} /> Revoke</>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* LinkedIn Access Toggle */}
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Linkedin size={18} className="text-blue-600" /> LinkedIn Optimizer Access</CardTitle>
                  <CardDescription>Control who can access the LinkedIn Optimizer feature</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Public Access</p>
                      <p className="text-sm text-muted-foreground">
                        {pricing?.linkedin_public_access ? "Available to all users" : "Only available to paid Resume AI users"}
                      </p>
                    </div>
                    <Switch
                      checked={pricing?.linkedin_public_access || false}
                      onCheckedChange={(c) => setPricing({ ...pricing, linkedin_public_access: c })}
                      data-testid="linkedin-public-access-toggle"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Note: Save pricing settings to apply this change.
                  </p>
                </CardContent>
              </Card>
            </div>
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

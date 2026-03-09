import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Send, Mail, Users, Upload, Loader2, Trash2, RefreshCw,
  CheckCircle, Clock, XCircle, Calendar, Search, FileSpreadsheet,
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [singleEmail, setSingleEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/invitations`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleSingleInvite = async (e) => {
    e.preventDefault();
    if (!singleEmail.trim() || !singleEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/invitations/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: singleEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Invitation sent!");
        setSingleEmail("");
        fetchInvitations();
      } else {
        toast.error(data.detail || "Failed to send invitation");
      }
    } catch (err) {
      toast.error("Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  const handleBulkInvite = async () => {
    const emails = bulkEmails
      .split(/[\n,;]/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));
    
    if (emails.length === 0) {
      toast.error("No valid emails found");
      return;
    }
    
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/invitations/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails }),
      });
      const data = await res.json();
      if (res.ok) {
        const { results } = data;
        toast.success(`Sent: ${results.sent.length}, Already invited: ${results.already_invited.length}, Existing users: ${results.already_user.length}`);
        setBulkEmails("");
        fetchInvitations();
      } else {
        toast.error(data.detail || "Failed to send invitations");
      }
    } catch (err) {
      toast.error("Failed to send invitations");
    } finally {
      setSending(false);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/invitations/csv`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const { results } = data;
        toast.success(`Processed CSV: Sent ${results.sent.length} invitations`);
        fetchInvitations();
      } else {
        toast.error(data.detail || "Failed to process CSV");
      }
    } catch (err) {
      toast.error("Failed to upload CSV");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (inviteId) => {
    if (!window.confirm("Delete this invitation?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/invitations/${inviteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Invitation deleted");
        fetchInvitations();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleResend = async (inviteId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/invitations/resend/${inviteId}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Invitation resent!");
        fetchInvitations();
      } else {
        toast.error(data.detail || "Failed to resend");
      }
    } catch (err) {
      toast.error("Failed to resend invitation");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredInvitations = invitations.filter(
    (inv) =>
      !searchTerm ||
      inv.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.inviter_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case "accepted":
        return <CheckCircle size={14} className="text-green-500" />;
      case "expired":
        return <XCircle size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-amber-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      accepted: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      pending: "bg-amber-100 text-amber-700",
    };
    return `text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.pending}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invitations</h1>
          <p className="text-muted-foreground">Invite new users to join the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Sent</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.accepted}</p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expired}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="send" className="w-full">
          <TabsList>
            <TabsTrigger value="send" className="gap-2">
              <Send size={14} /> Send Invitations
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <Users size={14} /> All Invitations ({invitations.length})
            </TabsTrigger>
          </TabsList>

          {/* Send Invitations Tab */}
          <TabsContent value="send" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Single Invite */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail size={18} /> Single Invitation
                  </CardTitle>
                  <CardDescription>Send invitation to one person</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSingleInvite} className="space-y-3">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      data-testid="single-invite-email"
                    />
                    <Button type="submit" disabled={sending} className="w-full gap-2">
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Send Invitation
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Bulk Invite */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={18} /> Bulk Invitations
                  </CardTitle>
                  <CardDescription>Enter multiple emails (one per line or comma-separated)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    rows={5}
                    data-testid="bulk-invite-emails"
                  />
                  <Button onClick={handleBulkInvite} disabled={sending || !bulkEmails.trim()} className="w-full gap-2">
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Send All Invitations
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* CSV Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet size={18} /> CSV Upload
                </CardTitle>
                <CardDescription>Upload a CSV file containing email addresses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <label className="flex-1">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                      {uploading ? (
                        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                      ) : (
                        <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                      )}
                      <p className="text-sm font-medium">Click to upload CSV</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        CSV should contain email addresses (max 100 per upload)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                      disabled={uploading}
                      data-testid="csv-upload-input"
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Invitations Tab */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Invitations</CardTitle>
                    <CardDescription>{filteredInvitations.length} invitations found</CardDescription>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by email..."
                      className="pl-9 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredInvitations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchTerm ? "No matching invitations found" : "No invitations sent yet"}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredInvitations.map((inv) => (
                      <div
                        key={inv.invite_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getStatusIcon(inv.status)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{inv.email}</p>
                              <span className={getStatusBadge(inv.status)}>{inv.status}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar size={10} /> {formatDate(inv.created_at)}
                              </span>
                              {inv.inviter_name && <span>Invited by: {inv.inviter_name}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {inv.status === "pending" && (
                            <Button variant="ghost" size="sm" onClick={() => handleResend(inv.invite_id)} title="Resend">
                              <RefreshCw size={14} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(inv.invite_id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminInvitations;

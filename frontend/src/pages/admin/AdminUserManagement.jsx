import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Users, FileSearch, FileText, PenLine, Linkedin, Search, Plus, Edit, Trash2,
  CreditCard, Mail, Calendar, Activity, DollarSign, Eye, UserPlus, Package,
  ChevronRight, RefreshCw, Download, Filter
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminUserManagement = () => {
  const [activeTab, setActiveTab] = useState("resume");
  const [resumeUsers, setResumeUsers] = useState([]);
  const [dioUsers, setDioUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialogs
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  
  // Forms
  const [creditForm, setCreditForm] = useState({ service_type: "analyzer", credits: 1, notes: "" });
  const [serviceForm, setServiceForm] = useState({ product_name: "", amount: 0, notes: "" });
  const [createUserForm, setCreateUserForm] = useState({ email: "", name: "", password: "", notes: "" });
  const [editForm, setEditForm] = useState({ name: "", is_active: true, notes: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resumeRes, dioRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/user-management/resume-users`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/user-management/diocreations-users`, { credentials: "include" }),
        fetch(`${API_URL}/api/admin/user-management/stats`, { credentials: "include" })
      ]);
      
      if (resumeRes.ok) setResumeUsers(await resumeRes.json());
      if (dioRes.ok) setDioUsers(await dioRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const viewUserDetail = async (user, type) => {
    setSelectedUser({ ...user, type });
    try {
      const endpoint = type === "resume" 
        ? `/api/admin/user-management/resume-users/${encodeURIComponent(user.email)}`
        : `/api/admin/user-management/diocreations-users/${user.user_id}`;
      const res = await fetch(`${API_URL}${endpoint}`, { credentials: "include" });
      if (res.ok) {
        setUserDetail(await res.json());
        setShowUserDetail(true);
      }
    } catch {
      toast.error("Failed to load user details");
    }
  };

  const handleAddCredits = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/user-management/resume-users/${encodeURIComponent(selectedUser.email)}/add-credits`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(creditForm)
        }
      );
      if (res.ok) {
        toast.success(`Added ${creditForm.credits} credits!`);
        setShowAddCredits(false);
        setCreditForm({ service_type: "analyzer", credits: 1, notes: "" });
        fetchData();
      }
    } catch {
      toast.error("Failed to add credits");
    }
  };

  const handleAddService = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/user-management/diocreations-users/${selectedUser.user_id}/add-service`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(serviceForm)
        }
      );
      if (res.ok) {
        toast.success("Service added!");
        setShowAddService(false);
        setServiceForm({ product_name: "", amount: 0, notes: "" });
        fetchData();
      }
    } catch {
      toast.error("Failed to add service");
    }
  };

  const handleCreateUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/user-management/diocreations-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(createUserForm)
      });
      if (res.ok) {
        toast.success("User created!");
        setShowCreateUser(false);
        setCreateUserForm({ email: "", name: "", password: "", notes: "" });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create user");
      }
    } catch {
      toast.error("Failed to create user");
    }
  };

  const handleUpdateUser = async () => {
    try {
      const endpoint = selectedUser.type === "resume"
        ? `/api/admin/user-management/resume-users/${encodeURIComponent(selectedUser.email)}`
        : `/api/admin/user-management/diocreations-users/${selectedUser.user_id}`;
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success("User updated!");
        setShowEditUser(false);
        fetchData();
      }
    } catch {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (user, type) => {
    const email = type === "resume" ? user.email : user.email;
    if (!confirm(`Delete all data for ${email}? This cannot be undone.`)) return;
    
    try {
      const endpoint = type === "resume"
        ? `/api/admin/user-management/resume-users/${encodeURIComponent(user.email)}`
        : `/api/admin/user-management/diocreations-users/${user.user_id}`;
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success("User deleted");
        fetchData();
      }
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const openEditDialog = (user, type) => {
    setSelectedUser({ ...user, type });
    setEditForm({
      name: user.name || "",
      is_active: user.is_active !== false,
      notes: user.notes || ""
    });
    setShowEditUser(true);
  };

  const openAddCreditsDialog = (user) => {
    setSelectedUser({ ...user, type: "resume" });
    setShowAddCredits(true);
  };

  const openAddServiceDialog = (user) => {
    setSelectedUser({ ...user, type: "dio" });
    setShowAddService(true);
  };

  // Filter users
  const filteredResumeUsers = resumeUsers.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredDioUsers = dioUsers.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { 
      year: "numeric", month: "short", day: "numeric" 
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage all platform users and their services</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw size={16} className="mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <FileSearch size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.resume_tools?.analyzer_users || 0}</p>
                    <p className="text-xs text-muted-foreground">Analyzer Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.resume_tools?.builder_users || 0}</p>
                    <p className="text-xs text-muted-foreground">Builder Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.diocreations_users || 0}</p>
                    <p className="text-xs text-muted-foreground">Platform Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <DollarSign size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">€{stats.total_revenue?.toFixed(2) || "0.00"}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resume" className="gap-2">
              <FileSearch size={16} /> Resume Tool Users ({filteredResumeUsers.length})
            </TabsTrigger>
            <TabsTrigger value="diocreations" className="gap-2">
              <Package size={16} /> DioCreations Users ({filteredDioUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* Resume Tool Users Tab */}
          <TabsContent value="resume" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Resume Tool Users</CardTitle>
                <CardDescription>
                  Users of Resume Analyzer, Resume Builder, Cover Letter Generator, and LinkedIn Optimizer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredResumeUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No resume tool users found</p>
                  ) : (
                    filteredResumeUsers.map((user) => (
                      <div
                        key={user.email}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {user.email?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{user.email}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.tools_used?.analyzer && (
                                <Badge variant="secondary" className="text-xs"><FileSearch size={10} className="mr-1" />Analyzer</Badge>
                              )}
                              {user.tools_used?.builder && (
                                <Badge variant="secondary" className="text-xs"><FileText size={10} className="mr-1" />Builder</Badge>
                              )}
                              {user.tools_used?.cover_letter && (
                                <Badge variant="secondary" className="text-xs"><PenLine size={10} className="mr-1" />Cover</Badge>
                              )}
                              {user.tools_used?.linkedin && (
                                <Badge variant="secondary" className="text-xs"><Linkedin size={10} className="mr-1" />LinkedIn</Badge>
                              )}
                            </div>
                          </div>
                          <div className="hidden md:block text-sm text-muted-foreground">
                            <p>{user.usage?.analyses || 0} analyses</p>
                            <p className="text-xs">{formatDate(user.last_activity)}</p>
                          </div>
                          {user.payments?.total_paid > 0 && (
                            <Badge className="bg-green-100 text-green-700 hidden sm:flex">
                              €{user.payments.total_paid.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" onClick={() => viewUserDetail(user, "resume")}>
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openAddCreditsDialog(user)}>
                            <CreditCard size={16} className="text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(user, "resume")}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user, "resume")}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DioCreations Users Tab */}
          <TabsContent value="diocreations" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowCreateUser(true)}>
                <UserPlus size={16} className="mr-2" /> Add User
              </Button>
            </div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">DioCreations Platform Users</CardTitle>
                <CardDescription>
                  Registered users for Products & Services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredDioUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No platform users found</p>
                  ) : (
                    filteredDioUsers.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-medium">
                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{user.name || "No name"}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <div className="hidden md:flex items-center gap-2">
                            {user.newsletter_subscribed && (
                              <Badge variant="outline"><Mail size={12} className="mr-1" />Newsletter</Badge>
                            )}
                            {user.total_spent > 0 && (
                              <Badge className="bg-green-100 text-green-700">€{user.total_spent.toFixed(2)}</Badge>
                            )}
                          </div>
                          <div className="hidden md:block text-sm text-muted-foreground text-right">
                            <p>{formatDate(user.created_at)}</p>
                            <p className="text-xs">{user.purchases?.length || 0} purchases</p>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" onClick={() => viewUserDetail(user, "dio")}>
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openAddServiceDialog(user)}>
                            <Package size={16} className="text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(user, "dio")}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user, "dio")}>
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          {userDetail && (
            <div className="space-y-4">
              {selectedUser?.type === "resume" ? (
                <>
                  {/* Credits */}
                  <div>
                    <h4 className="font-medium mb-2">Credits</h4>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 bg-slate-50 rounded text-center">
                        <p className="text-lg font-bold">{userDetail.credits?.analyzer_credits || 0}</p>
                        <p className="text-xs text-muted-foreground">Analyzer</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded text-center">
                        <p className="text-lg font-bold">{userDetail.credits?.builder_credits || 0}</p>
                        <p className="text-xs text-muted-foreground">Builder</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded text-center">
                        <p className="text-lg font-bold">{userDetail.credits?.cover_letter_credits || 0}</p>
                        <p className="text-xs text-muted-foreground">Cover Letter</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded text-center">
                        <p className="text-lg font-bold">{userDetail.credits?.linkedin_credits || 0}</p>
                        <p className="text-xs text-muted-foreground">LinkedIn</p>
                      </div>
                    </div>
                  </div>
                  {/* Analyses */}
                  {userDetail.analyses?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recent Analyses ({userDetail.analyses.length})</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {userDetail.analyses.slice(0, 5).map((a, i) => (
                          <div key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                            <span className="truncate">{a.filename}</span>
                            <span className="text-muted-foreground">{a.overall_score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Payments */}
                  {userDetail.payments?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Payments ({userDetail.payments.length})</h4>
                      <div className="space-y-1">
                        {userDetail.payments.slice(0, 5).map((p, i) => (
                          <div key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                            <span>{formatDate(p.created_at)}</span>
                            <Badge variant={p.status === "completed" ? "default" : "secondary"}>
                              €{p.amount} - {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* User Info */}
                  <div>
                    <h4 className="font-medium mb-2">User Info</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> {userDetail.user?.name || "N/A"}</div>
                      <div><span className="text-muted-foreground">Email:</span> {userDetail.user?.email}</div>
                      <div><span className="text-muted-foreground">Verified:</span> {userDetail.user?.is_verified ? "Yes" : "No"}</div>
                      <div><span className="text-muted-foreground">Created:</span> {formatDate(userDetail.user?.created_at)}</div>
                    </div>
                  </div>
                  {/* Purchases */}
                  {userDetail.purchases?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Purchases ({userDetail.purchases.length})</h4>
                      <div className="space-y-1">
                        {userDetail.purchases.map((p, i) => (
                          <div key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                            <span>{p.product_name || p.product_id}</span>
                            <span>€{p.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Credits Dialog */}
      <Dialog open={showAddCredits} onOpenChange={setShowAddCredits}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>Add paid service credits for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Type</Label>
              <Select value={creditForm.service_type} onValueChange={v => setCreditForm({...creditForm, service_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="analyzer">Resume Analyzer</SelectItem>
                  <SelectItem value="builder">Resume Builder</SelectItem>
                  <SelectItem value="cover_letter">Cover Letter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn Optimizer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Credits</Label>
              <Input type="number" min="1" value={creditForm.credits} onChange={e => setCreditForm({...creditForm, credits: parseInt(e.target.value) || 1})} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={creditForm.notes} onChange={e => setCreditForm({...creditForm, notes: e.target.value})} placeholder="Reason for adding credits..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCredits(false)}>Cancel</Button>
            <Button onClick={handleAddCredits}>Add Credits</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog (for DioCreations users) */}
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Paid Service</DialogTitle>
            <DialogDescription>Manually add a service/product for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product/Service Name</Label>
              <Input value={serviceForm.product_name} onChange={e => setServiceForm({...serviceForm, product_name: e.target.value})} placeholder="e.g., Website Development Package" />
            </div>
            <div>
              <Label>Amount (EUR)</Label>
              <Input type="number" min="0" step="0.01" value={serviceForm.amount} onChange={e => setServiceForm({...serviceForm, amount: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={serviceForm.notes} onChange={e => setServiceForm({...serviceForm, notes: e.target.value})} placeholder="Additional details..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddService(false)}>Cancel</Button>
            <Button onClick={handleAddService}>Add Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new DioCreations platform user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={createUserForm.email} onChange={e => setCreateUserForm({...createUserForm, email: e.target.value})} placeholder="user@example.com" />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={createUserForm.name} onChange={e => setCreateUserForm({...createUserForm, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={createUserForm.password} onChange={e => setCreateUserForm({...createUserForm, password: e.target.value})} placeholder="Leave empty for no password" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={createUserForm.notes} onChange={e => setCreateUserForm({...createUserForm, notes: e.target.value})} placeholder="Internal notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateUser(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editForm.is_active} onCheckedChange={v => setEditForm({...editForm, is_active: v})} />
              <Label>Active</Label>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} placeholder="Internal notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUser(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUserManagement;

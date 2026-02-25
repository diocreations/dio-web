import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield, ShieldCheck, Mail, User, AlertTriangle } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminUsers = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else if (response.status === 403) {
        toast.error("Only super admin can manage users");
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setAdding(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newEmail.trim(), name: newName.trim() }),
      });
      if (response.ok) {
        toast.success("Admin user added!");
        setNewEmail("");
        setNewName("");
        fetchAdmins();
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to add admin");
      }
    } catch (error) {
      toast.error("Failed to add admin user");
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (adminId, email) => {
    if (!confirm(`Remove admin access for ${email}?`)) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${adminId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("Admin access removed");
        setAdmins(admins.filter(a => a.admin_id !== adminId));
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to remove admin");
      }
    } catch (error) {
      toast.error("Failed to remove admin");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-slate-200 h-24 rounded-lg" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Only the super admin can manage user access.
              <br />
              Contact <span className="font-medium">jomiejoseph@gmail.com</span> for access requests.
            </p>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Admin Users</h1>
          <p className="text-muted-foreground">Manage who has access to the admin panel</p>
        </div>

        {/* Add New Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus size={20} /> Add New Admin
            </CardTitle>
            <CardDescription>
              Grant admin access to a new user. They will be able to login via Google OAuth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addAdmin} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  data-testid="new-admin-email"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  data-testid="new-admin-name"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={adding} data-testid="add-admin-btn">
                  <UserPlus size={16} className="mr-2" />
                  {adding ? "Adding..." : "Add Admin"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Admin List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Admins</CardTitle>
            <CardDescription>
              {admins.length} user{admins.length !== 1 ? "s" : ""} with admin access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.admin_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  data-testid={`admin-row-${admin.admin_id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      admin.role === "super_admin" ? "bg-primary/10" : "bg-slate-100"
                    }`}>
                      {admin.role === "super_admin" ? (
                        <ShieldCheck className="text-primary" size={20} />
                      ) : (
                        <Shield className="text-slate-600" size={20} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{admin.name || "Unnamed"}</span>
                        {admin.role === "super_admin" && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            Super Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail size={14} />
                        {admin.email}
                      </div>
                    </div>
                  </div>
                  {admin.role !== "super_admin" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAdmin(admin.admin_id, admin.email)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      data-testid={`remove-admin-${admin.admin_id}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="text-blue-600 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">About Admin Access</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Super Admin (<span className="font-medium">jomiejoseph@gmail.com</span>) has permanent access and cannot be removed</li>
                  <li>Regular admins can login via Google OAuth with their registered email</li>
                  <li>Only the super admin can add or remove other admins</li>
                  <li>Users without admin access will see an "Access Denied" message when trying to login</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

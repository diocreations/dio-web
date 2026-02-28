import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Save, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminMenus = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("nav");

  useEffect(() => { fetchMenus(); }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/menus`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please login to manage menus");
        } else {
          toast.error("Failed to load menus");
        }
        setMenus([]);
        return;
      }
      const data = await res.json();
      setMenus(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Fetch menus error:", err);
      toast.error("Failed to load menus"); 
      setMenus([]);
    }
    finally { setLoading(false); }
  };

  const seedDefaultMenus = async () => {
    if (!window.confirm("This will add default menu items. Existing items will be kept. Continue?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/menus/seed-defaults`, {
        method: "POST", credentials: "include",
      });
      if (res.ok) {
        toast.success("Default menus added!");
        fetchMenus();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to seed menus");
      }
    } catch { toast.error("Failed to seed menus"); }
    finally { setSaving(false); }
  };

  const filteredMenus = menus.filter(m => m.menu_type === tab && !m.parent_id);
  const childMenus = (parentId) => menus.filter(m => m.parent_id === parentId);

  const addItem = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/menus`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_type: tab, label: "New Item", path: "/", order: filteredMenus.length }),
      });
      const item = await res.json();
      setMenus(prev => [...prev, item]);
      toast.success("Item added");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const addSubItem = async (parentId) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/menus`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_type: tab, label: "Sub Item", path: "/", parent_id: parentId, order: 0 }),
      });
      const item = await res.json();
      setMenus(prev => [...prev, item]);
      toast.success("Sub-item added");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const updateItem = async (itemId, updates) => {
    setMenus(prev => prev.map(m => m.item_id === itemId ? { ...m, ...updates } : m));
    try {
      await fetch(`${API_URL}/api/admin/menus/${itemId}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch { toast.error("Save failed"); }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await fetch(`${API_URL}/api/admin/menus/${itemId}`, { method: "DELETE", credentials: "include" });
      setMenus(prev => prev.filter(m => m.item_id !== itemId && m.parent_id !== itemId));
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const MenuItem = ({ item, isChild = false }) => (
    <div className={`border rounded-lg p-3 ${isChild ? "ml-8 bg-slate-50" : "bg-white"}`} data-testid={`menu-item-${item.item_id}`}>
      <div className="flex items-center gap-2">
        <GripVertical size={16} className="text-muted-foreground cursor-grab" />
        <Input
          value={item.label}
          onChange={(e) => updateItem(item.item_id, { label: e.target.value })}
          className="h-8 text-sm flex-1"
          placeholder="Label"
        />
        <Input
          value={item.path}
          onChange={(e) => updateItem(item.item_id, { path: e.target.value })}
          className="h-8 text-sm w-36"
          placeholder="/path"
        />
        <div className="flex items-center gap-1">
          <Switch
            checked={item.is_active !== false}
            onCheckedChange={(v) => updateItem(item.item_id, { is_active: v })}
          />
        </div>
        {!isChild && (
          <Button variant="ghost" size="sm" onClick={() => addSubItem(item.item_id)} title="Add sub-item" data-testid={`add-sub-${item.item_id}`}>
            <Plus size={14} />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => deleteItem(item.item_id)} className="text-red-500 hover:text-red-700">
          <Trash2 size={14} />
        </Button>
      </div>
      {/* Children */}
      {childMenus(item.item_id).map(child => (
        <MenuItem key={child.item_id} item={child} isChild />
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="admin-menus-heading">Menu Editor</h1>
            <p className="text-sm text-muted-foreground">Manage navigation and footer menus</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="nav">Navigation Menu</TabsTrigger>
            <TabsTrigger value="footer">Footer Menu</TabsTrigger>
          </TabsList>

          {["nav", "footer"].map(menuType => (
            <TabsContent key={menuType} value={menuType}>
              <div className="space-y-2 mb-4">
                {loading ? (
                  <div className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></div>
                ) : filteredMenus.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">No menu items found.</p>
                      <Button onClick={seedDefaultMenus} disabled={saving} variant="outline">
                        Load Default Menu Items
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredMenus.map(item => <MenuItem key={item.item_id} item={item} />)
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={addItem} disabled={saving} data-testid="add-menu-item-btn">
                  <Plus size={16} className="mr-1" /> Add Item
                </Button>
                {filteredMenus.length < 3 && (
                  <Button onClick={seedDefaultMenus} disabled={saving} variant="outline" size="sm">
                    Load Defaults
                  </Button>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMenus;

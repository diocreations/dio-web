import AdminLayout from "@/components/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Phone, Calendar, MessageSquare, Trash2, Edit2 } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editData, setEditData] = useState({ status: "", notes: "" });

  const fetchLeads = () => {
    fetch(`${API_URL}/api/leads`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { setLeads(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleUpdate = async () => {
    if (!selectedLead) return;
    try {
      await fetch(`${API_URL}/api/leads/${selectedLead.lead_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editData),
      });
      toast.success("Lead updated!");
      setSelectedLead(null);
      fetchLeads();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await fetch(`${API_URL}/api/leads/${leadId}`, { method: "DELETE", credentials: "include" });
      toast.success("Lead deleted!");
      fetchLeads();
    } catch { toast.error("Failed to delete"); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-yellow-100 text-yellow-700",
    qualified: "bg-green-100 text-green-700",
    converted: "bg-purple-100 text-purple-700",
    lost: "bg-slate-100 text-slate-700",
  };

  const openEdit = (lead) => {
    setSelectedLead(lead);
    setEditData({ status: lead.status || "new", notes: lead.notes || "" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground">Chatbot Leads</h1>
          <p className="text-muted-foreground">Manage leads collected by Dio chatbot</p>
        </div>

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => (<div key={i} className="animate-pulse bg-slate-200 h-24 rounded-lg" />))}</div>
        ) : leads.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No leads collected yet. The Dio chatbot will collect visitor information here.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <Card key={lead.lead_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="text-primary" size={24} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lead.name || "Unknown"}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.status] || statusColors.new}`}>
                          {lead.status || "new"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(lead)}><Edit2 size={14} /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(lead.lead_id)}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {lead.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={14} />
                        <a href={`mailto:${lead.email}`} className="hover:text-primary">{lead.email}</a>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone size={14} />
                        <a href={`tel:${lead.phone}`} className="hover:text-primary">{lead.phone}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar size={14} />
                      <span>{formatDate(lead.created_at)}</span>
                    </div>
                  </div>

                  {lead.notes && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-muted-foreground">{lead.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Edit Lead</DialogTitle></DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium">{selectedLead.name || "Unknown"}</p>
                  {selectedLead.email && <p className="text-sm text-muted-foreground">{selectedLead.email}</p>}
                  {selectedLead.phone && <p className="text-sm text-muted-foreground">{selectedLead.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={editData.status}
                    onChange={(e) => setEditData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full h-10 rounded-md border px-3"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editData.notes}
                    onChange={(e) => setEditData((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                    placeholder="Add notes about this lead..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedLead(null)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleUpdate}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminLeads;

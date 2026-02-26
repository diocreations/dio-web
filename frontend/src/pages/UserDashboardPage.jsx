import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  FileText, Download, Clock, LogOut, Trash2, Loader2,
  FileSearch, PenLine, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UserDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("pub_user");
    if (!stored) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(stored));
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const token = localStorage.getItem("pub_session_token");
    try {
      const res = await fetch(`${API_URL}/api/user/dashboard`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        navigate("/login");
        return;
      }
      setData(await res.json());
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("pub_session_token");
    await fetch(`${API_URL}/api/user/logout`, {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem("pub_user");
    localStorage.removeItem("pub_session_token");
    navigate("/login");
  };

  const handleDeleteData = async () => {
    if (!window.confirm("Delete ALL your data? This cannot be undone.")) return;
    const token = localStorage.getItem("pub_session_token");
    await fetch(`${API_URL}/api/user/data`, {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem("pub_user");
    localStorage.removeItem("pub_session_token");
    toast.success("All data deleted");
    navigate("/login");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </Layout>
    );
  }

  const analyses = data?.analyses || [];
  const coverLetters = data?.cover_letters || [];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="dashboard-heading">
              Welcome, {user?.name || user?.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="dashboard-logout">
              <LogOut size={16} className="mr-1" /> Logout
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteData} data-testid="dashboard-delete-data">
              <Trash2 size={16} className="mr-1" /> Delete Data
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link to="/resume-optimizer">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileSearch size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Optimize Resume</p>
                  <p className="text-xs text-muted-foreground">AI-powered analysis</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/cover-letter">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <PenLine size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Cover Letter</p>
                  <p className="text-xs text-muted-foreground">AI generator</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Card className="border-dashed">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Clock size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">24h Privacy</p>
                <p className="text-xs text-muted-foreground">Data auto-cleared</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resume Analyses */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4" data-testid="section-analyses">
            Resume Analyses ({analyses.length})
          </h2>
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText size={40} className="mx-auto mb-3 opacity-50" />
                <p>No analyses yet.</p>
                <Button asChild className="mt-3" size="sm">
                  <Link to="/resume-optimizer">Analyze Your Resume</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {analyses.map((a, i) => (
                <motion.div key={a.resume_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-primary" />
                        <div>
                          <p className="font-medium text-sm">{a.filename || "Resume"}</p>
                          <p className="text-xs text-muted-foreground">
                            Score: {a.overall_score}/100 | ATS: {a.ats_score}/100
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Cover Letters */}
        <section>
          <h2 className="text-lg font-semibold mb-4" data-testid="section-cover-letters">
            Cover Letters ({coverLetters.length})
          </h2>
          {coverLetters.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <PenLine size={40} className="mx-auto mb-3 opacity-50" />
                <p>No cover letters yet.</p>
                <Button asChild className="mt-3" size="sm">
                  <Link to="/cover-letter">Create a Cover Letter</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {coverLetters.map((cl, i) => (
                <motion.div key={cl.letter_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PenLine size={20} className="text-primary" />
                        <div>
                          <p className="font-medium text-sm">
                            {cl.job_title || "Cover Letter"} {cl.company_name ? `@ ${cl.company_name}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">Tone: {cl.tone}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cl.created_at ? new Date(cl.created_at).toLocaleDateString() : ""}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default UserDashboardPage;

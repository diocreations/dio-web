import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  FileText, Download, Clock, LogOut, Trash2, Loader2, FileSearch, PenLine,
  ChevronRight, CheckCircle, XCircle, CreditCard, Share2, Copy, Gift, BarChart3,
  Send, Mail,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UserDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [referralCode, setReferralCode] = useState(null);
  const [activeTab, setActiveTab] = useState("resumes");

  useEffect(() => {
    const stored = localStorage.getItem("pub_user");
    if (!stored) { navigate("/login"); return; }
    setUser(JSON.parse(stored));
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const token = localStorage.getItem("pub_session_token");
    try {
      const res = await fetch(`${API_URL}/api/user/dashboard`, {
        credentials: "include", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { navigate("/login"); return; }
      const d = await res.json();
      setData(d);
      setReferralCode(d.referral);
    } catch { navigate("/login"); }
    finally { setLoading(false); }
  };

  const generateReferralCode = async () => {
    const token = localStorage.getItem("pub_session_token");
    try {
      const res = await fetch(`${API_URL}/api/referral/my-code`, {
        credentials: "include", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const code = await res.json();
        setReferralCode(code);
        toast.success("Your referral code is ready!");
      }
    } catch { toast.error("Failed to generate code"); }
  };

  const copyReferralLink = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/resume-optimizer?ref=${referralCode.code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  
  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setSendingInvite(true);
    const token = localStorage.getItem("pub_session_token");
    try {
      const res = await fetch(`${API_URL}/api/user/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Invitation sent!");
        setInviteEmail("");
      } else {
        toast.error(data.detail || "Failed to send invitation");
      }
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("pub_session_token");
    await fetch(`${API_URL}/api/user/logout`, {
      method: "POST", credentials: "include", headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem("pub_user");
    localStorage.removeItem("pub_session_token");
    navigate("/login");
  };

  const handleDeleteData = async () => {
    if (!window.confirm("Delete ALL your data? This cannot be undone.")) return;
    const token = localStorage.getItem("pub_session_token");
    await fetch(`${API_URL}/api/user/data`, {
      method: "DELETE", credentials: "include", headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.removeItem("pub_user");
    localStorage.removeItem("pub_session_token");
    toast.success("All data deleted");
    navigate("/login");
  };

  if (loading) {
    return (<Layout><div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin" size={32} /></div></Layout>);
  }

  const resumeHistory = data?.resume_history || [];
  const payments = data?.payments || [];
  const coverLetters = data?.cover_letters || [];
  const stats = data?.stats || {};

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary" data-testid="stat-resumes">{stats.total_resumes || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Resumes Uploaded</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600" data-testid="stat-paid">{stats.total_paid || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Paid Downloads</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600" data-testid="stat-analyses">{stats.total_analyses || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">AI Analyses</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600" data-testid="stat-cover-letters">{stats.total_cover_letters || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Cover Letters</p>
          </CardContent></Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link to="/resume-optimizer">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><FileSearch size={20} className="text-primary" /></div>
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
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><PenLine size={20} className="text-primary" /></div>
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
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Clock size={20} className="text-muted-foreground" /></div>
              <div className="flex-1">
                <p className="font-medium text-sm">24h Privacy</p>
                <p className="text-xs text-muted-foreground">Data auto-cleared</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-fit mb-6">
            <TabsTrigger value="resumes" data-testid="tab-resumes"><FileText size={14} className="mr-1.5" /> Resumes</TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments"><CreditCard size={14} className="mr-1.5" /> Payments</TabsTrigger>
            <TabsTrigger value="cover-letters" data-testid="tab-cover-letters"><PenLine size={14} className="mr-1.5" /> Letters</TabsTrigger>
            <TabsTrigger value="referral" data-testid="tab-referral"><Gift size={14} className="mr-1.5" /> Referral</TabsTrigger>
          </TabsList>

          {/* Resume History */}
          <TabsContent value="resumes">
            <h2 className="text-lg font-semibold mb-4" data-testid="section-resume-history">Resume History ({resumeHistory.length})</h2>
            {resumeHistory.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <FileText size={40} className="mx-auto mb-3 opacity-50" />
                <p>No resumes yet.</p>
                <Button asChild className="mt-3" size="sm"><Link to="/resume-optimizer">Analyze Your Resume</Link></Button>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {resumeHistory.map((r, i) => (
                  <motion.div key={r.resume_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-primary flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{r.filename || "Resume"}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              {r.overall_score != null && <span className="text-xs text-muted-foreground">Score: {r.overall_score}/100</span>}
                              {r.ats_score != null && <span className="text-xs text-muted-foreground">ATS: {r.ats_score}/100</span>}
                              {r.word_count > 0 && <span className="text-xs text-muted-foreground">{r.word_count} words</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {r.is_paid ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full" data-testid={`paid-badge-${r.resume_id}`}>
                              <CheckCircle size={12} /> Paid {r.currency && `${r.currency} ${r.amount}`}
                            </span>
                          ) : r.has_improvement ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                              <XCircle size={12} /> Unpaid
                            </span>
                          ) : null}
                          <span className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
                          <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                            <Link to={`/resume-optimizer?resume_id=${r.resume_id}`}>Open</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Payment History */}
          <TabsContent value="payments">
            <h2 className="text-lg font-semibold mb-4" data-testid="section-payments">Payment History ({payments.length})</h2>
            {payments.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <CreditCard size={40} className="mx-auto mb-3 opacity-50" />
                <p>No payments yet.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {payments.map((p, i) => (
                  <motion.div key={p.session_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <CreditCard size={20} className={p.status === "paid" ? "text-green-600" : "text-amber-500"} />
                          <div>
                            <p className="font-medium text-sm">Resume Optimizer</p>
                            <p className="text-xs text-muted-foreground">ID: {(p.session_id || "").slice(-8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-bold ${p.status === "paid" ? "text-green-700" : "text-amber-600"}`}>
                            {p.currency || "EUR"} {p.amount || "0.00"}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                            {p.status === "paid" ? "Paid" : "Pending"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Cover Letters */}
          <TabsContent value="cover-letters">
            <h2 className="text-lg font-semibold mb-4" data-testid="section-cover-letters">Cover Letters ({coverLetters.length})</h2>
            {coverLetters.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <PenLine size={40} className="mx-auto mb-3 opacity-50" />
                <p>No cover letters yet.</p>
                <Button asChild className="mt-3" size="sm"><Link to="/cover-letter">Create a Cover Letter</Link></Button>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {coverLetters.map((cl, i) => (
                  <motion.div key={cl.letter_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PenLine size={20} className="text-primary" />
                          <div>
                            <p className="font-medium text-sm">{cl.job_title || "Cover Letter"} {cl.company_name ? `@ ${cl.company_name}` : ""}</p>
                            <p className="text-xs text-muted-foreground">Tone: {cl.tone}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{cl.created_at ? new Date(cl.created_at).toLocaleDateString() : ""}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Referral Program */}
          <TabsContent value="referral">
            <h2 className="text-lg font-semibold mb-4" data-testid="section-referral">Referral & Invitations</h2>
            
            {/* Invite Friend Card */}
            <Card className="mb-4 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Send size={18} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Invite a Friend</h3>
                    <p className="text-xs text-muted-foreground">Send an email invitation directly</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-white"
                    data-testid="invite-email-input"
                  />
                  <Button
                    onClick={handleSendInvite}
                    disabled={sendingInvite || !inviteEmail.includes("@")}
                    className="bg-violet-600 hover:bg-violet-700"
                    data-testid="send-invite-btn"
                  >
                    {sendingInvite ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10">
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Gift size={24} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Share & Earn</h3>
                  <p className="text-muted-foreground text-sm mt-1">Share your unique link. Friends get 20% off, you earn rewards!</p>
                </div>

                {referralCode ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
                        <p className="text-lg font-mono font-bold text-primary" data-testid="referral-code">{referralCode.code}</p>
                      </div>
                      <Button onClick={copyReferralLink} variant="outline" size="sm" className="rounded-full" data-testid="copy-referral-link">
                        <Copy size={14} className="mr-1.5" /> Copy Link
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-700">{referralCode.use_count || 0}</p>
                        <p className="text-xs text-green-600 mt-1">Times Used</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-700">EUR {(referralCode.earnings || 0).toFixed(2)}</p>
                        <p className="text-xs text-blue-600 mt-1">Earnings</p>
                      </div>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">How it works:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-start gap-2"><Share2 size={14} className="mt-0.5 text-primary flex-shrink-0" /> Share your link with friends</li>
                        <li className="flex items-start gap-2"><Gift size={14} className="mt-0.5 text-primary flex-shrink-0" /> They get 20% off their first purchase</li>
                        <li className="flex items-start gap-2"><BarChart3 size={14} className="mt-0.5 text-primary flex-shrink-0" /> You earn 10% reward on each referral</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button onClick={generateReferralCode} className="rounded-full" data-testid="generate-referral-btn">
                      <Gift size={16} className="mr-2" /> Get Your Referral Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserDashboardPage;

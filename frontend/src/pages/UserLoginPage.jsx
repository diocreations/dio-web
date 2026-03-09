import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Loader2, Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UserLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteValid, setInviteValid] = useState(null); // null = not checked, true/false = result

  // Handle invitation token in URL
  useEffect(() => {
    const invite = searchParams.get("invite");
    const emailParam = searchParams.get("email");
    
    if (invite) {
      setInviteToken(invite);
      setTab("signup"); // Switch to signup tab for invitations
      
      // If email is in URL, pre-fill it
      if (emailParam) {
        const decodedEmail = decodeURIComponent(emailParam);
        setInviteEmail(decodedEmail);
        setForm(f => ({ ...f, email: decodedEmail }));
      }
      
      // Verify invitation token
      fetch(`${API_URL}/api/invitation/verify/${invite}`)
        .then(r => r.json())
        .then(data => {
          if (data.valid) {
            setInviteValid(true);
            if (data.email) {
              setInviteEmail(data.email);
              setForm(f => ({ ...f, email: data.email }));
            }
            toast.success(`Welcome! This invitation is for ${data.email || emailParam}`);
          } else {
            setInviteValid(false);
            toast.error(data.message || "Invalid or expired invitation");
          }
        })
        .catch(() => {
          setInviteValid(false);
          toast.error("Could not verify invitation");
        });
    }
  }, [searchParams]);

  // Handle Google OAuth callback (session_id in URL fragment)
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      setGoogleLoading(true);
      fetch(`${API_URL}/api/user/google-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ session_id: sessionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.session_token) {
            localStorage.setItem("pub_user", JSON.stringify(data));
            localStorage.setItem("pub_session_token", data.session_token);
            toast.success("Signed in with Google!");
            
            // Mark invitation as accepted if we have one
            if (inviteToken) {
              fetch(`${API_URL}/api/invitation/accept/${inviteToken}`, { method: "POST" }).catch(() => {});
            }
            
            navigate("/dashboard");
          } else {
            toast.error(data.detail || "Google sign-in failed");
          }
        })
        .catch(() => toast.error("Google sign-in failed"))
        .finally(() => setGoogleLoading(false));
    }
  }, [searchParams, navigate, inviteToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate invitation email if signing up with invitation
    if (tab === "signup" && inviteToken && inviteEmail) {
      if (form.email.toLowerCase().trim() !== inviteEmail.toLowerCase().trim()) {
        toast.error(`This invitation is only valid for ${inviteEmail}. Please use the invited email address.`);
        return;
      }
    }
    
    setLoading(true);
    const endpoint = tab === "login" ? "/api/user/login" : "/api/user/register";
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed. Please try again.");
      localStorage.setItem("pub_user", JSON.stringify(data));
      localStorage.setItem("pub_session_token", data.session_token);
      
      // Mark invitation as accepted
      if (inviteToken && tab === "signup") {
        fetch(`${API_URL}/api/invitation/accept/${inviteToken}`, { method: "POST" }).catch(() => {});
      }
      
      toast.success(tab === "login" ? "Welcome back!" : "Account created!");
      navigate("/dashboard");
    } catch (err) {
      // Handle network errors with user-friendly messages
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        toast.error("Unable to connect to server. Please check your internet connection and try again.");
      } else if (err.message.includes("NetworkError")) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = `${window.location.origin}/login`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: forgotEmail,
          origin_url: window.location.origin 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setForgotSent(true);
      toast.success("Check your email for reset instructions");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  if (googleLoading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4" size={32} />
            <p className="text-muted-foreground">Signing in with Google...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <button
                  onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail(""); }}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                  data-testid="back-to-login"
                >
                  <ArrowLeft size={14} /> Back to login
                </button>
                
                {forgotSent ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
                    <p className="text-muted-foreground text-sm mb-4">
                      If an account exists with <span className="font-medium">{forgotEmail}</span>, you'll receive a password reset link shortly.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Don't see it? Check your spam folder or try again.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => { setForgotSent(false); setForgotEmail(""); }}
                    >
                      Try another email
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold">Reset Your Password</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        Enter your email and we'll send you a reset link
                      </p>
                    </div>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <Label htmlFor="forgot-email">Email Address</Label>
                        <div className="relative mt-1">
                          <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-10"
                            required
                            data-testid="forgot-email-input"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={forgotLoading} data-testid="forgot-submit">
                        {forgotLoading ? (
                          <><Loader2 className="animate-spin mr-2" size={16} /> Sending...</>
                        ) : (
                          <>Send Reset Link</>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold" data-testid="login-heading">Diocreations Login</h1>
            <p className="text-muted-foreground mt-2">Access your resume analyses, cover letters, and more</p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              {/* Google Sign In */}
              <Button
                variant="outline"
                className="w-full mb-4 h-11 relative"
                onClick={handleGoogleSignIn}
                data-testid="google-signin-btn"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-muted-foreground">or</span></div>
              </div>

              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login" data-testid="tab-login">
                    <LogIn size={16} className="mr-2" /> Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" data-testid="tab-register">
                    <UserPlus size={16} className="mr-2" /> Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative mt-1">
                        <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input id="login-email" type="email" placeholder="you@example.com" className="pl-10" required data-testid="login-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                          data-testid="forgot-password-link"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative mt-1">
                        <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input id="login-password" type="password" placeholder="Enter password" className="pl-10" required data-testid="login-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit">
                      {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <LogIn size={16} className="mr-2" />}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Invitation notice */}
                    {inviteToken && inviteEmail && (
                      <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg text-sm">
                        <p className="text-violet-700 font-medium">🎉 You've been invited!</p>
                        <p className="text-violet-600 text-xs mt-1">This invitation is for <strong>{inviteEmail}</strong></p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="reg-name">Name</Label>
                      <div className="relative mt-1">
                        <User size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input id="reg-name" placeholder="Your name" className="pl-10" data-testid="register-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reg-email">Email</Label>
                      <div className="relative mt-1">
                        <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input 
                          id="reg-email" 
                          type="email" 
                          placeholder="you@example.com" 
                          className={`pl-10 ${inviteToken && inviteEmail ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                          required 
                          data-testid="register-email" 
                          value={form.email} 
                          onChange={(e) => {
                            // If invitation, prevent changing email
                            if (inviteToken && inviteEmail) {
                              toast.error(`You can only sign up with ${inviteEmail}`);
                              return;
                            }
                            setForm({ ...form, email: e.target.value });
                          }}
                          readOnly={!!(inviteToken && inviteEmail)}
                        />
                      </div>
                      {inviteToken && inviteEmail && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Email is locked to the invited address
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="reg-password">Password</Label>
                      <div className="relative mt-1">
                        <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input id="reg-password" type="password" placeholder="Min 6 characters" className="pl-10" required minLength={6} data-testid="register-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || (inviteToken && inviteValid === false)} data-testid="register-submit">
                      {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <UserPlus size={16} className="mr-2" />}
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <p className="text-xs text-center text-muted-foreground mt-6">
                Your data is automatically cleared after 24 hours for privacy.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default UserLoginPage;

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/api/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to reset password");
      }
      
      setSuccess(true);
      toast.success("Password reset successful!");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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
              {success ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Password Reset Complete</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Your password has been successfully reset. You can now log in with your new password.
                  </p>
                  <Button onClick={() => navigate("/login")} className="w-full" data-testid="go-to-login">
                    Go to Login
                  </Button>
                </div>
              ) : error && !token ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="text-red-600" size={32} />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Invalid Reset Link</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    {error}
                  </p>
                  <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="text-primary" size={24} />
                    </div>
                    <h2 className="text-xl font-bold">Set New Password</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Enter your new password below
                    </p>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative mt-1">
                        <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min 6 characters"
                          className="pl-10 pr-10"
                          required
                          minLength={6}
                          data-testid="new-password-input"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative mt-1">
                        <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Repeat password"
                          className="pl-10"
                          required
                          data-testid="confirm-password-input"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="text-red-500 text-xs">Passwords do not match</p>
                    )}
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || password !== confirmPassword}
                      data-testid="reset-password-submit"
                    >
                      {loading ? (
                        <><Loader2 className="animate-spin mr-2" size={16} /> Resetting...</>
                      ) : (
                        <>Reset Password</>
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
};

export default ResetPasswordPage;

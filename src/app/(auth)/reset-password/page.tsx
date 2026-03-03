"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (token) {
    return <NewPasswordForm token={token} />;
  }

  return <RequestResetForm />;
}

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send reset email");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-6 text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          If an account exists for {email}, we sent a password reset link.
        </p>
        <Link href="/signin">
          <Button variant="outline" className="w-full">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we will send you a reset link
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/signin" className="text-foreground font-medium underline underline-offset-4">Sign in</Link>
      </p>
    </div>
  );
}

function NewPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-6 text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
        <h1 className="text-2xl font-bold">Password reset</h1>
        <p className="text-sm text-muted-foreground">Your password has been updated successfully.</p>
        <Link href="/signin">
          <Button className="w-full">Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password below</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !password || !confirmPassword}>
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
          Reset password
        </Button>
      </form>
    </div>
  );
}

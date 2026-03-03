"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { AUTH_ERROR_MESSAGES } from "@/lib/constants";
import { Github, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleOAuth = async (provider: string) => {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setLoading(null);
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading("credentials");
    setAuthError(null);

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password");
      setLoading(null);
    } else if (result?.ok) {
      window.location.href = callbackUrl;
    } else {
      setLoading(null);
    }
  };

  const displayError = authError || (error ? (AUTH_ERROR_MESSAGES[error] || "Something went wrong. Please try again.") : null);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      {displayError && (
        <Alert variant="destructive">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Button variant="outline" className="w-full h-11" onClick={() => handleOAuth("google")} disabled={loading !== null}>
          {loading === "google" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FcGoogle className="w-4 h-4 mr-2" />}
          Continue with Google
        </Button>
        <Button variant="outline" className="w-full h-11" onClick={() => handleOAuth("github")} disabled={loading !== null}>
          {loading === "github" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Github className="w-4 h-4 mr-2" />}
          Continue with GitHub
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form onSubmit={handleCredentials} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/reset-password" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
        <Button type="submit" className="w-full" disabled={loading !== null || !email.trim() || !password}>
          {loading === "credentials" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="text-foreground font-medium underline underline-offset-4">Sign up</Link>
      </p>
    </div>
  );
}

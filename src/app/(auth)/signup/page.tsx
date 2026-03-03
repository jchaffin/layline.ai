"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Github, Loader2, Eye, EyeOff, UserPlus } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";

export default function SignUpPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: string) => {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      setLoading(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading("register");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(null);
        return;
      }

      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = "/dashboard";
      } else {
        setError("Account created. Please sign in.");
        setLoading(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-muted-foreground">Start practicing interviews in under a minute</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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

      <form onSubmit={handleRegister} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
        <Button type="submit" className="w-full" disabled={loading !== null || !email.trim() || !password || !confirmPassword}>
          {loading === "register" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/signin" className="text-foreground font-medium underline underline-offset-4">Sign in</Link>
      </p>
    </div>
  );
}

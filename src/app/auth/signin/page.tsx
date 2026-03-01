"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Github, Mail, ArrowLeft, Briefcase } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleProviderSignIn = async (providerId: string) => {
    setIsLoading(true);
    try {
      await signIn(providerId, { callbackUrl });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    try {
      // For now, we'll redirect to OAuth. Later can add email/password or magic links
      await signIn("google", { callbackUrl });
    } catch (error) {
      console.error("Email sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "OAuthSignin":
        return "Error occurred during OAuth sign-in. Please try again.";
      case "OAuthCallback":
        return "OAuth callback error. Please try signing in again.";
      case "OAuthCreateAccount":
        return "Could not create OAuth account. Please try again.";
      case "EmailCreateAccount":
        return "Could not create account with email. Please try again.";
      case "Callback":
        return "Callback error. Please try again.";
      case "OAuthAccountNotLinked":
        return "Account already exists with different provider. Please sign in with your original provider.";
      case "EmailSignin":
        return "Check your email for the sign-in link.";
      case "CredentialsSignin":
        return "Invalid credentials. Please check your email and password.";
      case "SessionRequired":
        return "Please sign in to access this page.";
      default:
        return "An error occurred during sign-in. Please try again.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Layline</h1>
          <p className="text-gray-600">Sign in to access your personalized job search dashboard</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {getErrorMessage(error)}
                </AlertDescription>
              </Alert>
            )}

            {/* OAuth Providers */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleProviderSignIn("google")}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 h-11"
              >
                <Mail className="w-5 h-5" />
                <span>Continue with Google</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleProviderSignIn("github")}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 h-11"
              >
                <Github className="w-5 h-5" />
                <span>Continue with GitHub</span>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                Continue with Email
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link 
                href="/auth/signup" 
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

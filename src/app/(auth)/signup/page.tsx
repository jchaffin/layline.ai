"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Github, Mail, ArrowLeft, Briefcase, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleProviderSignUp = async (providerId: string) => {
    if (!acceptTerms) {
      alert("Please accept the terms and conditions to continue.");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(providerId, { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !acceptTerms) return;
    
    setIsLoading(true);
    try {
      // For now, redirect to Google OAuth. Later can add proper email signup
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Email sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "AI-powered resume optimization",
    "Smart job matching and recommendations",
    "Interview preparation and practice",
    "Real-time interview assistance",
    "Application tracking and management",
    "Personalized career insights"
  ];

  return (
    <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-center p-4">
        
        {/* Left Side - Features */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <div className="bg-blue-600 p-4 rounded-full">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Launch Your <span className="text-blue-600">Dream Career</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Join thousands of job seekers who've accelerated their career with our AI-powered platform
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Create Account</CardTitle>
              <CardDescription className="text-center">
                Get started with your free Layline account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* OAuth Providers */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => handleProviderSignUp("google")}
                  disabled={isLoading || !acceptTerms}
                  className="w-full flex items-center justify-center space-x-2 h-11"
                >
                  <Mail className="w-5 h-5" />
                  <span>Sign up with Google</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleProviderSignUp("github")}
                  disabled={isLoading || !acceptTerms}
                  className="w-full flex items-center justify-center space-x-2 h-11"
                >
                  <Github className="w-5 h-5" />
                  <span>Sign up with GitHub</span>
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
              <form onSubmit={handleEmailSignUp} className="space-y-3">
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

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <div className="text-sm leading-5">
                    <label htmlFor="terms" className="cursor-pointer">
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !email || !acceptTerms}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Create Account
                </Button>
              </form>

              {/* Sign In Link */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link 
                  href="/auth/signin" 
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center mt-6">
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

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, LogIn } from "lucide-react";
import Link from "next/link";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600 p-4 rounded-full">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Sign in Required</h1>
            <p className="text-gray-600">
              You need to sign in to access your JobLaunch dashboard
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center space-y-4 py-8">
              <p className="text-center text-gray-600">
                Access your personalized job search tools, saved resumes, and application tracking.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button asChild className="flex-1">
                  <Link href="/auth/signin">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/auth/signup">
                    Create Account
                  </Link>
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <Link href="/" className="hover:text-gray-700">
                  ← Back to home
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}

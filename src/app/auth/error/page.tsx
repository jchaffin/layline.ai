"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorDetails = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Server Configuration Error",
          description: "There is a problem with the server configuration. Please contact support.",
          canRetry: false,
        };
      case "AccessDenied":
        return {
          title: "Access Denied",
          description: "You do not have permission to sign in. Please contact support if you believe this is an error.",
          canRetry: false,
        };
      case "Verification":
        return {
          title: "Verification Failed",
          description: "The verification token has expired or is invalid. Please try signing in again.",
          canRetry: true,
        };
      case "OAuthSignin":
        return {
          title: "OAuth Sign-in Error",
          description: "There was an error during the OAuth sign-in process. Please try again.",
          canRetry: true,
        };
      case "OAuthCallback":
        return {
          title: "OAuth Callback Error",
          description: "There was an error processing the OAuth callback. Please try signing in again.",
          canRetry: true,
        };
      case "OAuthCreateAccount":
        return {
          title: "Account Creation Failed",
          description: "Unable to create your account. Please try again or contact support.",
          canRetry: true,
        };
      case "EmailCreateAccount":
        return {
          title: "Email Account Creation Failed",
          description: "Unable to create an account with this email. Please try a different method.",
          canRetry: true,
        };
      case "Callback":
        return {
          title: "Callback Error",
          description: "There was an error during authentication. Please try again.",
          canRetry: true,
        };
      case "OAuthAccountNotLinked":
        return {
          title: "Account Already Exists",
          description: "An account already exists with this email using a different sign-in method. Please sign in with your original provider.",
          canRetry: true,
        };
      case "EmailSignin":
        return {
          title: "Email Sign-in Error",
          description: "Unable to send sign-in email. Please check your email address and try again.",
          canRetry: true,
        };
      case "CredentialsSignin":
        return {
          title: "Invalid Credentials",
          description: "The credentials you provided are incorrect. Please check and try again.",
          canRetry: true,
        };
      case "SessionRequired":
        return {
          title: "Session Required",
          description: "You must be signed in to access this page.",
          canRetry: true,
        };
      default:
        return {
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication. Please try again.",
          canRetry: true,
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Authentication Error</h1>
        <p className="text-gray-600">Something went wrong during sign-in</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-red-700">{errorDetails.title}</CardTitle>
          <CardDescription>{errorDetails.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error ? `Error Code: ${error}` : "Unknown error occurred"}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {errorDetails.canRetry && (
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
            )}
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/signup">
                Create New Account
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>Still having trouble?</p>
            <Link 
              href="/support" 
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Contact Support
            </Link>
          </div>
        </CardContent>
      </Card>

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
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}

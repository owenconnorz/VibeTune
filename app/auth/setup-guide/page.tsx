import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function SetupGuidePage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/auth/signin">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-4">Google OAuth Setup Guide</h1>
        <p className="text-muted-foreground mb-8">Follow these steps to configure Google authentication for OpenTune</p>

        <Alert className="mb-8">
          <AlertTitle>Common Error: redirect_uri_mismatch</AlertTitle>
          <AlertDescription>
            This error occurs when the redirect URI in your Google Cloud Console doesn't match the one used by OpenTune.
            Follow the steps below to fix it.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Create a Google Cloud Project</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>
                    Go to{" "}
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Google Cloud Console
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Create a new project or select an existing one</li>
                  <li>Enable the Google+ API for your project</li>
                </ol>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Configure OAuth Consent Screen</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to "APIs & Services" → "OAuth consent screen"</li>
                  <li>Select "External" user type and click "Create"</li>
                  <li>
                    Fill in the required fields:
                    <ul className="list-disc list-inside ml-6 mt-2">
                      <li>App name: OpenTune</li>
                      <li>User support email: Your email</li>
                      <li>Developer contact: Your email</li>
                    </ul>
                  </li>
                  <li>Click "Save and Continue" through the remaining steps</li>
                </ol>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Create OAuth Credentials</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to "APIs & Services" → "Credentials"</li>
                  <li>Click "Create Credentials" → "OAuth client ID"</li>
                  <li>Select "Web application" as the application type</li>
                  <li>
                    Add authorized redirect URIs:
                    <div className="mt-2 space-y-2">
                      <div className="bg-muted p-3 rounded-md font-mono text-sm">
                        http://localhost:3000/api/auth/callback/google
                      </div>
                      <div className="bg-muted p-3 rounded-md font-mono text-sm">
                        https://your-production-domain.com/api/auth/callback/google
                      </div>
                    </div>
                  </li>
                  <li>Click "Create"</li>
                </ol>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Add Environment Variables</h2>
                <p className="text-muted-foreground mb-4">
                  Copy the Client ID and Client Secret from Google Cloud Console and add them to your environment
                  variables:
                </p>
                <div className="bg-muted p-4 rounded-md font-mono text-sm space-y-2">
                  <div>GOOGLE_CLIENT_ID=your_client_id_here</div>
                  <div>GOOGLE_CLIENT_SECRET=your_client_secret_here</div>
                  <div>NEXTAUTH_URL=http://localhost:3000</div>
                  <div>NEXTAUTH_SECRET=your_random_secret_here</div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Generate a random secret using:{" "}
                  <code className="bg-muted px-2 py-1 rounded">openssl rand -base64 32</code>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">You're All Set!</h2>
                <p className="text-muted-foreground mb-4">
                  After completing these steps, restart your development server and try signing in again.
                </p>
                <Link href="/auth/signin">
                  <Button>Try Signing In</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">Still Having Issues?</h3>
          <p className="text-sm text-muted-foreground mb-4">Common troubleshooting steps:</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Make sure the redirect URI exactly matches (including http/https and trailing slashes)</li>
            <li>Wait a few minutes after adding the redirect URI for changes to propagate</li>
            <li>Check that all environment variables are set correctly</li>
            <li>Restart your development server after changing environment variables</li>
            <li>Clear your browser cookies and try again</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

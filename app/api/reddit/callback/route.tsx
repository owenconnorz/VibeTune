export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams

    // Check if this is demo mode
    if (searchParams.get("demo") === "true") {
      return new Response(
        `
        <html>
          <head><title>Reddit Auth Demo</title></head>
          <body>
            <script>
              window.parent.postMessage({
                type: 'REDDIT_AUTH_SUCCESS',
                token: 'demo_token_' + Date.now(),
                demo: true
              }, '*');
            </script>
            <p>Demo authentication successful. This window will close.</p>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return new Response(
        `
        <html>
          <head><title>Reddit Auth Error</title></head>
          <body>
            <script>
              window.parent.postMessage({
                type: 'REDDIT_AUTH_ERROR',
                error: '${error}'
              }, '*');
            </script>
            <p>Authentication error: ${error}. This window will close.</p>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    if (!code) {
      return new Response(
        `
        <html>
          <head><title>Reddit Auth</title></head>
          <body>
            <script>
              window.parent.postMessage({
                type: 'REDDIT_AUTH_ERROR',
                error: 'no_code'
              }, '*');
            </script>
            <p>No authorization code received. This window will close.</p>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    // Exchange code for token
    const tokenResponse = await fetch("/api/reddit/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json()
      return new Response(
        `
        <html>
          <head><title>Reddit Auth Success</title></head>
          <body>
            <script>
              window.parent.postMessage({
                type: 'REDDIT_AUTH_SUCCESS',
                token: '${tokenData.access_token}',
                expires_in: ${tokenData.expires_in}
              }, '*');
            </script>
            <p>Authentication successful! This window will close.</p>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      )
    } else {
      throw new Error("Token exchange failed")
    }
  } catch (error) {
    console.error("[v0] Reddit callback error:", error)
    return new Response(
      `
      <html>
        <head><title>Reddit Auth Error</title></head>
        <body>
          <script>
            window.parent.postMessage({
              type: 'REDDIT_AUTH_ERROR',
              error: 'callback_error'
            }, '*');
          </script>
          <p>Authentication failed. This window will close.</p>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    )
  }
}

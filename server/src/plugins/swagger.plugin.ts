import { swaggerOptions } from "@/config/swagger";

function generateScalarHtml(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bakaya API Documentation</title>
  <style>body { margin: 0; }</style>
</head>
<body>
  <script id="api-reference" data-url="${baseUrl}/api-docs/openapi.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
}

export async function handleSwaggerRoute(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ? `${forwardedProto}:` : url.protocol;

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host") || url.host;
  const baseUrl = `${protocol}//${host}`;

  // Serve Scalar API Reference HTML
  if (pathname === "/api-docs" || pathname === "/api-docs/") {
    return new Response(generateScalarHtml(baseUrl), {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
      },
    });
  }

  // Serve OpenAPI spec
  if (pathname === "/api-docs/openapi.json") {
    return Response.json(swaggerOptions, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  }

  return null;
}

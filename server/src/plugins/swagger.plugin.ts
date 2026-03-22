import { swaggerOptions } from "@/config/swagger";
import path from "path";

// Get the swagger-ui-dist path
const swaggerUiPath = path.dirname(require.resolve("swagger-ui-dist/package.json"));

// Generate Swagger UI HTML with proper base URL handling
function generateSwaggerHtml(baseUrl: string, isHttps: boolean = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${isHttps ? '<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">' : ''}
  <title>Bakaya API Documentation</title>
  <link rel="stylesheet" href="${baseUrl}/api-docs/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${baseUrl}/api-docs/swagger-ui-bundle.js"></script>
  <script src="${baseUrl}/api-docs/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '${baseUrl}/api-docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        tryItOutEnabled: true,
      });
    };
  </script>
</body>
</html>`;
}

// Map of static files from swagger-ui-dist
const staticFiles: Record<string, { file: string; contentType: string }> = {
  "swagger-ui.css": { file: "swagger-ui.css", contentType: "text/css" },
  "swagger-ui-bundle.js": { file: "swagger-ui-bundle.js", contentType: "application/javascript" },
  "swagger-ui-standalone-preset.js": { file: "swagger-ui-standalone-preset.js", contentType: "application/javascript" },
};

export async function handleSwaggerRoute(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Get base URL from request (handles port forwarding and reverse proxies like ngrok)
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ? `${forwardedProto}:` : url.protocol;

  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host") || url.host;
  const baseUrl = `${protocol}//${host}`;

  // Serve Swagger UI HTML
  if (pathname === "/api-docs" || pathname === "/api-docs/") {
    const isHttps = protocol === "https:" || forwardedProto === "https";

    return new Response(generateSwaggerHtml(baseUrl, isHttps), {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache",
        ...(isHttps && {
          "Content-Security-Policy": "upgrade-insecure-requests",
        }),
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

  // Serve static files from swagger-ui-dist
  const fileName = pathname.replace("/api-docs/", "");
  const staticFile = staticFiles[fileName];

  if (staticFile) {
    const filePath = path.join(swaggerUiPath, staticFile.file);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: {
          "Content-Type": staticFile.contentType,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    }
  }

  return null;
}

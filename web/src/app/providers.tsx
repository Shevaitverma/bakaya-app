"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && [401, 403].includes(error.status)) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  // Register the service worker on boot so the app is installable — Chrome only
  // offers to install once one is active. This does NOT prompt for notification
  // permission; registerWebPush() later reuses this same registration. Imported
  // lazily to keep the Firebase SDK out of the root bundle.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    import("@/lib/push")
      .then(({ serviceWorkerUrl }) => navigator.serviceWorker.register(serviceWorkerUrl()))
      .catch((err) => console.warn("[sw] registration failed", err));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

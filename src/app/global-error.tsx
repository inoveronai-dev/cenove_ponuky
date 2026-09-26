"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="sk">
      <body className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Niečo sa pokazilo</h1>
          <p className="mt-3 text-sm text-stone-600">
            Skúste obnoviť stránku. Ak ste na 127.0.0.1, otvorte radšej{" "}
            <a className="underline" href="http://localhost:3000">
              http://localhost:3000
            </a>
            .
          </p>
          <Button className="mt-6" onClick={() => reset()}>
            Skúsiť znova
          </Button>
        </div>
      </body>
    </html>
  );
}

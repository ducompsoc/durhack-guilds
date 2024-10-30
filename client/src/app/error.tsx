"use client";

import React from "react";
import Image from "next/image";

export default function Home({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <>
      <div className="h-full flex flex-col text-black dark:text-neutral-200 font-semibold justify-center px-6 py-12 lg:px-8">
        <div className="flex flex-row py-4 px-6 items-center justify-center mb-4">
          <Image src="/logo.svg" alt="DurHack Logo" width={64} height={64} />
          <h1 className="text-4xl font-bold ml-4 font-heading uppercase">DurHack</h1>
        </div>
        <p className="text-center mb-6">Something didn't work, please try again.</p>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm space-y-6">
          <button
            onClick={reset}
            className="flex w-full justify-center rounded-md bg-accent px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-400 hover:text-black"
          >
            Try Again
          </button>
        </div>
      </div>
    </>
  );
}

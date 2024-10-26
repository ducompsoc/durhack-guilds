import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="h-full flex flex-col text-black dark:text-neutral-200 font-semibold justify-center px-6 py-12 lg:px-8">
        <div className="flex flex-row py-4 px-6 items-center justify-center mb-4">
          <Image src="/logo.png" alt="DurHack Logo" width={64} height={64} />
          <h1 className="text-4xl font-bold ml-4 font-heading">DURHACK</h1>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm space-y-6">
          <Link
            href="/api/auth/keycloak/login"
            className="flex w-full justify-center rounded-md bg-accent px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-400 hover:text-black"
          >
            Sign In
          </Link>
        </div>
      </div>
    </>
  );
}

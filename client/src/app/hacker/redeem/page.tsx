"use client";

import { fetchMegateamsApi } from "@/app/lib/api";
import {
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RedeemPage() {
  const [qrPoints, setQrPoints] = useState<number | null>(null);
  const [qrChecked, setQrChecked] = useState(false);
  const searchParams = useSearchParams();

  async function tryRedeemQR() {
    const uuid = searchParams.get("qr_id");
    if (uuid) {
      try {
        const result = await fetchMegateamsApi("/qr_codes/redeem", {
          method: "POST",
          body: JSON.stringify({ uuid }),
          headers: { "Content-Type": "application/json" },
        });
        setQrPoints(result.points);
      } catch {}
    }
    setQrChecked(true);
  }

  useEffect(() => {
    tryRedeemQR();
  }, [searchParams]);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-y-10 text-center">
      {qrChecked ? (
        <>
          {qrPoints ? (
            <>
              <div className="mx-auto flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckIcon
                  className="h-12 w-12 text-green-500"
                  aria-hidden="true"
                />
              </div>
              <p className="text-lg">QR Redeemed Successfully!</p>
              <p>
                You've gained
                <span className="font-bold">
                  {" " + qrPoints + (qrPoints > 1 ? " points " : " point ")}
                </span>
                for your team!
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <XMarkIcon
                  className="h-12 w-12 text-red-600"
                  aria-hidden="true"
                />
              </div>
              <p className="text-lg">QR Failed to Redeem</p>
              <p>
                Please speak to a volunteer if you believe this is in error.
              </p>
            </>
          )}
          <Link href="/hacker" className="dh-btn">
            Return Home
          </Link>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
            <ArrowPathIcon
              className="h-12 w-12 text-accent animate-spin"
              aria-hidden="true"
            />
          </div>
          <p>Redeeming QR code...</p>
        </>
      )}
    </div>
  );
}

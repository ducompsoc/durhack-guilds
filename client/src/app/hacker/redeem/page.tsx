"use client";

import {
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { fetchMegateamsApi } from "@/lib/api";
import { isHacker } from "@/lib/is-role";
import { abortForRerender } from "@/lib/symbols";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

export default function RedeemPage() {
  const [qrPoints, setQrPoints] = useState<number | null>(null);
  const [qrChecked, setQrChecked] = useState(false);
  const searchParams = useSearchParams();
  const { user, userIsLoading } = useMegateamsContext();

  function makeSearchParams(params: Record<string, string>) {
    return new URLSearchParams(params).toString();
  }

  useEffect(() => {
    async function tryRedeemQR(signal: AbortSignal) {
      const uuid = searchParams.get("qr_id");
      if (uuid && uuid !== "invalid") {
        try {
          const result = await fetchMegateamsApi("/qr_codes/redeem", {
            method: "POST",
            body: JSON.stringify({ uuid }),
            headers: { "Content-Type": "application/json" },
            signal,
          });
          setQrPoints(result.points);
        } catch (error) {
          if (error === abortForRerender) return
          setQrChecked(true);
        }
      }
      setQrChecked(true);
    }

    const abortController = new AbortController()
    void tryRedeemQR(abortController.signal);
    return () => abortController.abort(abortForRerender);
  }, [searchParams]);

  if (!userIsLoading && (user == null || !isHacker(user))) {
    if (qrChecked) return redirect("/");

    const qr_id = searchParams.get("qr_id");
    const redemptionUrl = `/hacker/redeem?${makeSearchParams({ qr_id: qr_id ?? "" })}`
    return redirect(
      `/api/auth/keycloak/login?${makeSearchParams({ referrer: redemptionUrl })}`
    );
  }

  function RedeemContainer({ children }: { children: ReactNode }) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-y-10 text-center">
        {children}
      </div>
    );
  }

  function RedeemSuccess() {
    return (
      <RedeemContainer>
        <div className="mx-auto flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
          <CheckIcon className="h-12 w-12 text-green-500" aria-hidden="true" />
        </div>
        <p className="text-lg">QR Redeemed Successfully!</p>
        <p>
          You&apos;ve gained
          <span className="font-bold">
            {" " + qrPoints + (qrPoints ?? 0 > 1 ? " points " : " point ")}
          </span>
          for your team!
        </p>
        <Link href="/hacker" className="dh-btn">
          Return Home
        </Link>
      </RedeemContainer>
    );
  }

  function RedeemFailure() {
    return (
      <RedeemContainer>
        <div className="mx-auto flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
          <XMarkIcon className="h-12 w-12 text-red-600" aria-hidden="true" />
        </div>
        <p className="text-lg">QR Failed to Redeem</p>
        <p>Please speak to a volunteer if you believe this is in error.</p>
        <Link href="/hacker" className="dh-btn">
          Return Home
        </Link>
      </RedeemContainer>
    );
  }

  function RedeemPending() {
    return (
      <RedeemContainer>
        <div className="mx-auto flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
          <ArrowPathIcon
            className="h-12 w-12 text-accent animate-spin"
            aria-hidden="true"
          />
        </div>
        <p>Redeeming QR code...</p>
      </RedeemContainer>
    );
  }

  if (!qrChecked) return <RedeemPending />;

  if (!qrPoints) return <RedeemFailure />;

  return <RedeemSuccess />;
}

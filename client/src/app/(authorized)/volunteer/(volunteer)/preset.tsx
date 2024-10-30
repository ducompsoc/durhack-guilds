import { ButtonModal } from "@/components/button-modal";
import { CameraIcon, ClockIcon, GiftIcon, MagnifyingGlassIcon, TagIcon, UserIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import useSWR from "swr";
import dateFormat from "dateformat";
import { useFormState } from "react-hooks-use-form-state";

import { getQRState, qrClasses, capitalizeFirstLetter } from "./qr-display-helpers";
import { fetchGuildsApi } from "@/lib/api";

export default function Preset({ displayQR }: { displayQR: (id: number) => void }) {
  const { data: challengeData = { challenges: [] } } = useSWR<{ challenges: any[] }>("/qr_codes/challenges");
  const [error, setError] = useState<string | null>(null);
  const [challenges, setChallenges, resetForm] = useFormState(challengeData.challenges);

  const filteredChallenges = challenges.filter((challenge) => !challenge.hidden);

  function filterChallenges(searchText: string) {
    const lowerSearch = searchText.toLowerCase();
    setChallenges(
      challenges.map((challenge) => {
        challenge.hidden = true;
        if (challenge.name.toLowerCase().includes(lowerSearch)) challenge.hidden = false;
        return challenge;
      })
    );
  }

  async function generateQR(id: number) {
    try {
      const { data: qr } = await fetchGuildsApi(
        "/qr_codes/challenges/" + encodeURIComponent(id),
        { method: "POST" }
      );
      setError(null);
      displayQR(qr.qrCodeId);
    } catch {
      setError("Failed to generate QR!");
    }
  }

  return (
    <>
      <div className="dh-box p-4 mb-6 flex flex-row items-center">
        <input
          type="text"
          className="dh-input w-full pl-10"
          placeholder="Search for QRs..."
          onChange={(e) => filterChallenges(e.target.value)}
        />
        <MagnifyingGlassIcon className="w-6 h-6 absolute ml-2" />
      </div>
      <div className="flex flex-col gap-2">
        {challenges.length === 0 ? (
          <p className="text-center dh-box p-2">No challenges have been published yet. Check back soon!</p>
        ) : (
          filteredChallenges.map((challenge, i) => {
            const qrState = getQRState(challenge.start_time, challenge.expiry_time, true);
            return (
              <div className={qrClasses(qrState)} key={i}>
                <p className="font-bold">{challenge.name}</p>
                <p className="mb-2">{challenge.description}</p>
                <div className="mb-4 grid grid-cols-2 gap-x-2 gap-y-2">
                  <div className="col-span-1">
                    <p className="flex items-center" title="QR Category/Type">
                      <TagIcon className="w-4 h-4 mr-2" />
                      {capitalizeFirstLetter(challenge.category)}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <p className="flex items-center" title="Use Limit">
                      <CameraIcon className="w-4 h-4 mr-2" />
                      {challenge.claim_limit ? "1 per hacker" : "Unlimited"}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <p className="flex items-center" title="Point Value">
                      <GiftIcon className="w-4 h-4 mr-2" />
                      {challenge.value} points
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="flex items-center gap-2" title="Valid From - Until">
                      <ClockIcon className="w-4 h-4" />
                      { !challenge.start_time && !challenge.expiry_time && <span>No time limit</span> }
                      {challenge.start_time && <span>Starts: {dateFormat(challenge.start_time, "hh:MM dd/mm")}</span>}
                      {challenge.expiry_time && <span>Expires: {dateFormat(challenge.expiry_time, "hh:MM dd/mm")}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    className="dh-btn disabled:bg-gray-300 dark:disabled:bg-neutral-500"
                    disabled={qrState.disabled}
                    onClick={() => generateQR(challenge.id)}
                  >
                    Show QR
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <ButtonModal
        show={error !== null}
        onClose={() => setError(null)}
        content={<p className="dark:text-neutral-200">Failed to generate QR Code for Challenge!</p>}
        itemsClass="items-center"
        buttons={
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:text-neutral-200 dark:bg-neutral-500"
            onClick={() => setError(null)}
          >
            Close
          </button>
        }
      />
    </>
  );
}

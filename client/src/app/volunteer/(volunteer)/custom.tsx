import { ClockIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { fetchGuildsApi } from "@/lib/api";

export default function Custom({
  displayQR,
}: {
  displayQR: (id: number) => void;
}) {
  const qrTypes = ["Challenge", "Sponsor", "Workshop"];

  const [name, setName] = useState("");
  const [category, setCategory] = useState(qrTypes[0]);
  const [points, setPoints] = useState(5);
  const [claimLimit, setClaimLimit] = useState(false);

  const [error, setError] = useState("");

  async function submitForm() {
    if (!name) return setError("Please set a name!");
    try {
      const { data: qr } = await fetchGuildsApi("/qr_codes", {
        method: "POST",
        body: JSON.stringify({
          name,
          category: category.toLowerCase(),
          pointsValue: points,
          claimLimit,
          state: true,
        }),
        headers: { "Content-Type": "application/json" },
      });
      setName("");
      setCategory(qrTypes[0]);
      setPoints(5);
      setClaimLimit(false);
      setError("");
      displayQR(qr.qrCodeId);
    } catch {
      setError("Failed to create QR code!");
    }
  }

  return (
    <div className="dh-box p-4">
      <p className="font-semibold mb-2">Generate Custom QR</p>
      <input
        type="text"
        className="dh-input w-full"
        placeholder="Name/Description"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="my-2 dh-input w-full"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {qrTypes.map((qrType) => (
          <option key={qrType} value={qrType}>
            {qrType}
          </option>
        ))}
      </select>
      <div className="flex items-center">
        <input
          type="number"
          className="my-2 dh-input w-full md:w-fit"
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value))}
        />
        <p className="ml-1 mr-2">points</p>
      </div>
      <div className="flex items-center mt-2">
        <p>Per user claim limit?</p>
        <input
          type="checkbox"
          className="ml-2 dh-check"
          checked={claimLimit}
          onChange={(e) => setClaimLimit(e.target.checked)}
        />
        <button onClick={() => submitForm()} className="dh-btn ml-4">
          Generate
        </button>
      </div>
      {error && <p className="dh-err">{error}</p>}
    </div>
  );
}

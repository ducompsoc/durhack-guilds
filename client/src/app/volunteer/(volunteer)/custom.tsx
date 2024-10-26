import { ClockIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { fetchMegateamsApi } from "@/lib/api";

export default function Custom({
  displayQR,
}: {
  displayQR: (name: string, url: string, category: string) => void;
}) {
  const now = currentDate();
  const nowPlusFive = currentDate(5);

  const qrTypes = ["Challenge", "Sponsor", "Workshop"];

  const [name, setName] = useState("");
  const [category, setCategory] = useState(qrTypes[0]);
  const [points, setPoints] = useState(5);
  const [uses, setUses] = useState(1);
  const [publicised, setPublicised] = useState(false);
  const [startDate, setStartDate] = useState(now);
  const [endDate, setEndDate] = useState(nowPlusFive);

  const [error, setError] = useState("");

  function currentDate(addMinutes?: number) {
    let now = new Date();
    now.setMinutes(
      now.getMinutes() - now.getTimezoneOffset() + (addMinutes ?? 0)
    );
    return now.toISOString().slice(0, 16);
  }

  async function submitForm() {
    if (!name) return setError("Please set a name!");
    try {
      const { data: qr } = await fetchMegateamsApi("/qr_codes", {
        method: "POST",
        body: JSON.stringify({
          name,
          category: category.toLowerCase(),
          points_value: points,
          max_uses: uses,
          publicised,
          start_time: new Date(startDate).toISOString(),
          expiry_time: new Date(endDate).toISOString(),
          state: true,
        }),
        headers: { "Content-Type": "application/json" },
      });
      setName("");
      setCategory(qrTypes[0]);
      setPoints(5);
      setUses(1);
      setPublicised(false);
      setStartDate(now);
      setEndDate(nowPlusFive);
      setError("");
      displayQR(qr.name, qr.redemption_url, qr.category);
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
        <input
          type="number"
          className="my-2 dh-input w-full md:w-fit"
          value={uses}
          onChange={(e) => setUses(parseInt(e.target.value))}
        />
        <p className="ml-1 mr-2">uses</p>
      </div>
      <p className="pt-2">Start time</p>
      <div className="flex items-center">
        <input
          type="datetime-local"
          className="my-2 dh-input w-full"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <button className="ml-2" onClick={() => setStartDate(currentDate())}>
          <ClockIcon className="w-6 h-6" />
        </button>
      </div>
      <p className="pt-2">End time</p>
      <div className="flex items-center">
        <input
          type="datetime-local"
          className="my-2 dh-input w-full"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="ml-2" onClick={() => setEndDate(currentDate(5))}>
          <ClockIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="flex items-center mt-2">
        <p>Publicised:</p>
        <input
          type="checkbox"
          className="ml-2 dh-check"
          checked={publicised}
          onChange={(e) => setPublicised(e.target.checked)}
        />
        <button onClick={() => submitForm()} className="dh-btn ml-4">
          Generate
        </button>
      </div>
      {error && <p className="dh-err">{error}</p>}
    </div>
  );
}

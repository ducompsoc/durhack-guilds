import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { fetchGuildsApi } from "@/lib/api";

export function NewChallenge({ save }: { save: () => void }) {
  const defaultDate = null

  const qrTypes = ["Challenge", "Sponsor", "Workshop"];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(qrTypes[0]);
  const [points, setPoints] = useState(5);
  const [claimLimit, setClaimLimit] = useState(true);
  const [startDate, setStartDate] = useState<string | null>(defaultDate);
  const [endDate, setEndDate] = useState<string | null>(defaultDate);

  const [error, setError] = useState("");

  async function submitForm() {
    if (!name) return setError("Please set a name!");
    if (!description) return setError("Please set a description!");
    try {
      await fetchGuildsApi("/qr_codes/challenges", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          category: category.toLowerCase(),
          points: points,
          startTime: startDate != null ? (new Date(startDate)).toISOString() : null,
          expiryTime: endDate != null ? (new Date(endDate)).toISOString() : null,
          claimLimit
        }),
        headers: { "Content-Type": "application/json" },
      });
      setName("");
      setDescription("");
      setCategory(qrTypes[0]);
      setPoints(5);
      setClaimLimit(true);
      setStartDate(defaultDate);
      setEndDate(defaultDate);
      setError("");
      save();
    } catch {
      setError("Failed to create challenge!");
    }
  }

  return (
    <div>
      <p className="font-semibold mb-2">New Challenge</p>
      <input
        type="text"
        className="dh-input w-full"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        className="dh-input w-full my-2"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <select className="my-2 dh-input w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
          {qrTypes.map((qrType) => (
            <option key={qrType} value={qrType}>
              {qrType}
            </option>
          ))}
        </select>
        <input
          type="number"
          className="my-2 dh-input w-full md:w-fit"
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value))}
        />
        <p>points</p>
      </div>
      <p className="pt-2">Start time (optional)</p>
      <div className="flex items-center">
        <input
          type="datetime-local"
          className="my-2 dh-input w-full"
          value={startDate ?? ""}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <button className="ml-2" onClick={() => setStartDate(defaultDate)}>
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      <p className="pt-2">End time (optional)</p>
      <div className="flex items-center">
        <input
          type="datetime-local"
          className="my-2 dh-input w-full"
          value={endDate ?? ""}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="ml-2" onClick={() => setEndDate(defaultDate)}>
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="flex items-center mt-2">
        <p>Per hacker claim limit?</p>
        <input
          type="checkbox"
          className="ml-2 dh-check"
          checked={claimLimit}
          onChange={(e) => setClaimLimit(e.target.checked)}
        />
        <button onClick={() => submitForm()} className="dh-btn ml-4">
          Create
        </button>
      </div>
      {error && <p className="dh-err">{error}</p>}
    </div>
  );
}

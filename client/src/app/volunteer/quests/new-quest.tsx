import { useState } from "react";
import Select from "react-select";
import useSWR from "swr";

import { fetchMegateamsApi } from "@/lib/api";

export function NewQuest({ save }: { save: () => void }) {
  const dependencyModes = ["AND", "OR"];

  const { data: challengeData = { challenges: [] } } = useSWR<{ challenges: any[] }>(
    "/qr_codes/challenges?noFilter=true"
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dependencyMode, setDependencyMode] = useState(dependencyModes[0]);
  const [points, setPoints] = useState(0);
  const [challenges, setChallenges] = useState<any[]>([]);

  const [error, setError] = useState("");

  async function submitForm() {
    if (!name) return setError("Please set a name!");
    if (!description) return setError("Please set a description!");
    if (challenges.length === 0) return setError("Please include at least one challenge!");
    try {
      await fetchMegateamsApi("/quests", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          dependencyMode: dependencyMode,
          points: points,
          challenges: challenges.map(challenge => challenge.id)
        }),
        headers: { "Content-Type": "application/json" },
      });
      setName("");
      setDescription("");
      setDependencyMode(dependencyModes[0]);
      setPoints(0);
      setError("");
      save();
    } catch {
      setError("Failed to create quest!");
    }
  }

  return (
    <div>
      <p className="font-semibold mb-2">New Quest</p>
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
        <select className="my-2 dh-input w-full" value={dependencyMode} onChange={(e) => setDependencyMode(e.target.value)}>
          {dependencyModes.map((qrType) => (
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
      <Select
        options={challengeData.challenges}
        className="my-2 dh-select"
        classNamePrefix="dh-select"
        menuPortalTarget={document.body}
        styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
        getOptionLabel={(option: any) => option.name}
        getOptionValue={(option: any) => option.id}
        isMulti={true}
        value={challenges}
        onChange={(challenges) => setChallenges([...challenges])}
        placeholder="Choose challenges..."
      />
      <button onClick={() => submitForm()} className="dh-btn w-full mt-2">
        Create
      </button>
      {error && <p className="dh-err">{error}</p>}
    </div>
  );
}

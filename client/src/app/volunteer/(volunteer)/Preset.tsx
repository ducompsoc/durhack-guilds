import { fetchMegateamsApi } from "@/app/lib/api";
import { ClockIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import useSWR from "swr";

export default function Preset({
  displayQR,
}: {
  displayQR: (name: string, url: string, category: string) => void;
}) {
  const { data: { presets } = { presets: {} }, isLoading } =
    useSWR("/qr_codes/presets");
  const [selected, setSelected] = useState<any>(null);
  const [publicised, setPublicised] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const keys = Object.keys(presets);
    keys.sort();
    if (keys.length && !selected) setSelected(presets[keys[0]]);
  }, [presets]);

  let presetsList: any[] = Object.entries(presets).map(
    ([id, preset]: [string, any]) => {
      preset.id = id;
      return preset;
    }
  );
  presetsList.sort((a, b) => a.name.localeCompare(b.name));

  function getExpiryDate(minutesValid: number) {
    let now = new Date();
    now.setMinutes(now.getMinutes() + minutesValid);
    return now.toLocaleString("en-GB", {
      timeStyle: "short",
      dateStyle: "short",
    });
  }

  async function generateQR() {
    if (!name) return setError("Please provide a name/description!");
    try {
      const { data: qr } = await fetchMegateamsApi(
        "/qr_codes/presets/" + encodeURIComponent(selected.id),
        {
          method: "POST",
          body: JSON.stringify({
            name,
            publicised,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );
      setError(null);
      setName("");
      setPublicised(false);
      displayQR(qr.name, qr.redemption_url, qr.category);
    } catch {
      setError("Failed to generate QR!");
    }
  }

  if (isLoading || !selected) return <></>;

  return (
    <div className="dh-box p-4">
      <input
        type="text"
        className="mb-2 dh-input w-full"
        placeholder="Name/Description"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="dh-input w-full"
        onChange={(e) =>
          setSelected(
            presetsList.filter(({ name }) => name === e.target.value)[0]
          )
        }
        value={selected.name}
      >
        {presetsList.map((preset) => (
          <option key={preset.name} value={preset.name}>
            {preset.name}
          </option>
        ))}
      </select>
      <p className="my-2">{selected.description}</p>
      <div className="flex items-center my-2" title="Expiry time">
        <ClockIcon className="w-6 h-6 mr-2" />
        <p>{getExpiryDate(selected.minutesValid)}</p>
      </div>
      <div className="flex items-center my-2">
        <InformationCircleIcon className="w-6 h-6 mr-2" />
        <p>
          <b>{selected.points}</b> point{selected.points !== 1 ? "s" : ""}
          ,&nbsp;
          <b>{selected.uses}</b> use{selected.uses !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center">
        <p>Publicised:</p>
        <input
          type="checkbox"
          className="ml-2 dh-check"
          checked={publicised}
          onChange={(e) => setPublicised(e.target.checked)}
        />
        <button className="dh-btn ml-4" onClick={generateQR}>
          Generate
        </button>
      </div>
      {error && <p className="dh-err">{error}</p>}
    </div>
  );
}

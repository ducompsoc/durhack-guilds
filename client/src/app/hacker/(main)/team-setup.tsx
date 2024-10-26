import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { mutate } from "swr";

import { fetchMegateamsApi } from "@/lib/api";
import { abortForRerender } from "@/lib/symbols";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

export function TeamSetup() {
  const { user, mutateTeam } = useMegateamsContext();
  const [name, setName] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  async function getTeamName(refresh: boolean, signal?: AbortSignal) {
    const params = new URLSearchParams();
    if (refresh) params.set("refresh", "yes");
    try {
      const { name } = await fetchMegateamsApi(`/teams/generate-name?${params}`, { signal });
      setName(name);
      setCreateError("");
    } catch (error) {
      if (error === abortForRerender) return
      setCreateError("Failed to fetch team name!");
    }
  }

  async function joinTeam() {
    try {
      const response = await fetchMegateamsApi("/user/team", {
        method: "POST",
        body: JSON.stringify({ join_code: joinCode }),
        headers: { "Content-Type": "application/json" },
      });
      setJoinError("");
      await mutateTeam();
    } catch {
      setJoinError("Failed to join team!");
    }
  }

  async function createTeam() {
    try {
      await fetchMegateamsApi("/teams", { method: "POST" });
      setCreateError("");
      await mutateTeam();
    } catch {
      setCreateError("Failed to create team!");
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void getTeamName(false, controller.signal);
    return () => controller.abort(abortForRerender)
  }, []);

  return (
    <div className="flex flex-col h-full">
      <p>Hello {user?.preferred_name},</p>
      <div className="dh-box p-4 mt-4">
        <h2 className="font-semibold mb-2">Create Team</h2>
        <div className="my-2 flex items-center">
          <p>
            Name:
            <br />
            <em>{name == null ? "..." : name}</em>
          </p>
          <span className="grow"></span>
          <button onClick={() => getTeamName(true)}>
            <ArrowPathRoundedSquareIcon className="w-6 h-6" />
          </button>
        </div>
        <button className="dh-btn" onClick={createTeam}>
          Create
        </button>
        {createError && <p className="dh-err">{createError}</p>}
      </div>
      <div className="dh-box p-4 mt-4">
        <h2 className="font-semibold">Join Team</h2>
        <p>
          <i>
            This is a 4 character code anyone on an existing team can view and share
            with you.
          </i>
        </p>
        <input
          type="text"
          className="dh-input w-full my-2"
          placeholder="Join code..."
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
        />
        <button className="dh-btn" onClick={joinTeam}>
          Join
        </button>
        {joinError && <p className="dh-err">{joinError}</p>}
      </div>
    </div>
  );
}

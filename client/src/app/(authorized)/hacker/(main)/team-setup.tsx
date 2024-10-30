"use client";

import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { fetchGuildsApi } from "@/lib/api";
import { useGuildsContext } from "@/hooks/use-guilds-context";
import useSWRImmutable from "swr";

export function TeamSetup() {
  const { user, mutateTeam } = useGuildsContext();
  const {
    data: { name } = { name: "" },
    mutate: mutateName,
    isLoading: nameIsLoading,
  } = useSWRImmutable("/teams/generate-name");
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  async function refreshTeamName() {
    const params = new URLSearchParams({ refresh: "yes" });
    try {
      await fetchGuildsApi(`/teams/generate-name?${params}`);
      mutateName();
    } catch (error) {
      setCreateError("Failed to fetch team name!");
    }
  }

  async function joinTeam() {
    try {
      await fetchGuildsApi("/user/team", {
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
      await fetchGuildsApi("/teams", { method: "POST" });
      setCreateError("");
      await mutateTeam();
    } catch {
      setCreateError("Failed to create team!");
    }
  }

  return (
    <div className="flex flex-col h-full">
      <p>Hello {user?.preferred_name},</p>
      <div className="dh-box p-4 mt-4">
        <h2 className="font-semibold mb-2">Create Team</h2>
        <div className="my-2 flex items-center">
          <p>
            Name:
            <br />
            <em>{nameIsLoading ? "..." : name}</em>
          </p>
          <span className="grow"></span>
          <button onClick={() => refreshTeamName()}>
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

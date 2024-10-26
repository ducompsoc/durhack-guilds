"use client"

import { ShareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import TeamName from "@/components/team-name";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

export function TeamBox({ grow = true }: { grow?: boolean }) {
  const [showTeamCode, setShowTeamCode] = useState(false);
  const { team } = useMegateamsContext()

  function toggleTeamCode() {
    setShowTeamCode(!showTeamCode);
  }

  return (
    <div
      className={`dh-box p-2 text-center md:min-w-[50%] min-w-[40%] ${
        grow ? "grow basis-0" : ""
      }`}
    >
      <h2 className="font-semibold mb-2">Team</h2>
      <div className="relative">
        <TeamName teamName={team?.name} className={"pb-2 justify-center " + (showTeamCode ? "invisible" : "visible")} />
        <p
          className={
            (showTeamCode ? "visible" : "invisible") +
            " absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-0 md:translate-y-0"
          }
        >
          {team?.join_code}
        </p>
      </div>
      <div className="flex items-center">
        <span className="grow"></span>
        {showTeamCode ? (
          <XMarkIcon onClick={toggleTeamCode} className="w-6 h-6" />
        ) : (
          <ShareIcon onClick={toggleTeamCode} className="w-6 h-6" />
        )}
      </div>
    </div>
  );
}

"use client";

import useSWR from "swr";
import {
  QrCodeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { getHackerEmoji, getPositionMedal } from "@/lib/rank-emojis";
import { ButtonModal } from "@/components/button-modal";
import { useGuildsContext } from "@/hooks/use-guilds-context";

import { TeamBox } from "./team/team-box";
import { TeamSetup } from "./team-setup";
import { QuestList } from "./quest-list";

const Scanner = dynamic(() => import("qrcode-scanner-react"), {
  ssr: false,
});

export default function HackerHome() {
  const [scanning, setScanning] = React.useState(false);
  const router = useRouter();
  const { user, team } = useGuildsContext();
  const { data: { guilds } = { guilds: null } } = useSWR("/guilds");
  const { data: { teams } = { teams: null } } = useSWR("/teams");

  const hasTeam = team !== null;
  const hasGuild = team?.guild_name !== null;

  let guild_points = 0;
  let guild_rank = 0;

  guilds?.sort((a: any, b: any) => {
    return b.points - a.points;
  });
  guilds?.forEach((guild: any, index: number) => {
    if (guild.guild_name === team?.guild_name) {
      guild_points = guild.points;
      guild_rank = index;
    }
  });

  let team_points = 0;
  let team_rank = 0;

  teams?.sort((a: any, b: any) => {
    return b.points - a.points;
  });
  teams?.forEach((current_team: any, index: number) => {
    if (current_team.name === team?.name) {
      team_points = current_team.points;
      team_rank = index;
    }
  });

  function scanSuccess(result: string) {
    let qr_id;
    try {
      const url = new URL(result);
      qr_id =
        window.location.origin === url.origin
          ? url.searchParams.get("qr_id") ?? "invalid"
          : "invalid";
    } catch {
      qr_id = "invalid";
    }
    router.push(`/hacker/redeem?${new URLSearchParams({ qr_id }).toString()}`);
  }

  return (
    <>
      {hasTeam ? (
        <div className="flex flex-col h-full">
          <p>Hello {user?.preferred_name},</p>
          <div className="flex mt-4">
            <TeamBox className="grow basis-0" />
            {hasGuild && (
              <div className="dh-box p-2 text-center grow basis-0 ml-4 flex flex-col">
                <h2 className="font-semibold mb-2">Guild</h2>
                <div className="flex flex-col md:flex-row items-center justify-evenly md:justify-center md:gap-x-4 grow">
                  <img className="w-12 h-12" src={`/guilds/${team?.guild_slug}/icon.svg`} alt={`${team?.guild_name} Logo`} />
                  <p className="font-heading text-lg">{team?.guild_name}</p>
                </div>
              </div>
            )}
          </div>
          {hasGuild ? (
            <>
              <div className="dh-box p-2 text-center flex mt-4">
                <div className="grow">
                  <h2 className="font-semibold mb-2">My Points</h2>
                  <p>
                    {user?.points} {getHackerEmoji(user?.points ?? 0)}
                  </p>
                </div>
                <div className="grow px-4">
                  <h2 className="font-semibold mb-2">Team Points</h2>
                  <div className="flex justify-center items-center">
                    <p>
                      {team_points} {getPositionMedal(team_rank)}
                    </p>
                  </div>
                </div>
                <div className="grow">
                  <h2 className="font-semibold mb-2">Guild Points</h2>
                  <p>
                    {guild_points} {getPositionMedal(guild_rank)}
                  </p>
                </div>
              </div>
              <h2 className="font-semibold mt-4 mb-2 text-center">Quests</h2>
              <QuestList />
            </>
          ) : (
            <div className="dh-box p-4 text-center flex flex-col items-center mt-4">
              <p className="flex items-center font-semibold mb-2">
                <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
                No Guild Assigned
              </p>
              <p>Please speak to a volunteer to ensure your team&apos;s points are recorded!</p>
            </div>
          )}
        </div>
      ) : (
        <TeamSetup />
      )}
      <button onClick={() => setScanning(true)} className="fixed bottom-14 right-6 bg-accent p-3 rounded-full">
        <QrCodeIcon className="w-10 h-10" />
      </button>
      <ButtonModal
        show={scanning}
        onClose={(bool) => setScanning(bool)}
        itemsClass="items-center"
        content={<Scanner scanning={scanning} scanSuccess={scanSuccess} className="h-96" />}
        buttons={
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:text-neutral-200 dark:bg-neutral-500"
            onClick={() => setScanning(false)}
          >
            Cancel
          </button>
        }
      />
    </>
  );
}

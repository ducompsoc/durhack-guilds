"use client";

import { Fragment, useState } from "react";
import { ExclamationTriangleIcon, UserIcon } from "@heroicons/react/24/outline";
import { Dialog } from "@headlessui/react";

import { ButtonModal } from "@/components/button-modal";
import { fetchMegateamsApi } from "@/lib/api";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

import { TeamBox } from "./team-box";

export default function Team() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const { team, mutateTeam } = useMegateamsContext()

  const members: { preferredNames: string; points: number }[] = team?.members ?? [];
  members.sort((a, b) => b.points - a.points);

  async function leaveTeam() {
    try {
      await fetchMegateamsApi("/user/team", { method: "DELETE" });
      setError("");
      await mutateTeam(null);
    } catch {
      setError("Failed to leave team!");
    }
    setOpen(false);
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <TeamBox grow={false} />
        <div className="mt-4 dh-box p-2">
          <p className="font-semibold text-center">Team Members</p>
          <div className="grid grid-cols-[auto_auto] my-4 mx-4 gap-y-2 gap-x-2">
            {members.map(({ preferredNames, points }, i) => (
              <Fragment key={i}>
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 mr-2" />
                  <p>{preferredNames}</p>
                </div>
                <p className="text-gray-600 dark:text-neutral-400">
                  {points} points
                </p>
              </Fragment>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="mt-4 inline-flex w-full justify-center rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm"
          onClick={() => window.open("/api/discord")}
        >
          Join Team Discord
        </button>
        <button
          type="button"
          className="mt-4 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm"
          onClick={() => setOpen(true)}
        >
          Leave Team
        </button>
        {error && <p className="dh-err text-center">{error}</p>}
      </div>
      <ButtonModal
        show={open}
        onClose={(bool) => setOpen(bool)}
        itemsClass="items-end sm:items-center"
        content={
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon
                className="h-6 w-6 text-red-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <Dialog.Title
                as="h3"
                className="text-base font-semibold leading-6 text-gray-900 dark:text-neutral-200"
              >
                Leave team
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-neutral-300">
                  Are you sure you want to leave your team?
                </p>
              </div>
            </div>
          </div>
        }
        buttons={
          <>
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
              onClick={leaveTeam}
            >
              Leave
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:text-neutral-200 dark:bg-neutral-500"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </>
        }
      />
    </>
  );
}

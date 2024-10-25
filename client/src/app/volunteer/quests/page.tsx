"use client";

import { redirect } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import useSWR from "swr";
import { useState } from "react";
import { useFormState } from "react-hooks-use-form-state";

import { isAdmin } from "@/lib/is-role";
import { useMegateamsContext } from "@/hooks/use-megateams-context";
import { ButtonModal } from "@/components/button-modal";
import { NewQuest } from "./new-quest";
import { NewChallenge } from "./new-challenge";

export default function Quests() {
  const { user, userIsLoading } = useMegateamsContext();
  const { data: questData = { quests: [] }, isLoading, mutate: mutateQuests } = useSWR<{ quests: any[] }>("/quests");
  const [error, setError] = useState<string | null>(null);
  const [quests, setQuests, resetForm] = useFormState(questData.quests);
  const [showNewQuest, setShowNewQuest] = useState(false);
  const [showNewChallenge, setShowNewChallenge] = useState(false);

  const filteredQuests = quests.filter((quest) => !quest.hidden);

  if (userIsLoading || isLoading) return <></>;
  if (!user) return redirect("/");
  if (!isAdmin(user)) return redirect("/volunteer");

  function filterQuests(searchText: string) {
    const lowerSearch = searchText.toLowerCase();
    setQuests(
      quests.map((quest) => {
        quest.hidden = true;
        if (quest.name.toLowerCase().includes(lowerSearch)) quest.hidden = false;
        return quest;
      })
    );
  }

  async function saveQuest() {
    setShowNewQuest(false)
    await mutateQuests()
    resetForm()
  }

  function saveChallenge() {
    setShowNewChallenge(false)
  }

  return (
    <>
      <div>
        <p className="font-bold text-center mb-4">Quest/Challenge Admin</p>
        <div className="flex gap-2 mb-6">
          <button className="dh-btn grow" onClick={() => setShowNewQuest(true)}>
            New Quest
          </button>
          <button className="dh-btn grow" onClick={() => setShowNewChallenge(true)}>
            New Challenge
          </button>
        </div>
        <div className="flex flex-row items-center dh-box p-4 mb-4">
          <input
            type="text"
            className="dh-input w-full pl-10"
            placeholder="Search for Quests..."
            onChange={(e) => filterQuests(e.target.value)}
          />
          <MagnifyingGlassIcon className="w-6 h-6 absolute ml-2" />
        </div>
        { filteredQuests.map((quest) => (
          <div className="dh-box mb-2 p-2" key={quest.id}>
            <p className="font-bold">{ quest.name }</p>
            <p>{ quest.description }</p>
          </div>
        )) }
      </div>
      <ButtonModal
        show={error !== null}
        onClose={() => setError(null)}
        content={<p className="dark:text-neutral-200">Failed to generate QR Code for Challenge!</p>}
        itemsClass="items-center"
        buttons={
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:text-neutral-200 dark:bg-neutral-500"
            onClick={() => setError(null)}
          >
            Close
          </button>
        }
      />
      <ButtonModal
        show={showNewQuest}
        onClose={() => setShowNewQuest(false)}
        content={<NewQuest save={saveQuest} />}
        itemsClass="items-center"
        buttons={
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:text-neutral-200 dark:bg-neutral-500"
            onClick={() => setShowNewQuest(false)}
          >
            Cancel
          </button>
        }
      />
      <ButtonModal
        show={showNewChallenge}
        onClose={() => setShowNewChallenge(false)}
        content={<NewChallenge save={saveChallenge} />}
        itemsClass="items-center"
        buttons={
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:text-neutral-200 dark:bg-neutral-500"
            onClick={() => setShowNewChallenge(false)}
          >
            Cancel
          </button>
        }
      />
    </>
  );
}

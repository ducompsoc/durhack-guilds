"use client";

import useSWR from "swr";
import * as React from "react";
import { ClockIcon, CheckIcon } from "@heroicons/react/24/outline"; 

export function QuestList() {
  const { data: { quests } = { quests: [] } } = useSWR("/quests");

  return (
    <div className="flex flex-col gap-2 pb-16">
      {quests.length === 0 ? (
        <p className="text-center dh-box p-2">No quests have been published yet. Check back soon!</p>
      ) : (
        quests.map((quest: any, i: number) => (
          <div className="dh-box p-2" key={i}>
            <span className="flex items-center gap-2">
              { quest.completed ? <CheckIcon className="w-6 h-6 stroke-green-600" /> : <ClockIcon className="w-6 h-6" /> }
              <p className="text-lg">{ quest.name }</p>
              { quest.value > 0 && <p className="ml-auto">{ quest.value } pts</p> }
            </span>
            <p>{ quest.description }</p>
            <p>{ quest.dependency_mode === "AND" ? "Complete all below:" : "Complete one below:" }</p>
            <div className="flex flex-col gap-2 mt-2">
              { quest.challenges.map((challenge: any, i: number) => (
                <div className="dark:bg-neutral-500 bg-gray-300 p-2 rounded" key={i}>
                  <span className="flex items-center gap-2">
                    { challenge.completed ? <CheckIcon className="w-6 h-6 stroke-green-600" /> : <ClockIcon className="w-6 h-6" /> }
                    <p>{ challenge.name }</p>
                    <p className="ml-auto">{ challenge.value } pts</p>
                  </span>
                  <p>{ challenge.description }</p>
                </div>
              )) }
            </div>
          </div>
        ))
      )}
    </div>
  );
}

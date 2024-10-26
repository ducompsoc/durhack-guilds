"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { redirect } from "next/navigation";
import useSWR from "swr";
import { useFormState } from "react-hooks-use-form-state";
import { useState } from "react";

import { ButtonModal } from "@/components/button-modal";
import { fetchMegateamsApi } from "@/lib/api";
import { isAdmin } from "@/lib/is-role";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

export default function Challenges() {
  const { user, userIsLoading } = useMegateamsContext();
  const { data = { challenges: [] }, mutate: mutateChallenges } = useSWR<{
    challenges: any[];
  }>("/qr_codes/challenges");

  const [animationParent] = useAutoAnimate();

  const [challenges, setChallenges, resetForm] = useFormState(data.challenges);
  const [message, setMessage] = useState("");
  const [messageOpen, setMessageOpen] = useState(false);

  if (userIsLoading) return <></>;
  if (!user) return redirect("/")
  if (!isAdmin(user)) return redirect("/volunteer")

  async function updatePosition(oldPos: number, newPos: number) {
    try {
      let newList = [...challenges];
      if (newPos > oldPos) {
        for (let challenge of newList) {
          if (challenge.rank === oldPos) {
            challenge.rank = newPos;
          } else if (challenge.rank > oldPos && challenge.rank <= newPos) {
            challenge.rank--;
          }
        }
      }
      if (newPos < oldPos) {
        for (let challenge of newList) {
          if (challenge.rank === oldPos) {
            challenge.rank = newPos;
          } else if (challenge.rank >= newPos && challenge.rank < oldPos) {
            challenge.rank++;
          }
        }
      }
      newList.sort((a, b) => a.rank - b.rank);
      setChallenges(newList);
      await fetchMegateamsApi("/qr_codes/challenges/reorder", {
        method: "POST",
        body: JSON.stringify({
          challenges: challenges.map(({ id, rank }) => ({ id, rank })),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      await mutateChallenges();
    } catch {
      setMessage("Failed to reorder challenges!");
      setMessageOpen(true);
    }
    resetForm();
  }

  async function unpublicise(id: number) {
    try {
      await fetchMegateamsApi("/qr_codes/" + encodeURIComponent(id), {
        method: "PATCH",
        body: JSON.stringify({ publicised: false }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      await mutateChallenges();
    } catch {
      setMessage("Failed to unpublicise challenge!");
      setMessageOpen(true);
    }
    resetForm();
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <p className="font-bold text-center mb-4">Manage Challenge List</p>
        <ul ref={animationParent}>
          {challenges.map(({ title, points, rank, id }) => (
            <li className="dh-box p-4 mb-4" key={id} draggable>
              <p className="mb-2">{title}</p>
              <p className="mb-2">{points} points</p>
              <div className="flex items-center">
                <p>Position: </p>
                <select
                  value={rank}
                  onChange={(e) =>
                    updatePosition(rank, parseInt(e.target.value))
                  }
                  className="ml-2 dh-input"
                >
                  {challenges.map(({ rank }) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
                <button className="ml-4 dh-btn" onClick={() => unpublicise(id)}>
                  Unpublicise
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <ButtonModal
        show={messageOpen}
        onClose={(bool) => setMessageOpen(bool)}
        content={<p className="dark:text-neutral-200">{message}</p>}
        itemsClass="items-center"
        buttons={
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:text-neutral-200 dark:bg-neutral-500"
            onClick={() => setMessageOpen(false)}
          >
            Close
          </button>
        }
      />
    </>
  );
}

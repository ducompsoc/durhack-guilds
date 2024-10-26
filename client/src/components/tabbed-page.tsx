"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { Dialog } from "@headlessui/react";
import * as React from "react";
import { SWRConfig } from "swr";

import { fetchMegateamsApi } from "@/lib/api";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

import { ButtonModal } from "./button-modal";

interface Tab {
  path: string;
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string | undefined;
      titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
  >;
  openNewWindow?: boolean;
}

export function TabbedPage({
  tabs,
  children,
  showTabs = true,
}: {
  tabs: Tab[];
  children: React.ReactNode;
  showTabs?: boolean;
}) {
  const path = usePathname();
  const [open, setOpen] = React.useState(false);
  const { mutateUser } = useMegateamsContext();

  async function signOut() {
    await fetchMegateamsApi("/auth/logout", { method: "POST" });
    await mutateUser(null);
  }

  return (
    <SWRConfig value={{ fetcher: fetchMegateamsApi }}>
      <div className="h-full flex flex-col text-black dark:text-neutral-200">
        <div className="flex flex-row py-4 px-6 items-center justify-evenly">
          <object data="/logo.svg" type="image/svg+xml" className="w-16 h-16">
            <img src="/logo.png" alt="DurHack Logo" />
          </object>
          <h1 className="text-3xl font-bold font-heading">DURHACK</h1>
          <button onClick={() => setOpen(true)}>
            <ArrowRightStartOnRectangleIcon className="w-12 h-12" />
          </button>
        </div>
        <div className="p-6 pt-0 grow overflow-auto md:w-7/12 md:mx-auto">
          {children}
        </div>
        {showTabs && (
          <div className="flex gap-1 border-t border-gray-200 md:justify-center md:gap-x-20 dark:border-neutral-600">
            {tabs.map((tab) => {
              const active = tab.path === path;

              return (
                <Link
                  href={tab.path}
                  key={tab.path}
                  target={tab.openNewWindow ? "_blank" : undefined}
                  className="w-full py-4 flex justify-center md:w-fit"
                >
                  <tab.icon
                    className={
                      "w-8 h-8 " +
                      (active ? "stroke-accent" : "dark:stroke-neutral-400")
                    }
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <ButtonModal
        show={open}
        onClose={(bool) => setOpen(bool)}
        itemsClass="items-end sm:items-center"
        content={
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <ArrowRightStartOnRectangleIcon
                className="h-6 w-6 text-red-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <Dialog.Title
                as="h3"
                className="text-base font-semibold leading-6 text-gray-900 dark:text-neutral-200"
              >
                Sign out account
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-neutral-300">
                  Are you sure you want to sign out of DurHack?
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
              onClick={() => signOut()}
            >
              Sign Out
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
    </SWRConfig>
  );
}

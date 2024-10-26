"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { exportComponentAsJPEG } from "react-component-export-image";
import dateFormat from "dateformat";
import { useMediaQuery } from "react-responsive";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "tailwindcss/defaultConfig";

import { socketManager } from "@/lib/socket";
import { isAdmin, isVolunteer } from "@/lib/is-role";
import { useMegateamsContext } from "@/hooks/use-megateams-context";

import Preset from "./preset";
import Custom from "./custom";
import Manage from "./manage";

export default function Volunteer() {
  const [current, setCurrent] = useState("Preset");
  const [open, setOpen] = useState(false);
  const [qr, setQR] = useState({
    name: "",
    url: "",
    category: "",
    preset: false,
  });
  const renderedQR = useRef(null);

  const isDark = useMediaQuery({
    query: "(prefers-color-scheme: dark)",
  });
  const { theme } = resolveConfig(tailwindConfig);

  const { user } = useMegateamsContext();
  const userIsAdmin = user != null && isAdmin(user);
  const userIsVolunteer = user != null && isVolunteer(user)

  function getClasses(name: string) {
    let classes =
      "font-semibold pb-4 px-4 inline-flex items-center border-b-[3px] text-sm";
    if (name === current) {
      classes += " border-accent text-accent";
    } else {
      classes +=
        " border-gray-200 text-gray-500 hover:text-accent hover:border-accent dark:border-neutral-400 dark:text-neutral-400";
    }
    return classes;
  }

  async function downloadQR() {
    const date = new Date();
    const datetimeString = dateFormat(date, "yyyymmdd_hhMMss");

    await exportComponentAsJPEG(renderedQR, {
      fileName: qr.preset
        ? `${qr.name}_PRESET_${datetimeString}.jpg`
        : `${qr.name}_${qr.category}_${datetimeString}.jpg`,
    });
  }

  async function displayQR(name: string, url: string, category: string) {
    // Should use socket to subscribe to QR updates
    if (await socketManager.ensureConnected()) {
      console.log("Socket is authenticated")
      // setQR({ name, url, category, preset: category === "preset" });
      // setOpen(true);
    } else {
      console.log("Failed to get socket")
    }
  }

  const tabs = [
    {
      name: "Preset",
      content: <Preset displayQR={displayQR} />,
    },
    ...(userIsVolunteer
      ? [
          {
            name: "Custom",
            content: <Custom displayQR={displayQR} />,
          },
        ]
      : []),
    ...(userIsAdmin
      ? [
          {
            name: "Manage",
            content: <Manage displayQR={displayQR} />,
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="flex flex-col h-full">
        <nav className="flex justify-center">
          {tabs.map((tab) => (
            <button
              onClick={() => setCurrent(tab.name)}
              className={getClasses(tab.name)}
              key={tab.name}
            >
              {tab.name}
            </button>
          ))}
        </nav>
        <div className="mt-4">
          {tabs.map(
            (tab) =>
              tab.name === current && (
                <Fragment key={tab.name}>{tab.content}</Fragment>
              )
          )}
        </div>
      </div>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-neutral-700 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-white dark:bg-neutral-700 px-4 py-5 sm:p-6 text-center flex flex-col items-center justify-center">
                    <div ref={renderedQR} className="p-4">
                      <QRCode
                        value={qr.url}
                        fgColor={isDark ? "#fff" : "#7d6399"}
                        /* @ts-ignore */
                        bgColor={isDark ? theme.colors.neutral[700] : "#fff"}
                      />
                    </div>
                    <p className="dark:text-neutral-200">{qr.name}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-neutral-600 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-300 bg-accent hover:bg-gray-50 sm:mt-0 sm:w-auto hover:text-gray-900"
                      onClick={downloadQR}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="mt-2 sm:mr-2 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}

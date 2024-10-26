import {
  ClockIcon,
  MagnifyingGlassIcon,
  TagIcon,
  GiftIcon,
  CameraIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import dateFormat from "dateformat";
import { useState } from "react";
import { useFormState } from "react-hooks-use-form-state";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import useSWR from "swr";
import { Dialog } from "@headlessui/react";

import { ButtonModal } from "@/components/button-modal";
import { fetchMegateamsApi } from "@/lib/api";

export default function Manage({
  displayQR,
}: {
  displayQR: (name: string, url: string, category: string) => void;
}) {
  const { mutate: mutateCodes, data: codesData = { codes: [] } } = useSWR<{
    codes: any[];
  }>("/qr_codes");
  const [codes, setCodes, resetForm] = useFormState(codesData.codes);
  const [error, setError] = useState(false);

  const filteredCodes = codes.filter((code) => !code.hidden);

  async function patchQR(id: number, field: string, value: boolean) {
    try {
      let body: Record<string, boolean> = {};
      body[field] = value;
      await fetchMegateamsApi("/qr_codes/" + encodeURIComponent(id), {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });
      await mutateCodes();
      resetForm();
      setError(false);
    } catch {
      resetForm();
      setError(true);
    }
  }

  function filterCodes(searchText: string) {
    const lowerSearch = searchText.toLowerCase();
    setCodes(
      codes.map((code) => {
        code.hidden = true;
        if (code.name.toLowerCase().includes(lowerSearch)) code.hidden = false;
        return code;
      })
    );
  }

  function getQRState(
    start: string,
    end: string,
    enabled: boolean
  ): { checked: boolean; disabled: boolean; preStart: boolean } {
    let state = { checked: enabled, disabled: false, preStart: false };
    let now = new Date();
    let startDate = new Date(start);
    let endDate = new Date(end);
    if (now > endDate) {
      state.checked = false;
      state.disabled = true;
    } else if (now < startDate) {
      state.disabled = true;
      state.preStart = true;
    }
    return state;
  }

  function qrClasses(state: {
    checked: boolean;
    disabled: boolean;
    preStart: boolean;
  }) {
    const { checked, disabled, preStart } = state;
    let bgClass = "dark:bg-neutral-700 bg-gray-200";
    if (preStart || (!disabled && !checked)) {
      bgClass =
        "pattern-diagonal-lines pattern-transparent pattern-bg-gray-200 dark:pattern-bg-neutral-700 pattern-size-16 pattern-opacity-100";
    } else if (disabled) {
      bgClass = "bg-red-100 opacity-100 dark:bg-red-400/50";
    }
    return `${bgClass} drop-shadow-lg p-4 rounded mb-4`;
  }

  function capitalizeFirstLetter(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  return (
    <>
      <div className="dh-box p-4 mb-6">
        <div className="flex flex-row items-center">
          <input
            type="text"
            className="dh-input w-full pl-10"
            placeholder="Search for QRs..."
            onChange={(e) => filterCodes(e.target.value)}
          />
          <MagnifyingGlassIcon className="w-6 h-6 absolute ml-2" />
        </div>
      </div>
      {filteredCodes.map((code, i) => {
        const qrState = getQRState(code.start, code.end, code.enabled);
        return (
          <div className={qrClasses(qrState)} key={i}>
            <p className="mb-2">{code.name}</p>
            <div className="mb-4 grid grid-cols-2 gap-x-2 gap-y-2">
              <div className="col-span-1">
                <p className="flex items-center" title="QR Category/Type">
                  <TagIcon className="w-4 h-4 mr-2" />
                  {capitalizeFirstLetter(code.category)}
                </p>
              </div>
              <div className="col-span-1">
                <p
                  className="flex items-center"
                  title="Current Scans/Use Limit"
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  {code.scans}/{code.max_scans} scans
                </p>
              </div>
              <div className="col-span-1">
                <p className="flex items-center" title="Creator">
                  <UserIcon className="w-4 h-4 mr-2" />
                  {code.creator}
                </p>
              </div>
              <div className="col-span-1">
                <p className="flex items-center" title="Point Value">
                  <GiftIcon className="w-4 h-4 mr-2" />
                  {code.value} points
                </p>
              </div>
              <div className="col-span-2">
                <p className="flex items-center" title="Valid From - Until">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  {dateFormat(code.start, "hh:MM dd/mm")} -{" "}
                  {dateFormat(code.end, "hh:MM dd/mm")}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                className="dh-btn disabled:bg-gray-300 dark:disabled:bg-neutral-500"
                disabled={!code.enabled || qrState.disabled}
                onClick={() =>
                  displayQR(code.name, code.redemption_url, code.category)
                }
              >
                View
              </button>
              <p className="ml-4" title="Can be scanned for points?">
                Enabled:
              </p>
              <input
                type="checkbox"
                checked={qrState.checked}
                disabled={qrState.disabled}
                className="ml-2 dh-check"
                onChange={(e) => patchQR(code.id, "state", e.target.checked)}
              />
              <p className="ml-4" title="Shown on Challenge list?">
                Publicised:
              </p>
              <input
                type="checkbox"
                checked={
                  (!qrState.disabled || qrState.preStart) && code.publicised
                }
                disabled={qrState.disabled}
                className="ml-2 dh-check"
                onChange={(e) =>
                  patchQR(code.id, "publicised", e.target.checked)
                }
              />
            </div>
          </div>
        );
      })}
      <ButtonModal
        show={error}
        onClose={(val) => setError(val)}
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
                Failed to update QR Code!
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-neutral-300">
                  Please try again.
                </p>
              </div>
            </div>
          </div>
        }
        buttons={
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:text-neutral-200 dark:bg-neutral-500"
            onClick={() => setError(false)}
          >
            Close
          </button>
        }
      />
    </>
  );
}

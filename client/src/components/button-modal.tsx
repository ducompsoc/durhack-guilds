import { Dialog, Transition } from "@headlessui/react";
import { Fragment, type ReactNode } from "react";

export function ButtonModal({
  show,
  content,
  buttons,
  onClose,
  itemsClass,
}: {
  show: boolean;
  content: ReactNode;
  buttons: ReactNode;
  onClose: (bool: boolean) => void;
  itemsClass: string;
}) {
  return (
    <Transition.Root show={show} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
          <div
            className={
              "flex min-h-full justify-center p-4 text-center sm:p-0 " +
              itemsClass
            }
          >
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
                <div className="bg-white dark:bg-neutral-700 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  {content}
                </div>
                <div className="bg-gray-50 dark:bg-neutral-600 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {buttons}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

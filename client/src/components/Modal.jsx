import { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Transition, TransitionChild } from "@headlessui/react";

export default function Modal({
  show,
  hide = () => {},
  afterEnter = () => {},
  afterLeave = () => {},
  initialFocusRef,
  dialogClassName = "w-full scr600:max-w-[500px] py-20 px-6 scr600:rounded-[50px]",
  children,
  overlayClassName = "bg-gray-500 bg-opacity-75",
}) {
  return (
    <Transition show={show} as={Fragment} afterEnter={afterEnter} afterLeave={afterLeave}>
      <Dialog as="div" className="relative z-[100]" initialFocus={initialFocusRef} onClose={hide}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={`${overlayClassName} fixed inset-0 transition-opacity`} />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full scr600:p-4 text-center cursor-pointer">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 scr600:translate-y-0 scr600:scale-95"
              enterTo="opacity-100 translate-y-0 scr600:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scr600:scale-100"
              leaveTo="opacity-0 translate-y-4 scr600:translate-y-0 scr600:scale-95"
            >
              <Dialog.Panel className={`${dialogClassName} relative bg-white text-left shadow-[0px_3px_10px_rgb(0,0,0,.3)] transition-all cursor-auto`}>
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

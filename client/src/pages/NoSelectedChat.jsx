import React from "react";

export default function NoSelectedChat() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="">
        <div className="size-[200px] ">
          <img src="/chat.svg" alt="chat" className=" w-full h-full object-contain" />
        </div>
        <p className="font-bold text-center text-2xl">No Chat Selected</p>
      </div>
    </div>
  );
}

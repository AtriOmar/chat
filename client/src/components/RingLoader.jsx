import React from "react";
import { ColorRing } from "react-loader-spinner";

export default function RingLoader({ width = "25", height = "25", color = "#0F172A" }) {
  return (
    <ColorRing
      visible={true}
      height={height}
      width={width}
      ariaLabel="blocks-loading"
      wrapperStyle={{ marginLeft: "auto" }}
      wrapperClass="blocks-wrapper"
      colors={Array(5).fill(color)}
    />
  );
}

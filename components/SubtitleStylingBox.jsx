"use client";

import { useState } from "react";
import SelectBox from "@/components/SelectBox";
import { font_family } from "@/lib/font_family";
import { font_size } from "@/lib/font_size";
import ColorPickerBox from "./ColorPickerBox";
import GenericSlider from "@/components/GenericSlider";

const border_style = [
  {label: 'boxed', value: 'boxed'},
    {label: 'dropshadow', value: 'dropshadow'},
]

const SubtitleStylingBox = () => {
  const [fontFamily, setFontFamily] = useState("Touche Semibold");
  const [fontSize, setFontSize] = useState(18);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [outlineColor, setOutlineColor] = useState("#000000");
  const [outlineWidth, setOutlineWidth] = useState(2);
  const [borderStyle, setBorderStyle] = useState("boxed");
  const [textShadow, setTextShadow] = useState(1)
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [backgroundOpacity, setBackgroundOpacity] = useState(90)


  return (
    <div className="flex flex-col w-full gap-3 bg-light-gray h-full overflow-y-auto hide-scrollbar p-5 rounded-2xl mt-15 items-start">
      <div className="flex items-end justify-between w-full">
        <div className="w-1/3">
          <SelectBox
            label="Font Family"
            value={fontFamily}
            onValueChange={setFontFamily}
            options={font_family}
            placeholder="Font"
          />
        </div>

        <div className="w-1/3">
          <SelectBox
            label="Font Size"
            value={fontSize}
            onValueChange={setFontSize}
            options={font_size}
            placeholder="Size"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBold(!isBold)}
            className={`border rounded-lg p-1 text-sm font-medium ${
              isBold ? "bg-iris white" : "border-gray"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinejoin="round"
                d="M6.75 3.744h-.753v8.25h7.125a4.125 4.125 0 0 0 0-8.25H6.75Zm0 0v.38m0 16.122h6.747a4.5 4.5 0 0 0 0-9.001h-7.5v9h.753Zm0 0v-.37m0-15.751h6a3.75 3.75 0 1 1 0 7.5h-6m0-7.5v7.5m0 0v8.25m0-8.25h6.375a4.125 4.125 0 0 1 0 8.25H6.75m.747-15.38h4.875a3.375 3.375 0 0 1 0 6.75H7.497v-6.75Zm0 7.5h5.25a3.75 3.75 0 0 1 0 7.5h-5.25v-7.5Z"
              />
            </svg>
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`border rounded-lg p-1 text-sm font-medium ${
              isItalic ? "bg-iris white" : "border-gray"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.248 20.246H9.05m0 0h3.696m-3.696 0 5.893-16.502m0 0h-3.697m3.697 0h3.803"
              />
            </svg>
          </button>
          <button
            onClick={() => setIsUnderline(!isUnderline)}
            className={`border rounded-lg p-1 text-sm font-medium ${
              isUnderline ? "bg-iris white" : "border-gray"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.995 3.744v7.5a6 6 0 1 1-12 0v-7.5m-2.25 16.502h16.5"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex justify-between w-full mt-5">
        <div className="flex items-center gap-2">
          <p className="text-[10px]">Font Color</p>
          <ColorPickerBox color={fontColor} onChange={setFontColor} />
          <input
            value={fontColor.toUpperCase()}
            type="text"
            onChange={(e) => setFontColor(e.target.value)}
            className="w-25 py-1 pl-1 bg-gray white text-xs rounded-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <p className="text-[10px]">Outline Color</p>
          <ColorPickerBox color={outlineColor} onChange={setOutlineColor} />
          <input
            value={outlineColor.toUpperCase()}
            type="text"
            onChange={(e) => setOutlineColor(e.target.value)}
            className="w-25 py-1 pl-1 bg-gray white text-xs rounded-sm"
          />
        </div>
      </div>
      <div className="flex flex-col w-full mt-5">
        <p className="text-[10px]">Outline Width</p>
        <div className="flex items-center justify-between gap-4">
          <GenericSlider
            min={0}
            max={6}
            step={1}
            value={outlineWidth}
            onValueChange={setOutlineWidth}
          />
          <p className="w-10 text-center text-xs">{outlineWidth}px</p>
        </div>
      </div>
      <div className="w-full mt-5">
        <SelectBox
          label="Border Style"
          value={borderStyle}
          onValueChange={setBorderStyle}
          options={border_style}
        />
      </div>
      <div className="flex flex-col w-full mt-5">
        <p className="text-[10px]">Text Shadow</p>
        <div className="flex items-center justify-between gap-4">
          <GenericSlider
            min={0}
            max={4}
            step={1}
            value={textShadow}
            onValueChange={setTextShadow}
          />
          <p className="w-10 text-center text-xs">{textShadow}px</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-5 w-full">
        <p className="text-[10px]">Background Color</p>
        <ColorPickerBox color={backgroundColor} onChange={setBackgroundColor} />
        <input
          value={backgroundColor.toUpperCase()}
          type="text"
          onChange={(e) => setBackgroundColor(e.target.value)}
          className="w-40 py-1 pl-1 bg-gray white text-xs rounded-sm"
        />
      </div>
      <div className="flex flex-col w-full mt-5">
        <p className="text-[10px]">Background Opacity</p>
        <div className="flex items-center justify-between gap-4">
          <GenericSlider
            min={0}
            max={100}
            step={1}
            value={backgroundOpacity}
            onValueChange={setBackgroundOpacity}
          />
          <p className="w-10 text-center text-xs">{backgroundOpacity}%</p>
        </div>
      </div>
    </div>
  );
};

export default SubtitleStylingBox;

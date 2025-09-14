"use client";

import SelectBox from "@/components/SelectBox";
import { font_family } from "@/lib/font_family";
import { font_size } from "@/lib/font_size";
import { border_style } from "@/lib/border_style";
import ColorPickerBox from "./ColorPickerBox";
import GenericSlider from "@/components/GenericSlider";
import { toast } from "react-toastify";

const SubtitleStylingBox = ({ customize, setCustomize }) => {
  const updateCustomizeObject = (change) => {
    setCustomize((prev) => ({ ...prev, ...change }));
  };

  const resetToDefault = () => {
    const defaultStyle = JSON.parse(localStorage.getItem("user")).style;
    setCustomize(defaultStyle);
  };

  const saveAsDefault = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
      toast.error("User not found in localStorage");
      return;
    }

    user.style = customize;
    localStorage.setItem("user", JSON.stringify(user));

    // Call API to update style in MongoDB
    try {
      const response = await fetch("/api/set_default_style", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          customize: customize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to update style: ${data.message}`);
      } else {
        toast.success("Style updated successfully as default!");
      }
    } catch (error) {
      toast.error("An error occurred while updating style.");
    }
  };

  return (
    <div className="flex flex-col w-full gap-3 bg-white shadow-lg h-full overflow-y-auto hide-scrollbar p-5 rounded-2xl mt-15 items-start">
      <div className="flex items-end justify-between w-full">
        <div className="w-1/3">
          <SelectBox
            label="Font Family"
            value={customize.font_family}
            onValueChange={(value) =>
              updateCustomizeObject({ font_family: value })
            }
            options={font_family}
            placeholder="Font"
          />
        </div>

        <div className="w-1/3">
          <SelectBox
            label="Font Size"
            value={customize.font_size}
            onValueChange={(value) =>
              updateCustomizeObject({ font_size: value })
            }
            options={font_size}
            placeholder="Size"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              updateCustomizeObject({ is_bold: !customize.is_bold })
            }
            className={`border rounded-lg p-1 text-sm font-medium ${
              customize.is_bold ? "bg-iris white" : "border-gray"
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
            onClick={() =>
              updateCustomizeObject({ is_italic: !customize.is_italic })
            }
            className={`border rounded-lg p-1 text-sm font-medium ${
              customize.is_italic ? "bg-iris white" : "border-gray"
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
            onClick={() =>
              updateCustomizeObject({ is_underline: !customize.is_underline })
            }
            className={`border rounded-lg p-1 text-sm font-medium ${
              customize.is_underline ? "bg-iris white" : "border-gray"
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

      <p className="gray text-[10px]">Select the right font family of your subtitle language.</p>

      <div className="flex justify-between w-full mt-5">
        <div className="flex items-center gap-2">
          <p className="text-[10px]">Font Color</p>
          <ColorPickerBox
            color={customize.font_color}
            onChange={(value) => updateCustomizeObject({ font_color: value })}
          />
          <input
            value={customize.font_color.toUpperCase()}
            type="text"
            onChange={(e) =>
              updateCustomizeObject({ font_color: e.target.value })
            }
            className="w-25 py-1 pl-1 bg-gray white text-xs rounded-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <p className="text-[10px]">Outline Color</p>
          <ColorPickerBox
            color={customize.outline_color}
            onChange={(value) =>
              updateCustomizeObject({ outline_color: value })
            }
          />
          <input
            value={customize.outline_color.toUpperCase()}
            type="text"
            onChange={(e) =>
              updateCustomizeObject({ outline_color: e.target.value })
            }
            className="w-25 py-1 pl-1 bg-gray white text-xs rounded-sm"
          />
        </div>
      </div>

      <div className="flex flex-col w-full mt-5">
        <p className="text-[10px]">Outline Width</p>
        <div className="flex items-center justify-between gap-4">
          <GenericSlider
            min={0}
            max={4}
            step={1}
            value={customize.outline_width}
            onValueChange={(value) =>
              updateCustomizeObject({ outline_width: value })
            }
          />
          <p className="w-10 text-center text-xs">
            {customize.outline_width}px
          </p>
        </div>
      </div>

      <div className="w-full mt-5">
        <SelectBox
          label="Border Style"
          value={customize.border_style}
          onValueChange={(value) =>
            updateCustomizeObject({ border_style: value })
          }
          options={border_style}
        />
      </div>

      <div className="flex items-center gap-2 mt-5 w-full">
        <p className="text-[10px]">Background Color</p>
        <ColorPickerBox
          color={customize.background_color}
          onChange={(value) =>
            updateCustomizeObject({ background_color: value })
          }
        />
        <input
          value={customize.background_color.toUpperCase()}
          type="text"
          onChange={(e) =>
            updateCustomizeObject({ background_color: e.target.value })
          }
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
            value={customize.background_opacity}
            onValueChange={(value) =>
              updateCustomizeObject({ background_opacity: value })
            }
          />
          <p className="w-10 text-center text-xs">
            {customize.background_opacity}%
          </p>
        </div>
      </div>

      <div className="flex flex-col w-full mt-5">
        <p className="text-[10px]">Position</p>
        <div className="flex items-center justify-between gap-4">
          <GenericSlider
            min={0}
            max={240}
            step={1}
            value={customize.margin_bottom}
            onValueChange={(value) =>
              updateCustomizeObject({ margin_bottom: value })
            }
          />
          <p className="w-10 text-center text-xs">
            {customize.margin_bottom}px
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center w-full gap-5 mt-10">
        <button
          className="px-5 py-1 rounded-4xl text-xs transition-colors bg-black white hover:bg-gray"
          onClick={resetToDefault}
        >
          Reset to Default
        </button>
        <button
          className="px-5 py-1 rounded-4xl text-xs transition-colors bg-black white hover:bg-gray"
          onClick={saveAsDefault}
        >
          Save as Default
        </button>
      </div>
    </div>
  );
};

export default SubtitleStylingBox;

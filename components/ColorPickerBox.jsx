"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";

const ColorPickerBox = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-1">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger className="flex items-center gap-2 cursor-pointer">
          <div
            className="w-5 h-5 rounded border"
            style={{ backgroundColor: color }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" sideOffset={5}>
          <HexColorPicker color={color} onChange={onChange} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ColorPickerBox;

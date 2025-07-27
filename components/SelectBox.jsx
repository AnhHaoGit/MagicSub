"use client";

import React from "react";
import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";

const SelectItem = React.forwardRef(({ children, ...props }, forwardedRef) => (
  <Select.Item
    className="flex items-center justify-between px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 focus:bg-gray-200 rounded outline-none"
    {...props}
    ref={forwardedRef}
  >
    <Select.ItemText>{children}</Select.ItemText>
    <Select.ItemIndicator>
      <CheckIcon className="w-3 h-3 text-iris" />
    </Select.ItemIndicator>
  </Select.Item>
));
SelectItem.displayName = "SelectItem";

const SelectBox = ({ label, value, onValueChange, options, placeholder }) => {
  return (
    <div className="w-full flex flex-col items-start">
      <span className="text-[10px] mb-1">{label}</span>
      <Select.Root value={value} onValueChange={onValueChange}>
        <Select.Trigger className="flex justify-between items-center w-full px-2 py-1 bg-white rounded-md shadow cursor-pointer text-xs">
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <ChevronDownIcon className="w-3 h-3" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="z-50 bg-white rounded-md shadow-md max-h-48 overflow-y-auto"
            position="popper"
          >
            <Select.Viewport className="p-1">
              {options.map((opt) => (
                <SelectItem key={opt.label} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};

export default SelectBox;

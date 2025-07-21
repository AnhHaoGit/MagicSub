"use client";

import React from "react";
import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { languages } from "@/lib/languages";

const SelectItem = React.forwardRef(({ children, ...props }, forwardedRef) => (
  <Select.Item
    className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 focus:bg-gray-200 rounded outline-none"
    {...props}
    ref={forwardedRef}
  >
    <Select.ItemText>{children}</Select.ItemText>
    <Select.ItemIndicator>
      <CheckIcon className="w-4 h-4 text-iris" />
    </Select.ItemIndicator>
  </Select.Item>
));
SelectItem.displayName = "SelectItem";

const LanguageSelect = ({ targetLanguage, handleTargetLanguageChange }) => {
  return (
    <>
      <div className="w-full flex flex-col items-start mt-5">
        <span className="text-xs mb-2">Target Language</span>
        <Select.Root
          value={targetLanguage}
          onValueChange={handleTargetLanguageChange}
        >
          <Select.Trigger className="flex justify-between items-center w-full p-3 bg-white rounded-lg shadow-md cursor-pointer text-sm">
            <Select.Value placeholder="Select a language" />
            <Select.Icon>
              <ChevronDownIcon />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              className="z-50 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto"
              position="popper"
            >
              <Select.Viewport className="p-2">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
    </>
  );
};

export default LanguageSelect;

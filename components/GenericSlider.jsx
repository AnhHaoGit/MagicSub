"use client";

import * as Slider from "@radix-ui/react-slider";

const GenericSlider = ({
  min,
  max,
  step,
  value,
  onValueChange,
}) => {
  return (
    <div className="flex items-start gap-3 w-full">
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-4"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(val) => onValueChange(val[0])}
      >
        <Slider.Track className="bg-gray-200 relative grow rounded-full h-1">
          <Slider.Range className="absolute bg-iris rounded-full h-1" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 bg-white border border-iris rounded-full shadow hover:bg-iris transition" />
      </Slider.Root>
    </div>
  );
};

export default GenericSlider;

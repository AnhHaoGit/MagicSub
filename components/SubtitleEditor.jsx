import SubtitleSingle from "./SubtitleSingle";

const SubtitleEditor = ({subtitle}) => {

  console.log(subtitle)

  return (
    <div className="flex flex-col gap-3 pr-2">
      {subtitle.map((item) => (
        <SubtitleSingle
          key={item.index}
          start={item.start}
          end={item.end}
          text={item.text}
        />
      ))}
    </div>
  );
};

export default SubtitleEditor;

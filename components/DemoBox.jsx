"use client";

import SubtitleScrollBox from "@/components/SubtitleScrollBox";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import { srtToSecondsTimestamp } from "@/lib/srt_to_second";
import SubtitleStylingBox from "@/components/SubtitleStylingBox";
import fetch_data from "@/lib/fetch_data";
import { useSession } from "next-auth/react";

const DemoBox = () => {
  const videoData = {
    _id: {
      $oid: "68f4adc2cfe9b581556370cd",
    },
    userId: {
      $oid: "68e7b658d1b83ab1e0af69c7",
    },
    cloudUrl:
      "https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/uploads/1760865724407_video_demo.mp4",
    title: "video_demo.mp4",
    size: 47980383,
    duration: 343.933968,
    createdAt: "2025-10-19T09:22:04.142Z",
    customize: {
      font_family: "Roboto",
      font_size: 8,
      is_bold: false,
      is_italic: false,
      is_underline: false,
      font_color: "#FFFFFF",
      outline_color: "#000000",
      outline_width: 2,
      border_style: "opaque_box",
      background_color: "#000000",
      background_opacity: 55,
      margin_bottom: 15,
    },
    thumbnailUrl:
      "https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/thumbnails/1760865733101_2243f968-b8d1-4648-802d-3a030648c529.jpg",
    cloudUrls: [
      {
        id: 1760865798557,
        url: "https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/generated_videos/video_1760865798557.mp4",
        createdAt: "2025-10-19T09:28:57.915Z",
      },
      {
        id: 1760867857760,
        url: "https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/generated_videos/video_1760867857760.mp4",
        createdAt: "2025-10-19T10:03:25.310Z",
      },
    ],
  };

  const subtitleSourceCode = {
    _id: {
      $oid: "68f4adf1cfe9b581556370ce",
    },
    language: "en",
    userId: {
      $oid: "68e7b658d1b83ab1e0af69c7",
    },
    videoId: {
      $oid: "68f4adc2cfe9b581556370cd",
    },
    subtitle: [
      {
        index: "4c8d0657-dde2-402f-8bc4-0c4fbc5163ac",
        start: "00:00:00,000",
        end: "00:00:24,120",
        text: "Good morning.",
      },
      {
        index: "624945d7-7dc2-41db-870d-3bee204ac26f",
        start: "00:00:24,120",
        end: "00:00:29,958",
        text: "On the 25th anniversary of the adoption of U.N. Security Council Resolution 3020,",
      },
      {
        index: "8f8f3494-afbf-4b68-b283-686ba9c3209a",
        start: "00:00:29,958",
        end: "00:00:36,598",
        text: "25, on Women, Peace and Security, we reaffirm our unwavering commitment to advancing the",
      },
      {
        index: "452facfa-8e62-43b1-a3a3-b27a2141f729",
        start: "00:00:36,598",
        end: "00:00:39,820",
        text: "Women, Peace and Security agenda.",
      },
      {
        index: "d7939ecf-6510-4f36-962c-49b06b4a3f3b",
        start: "00:00:39,820",
        end: "00:00:48,639",
        text: "In this regard, we, the representatives of Denmark, France, Greece, Guyana, Panama, the",
      },
      {
        index: "51d8b4ab-f535-42af-88f1-f2cd19b1575a",
        start: "00:00:48,639",
        end: "00:00:55,200",
        text: "Republic of Korea, Sierra Leone, Slovenia, and the United Kingdom, signatories of the",
      },
      {
        index: "2a5dc180-ed9d-4353-9966-6edcf83a8404",
        start: "00:00:55,200",
        end: "00:01:01,798",
        text: "shared commitments on Women, Peace and Security of the Security Council, first, reiterate our",
      },
      {
        index: "234512eb-da95-45d5-bbac-facade352372",
        start: "00:01:01,798",
        end: "00:01:07,319",
        text: "determination to uphold international law, including international humanitarian law and",
      },
      {
        index: "2df25077-e43d-40ef-882d-d0dc1186879b",
        start: "00:01:07,319",
        end: "00:01:13,400",
        text: "international human rights law, and to fully implement all Security Council resolutions on",
      },
      {
        index: "95a478a4-9271-43d1-86da-7374e9b91526",
        start: "00:01:13,400",
        end: "00:01:20,278",
        text: "Women, Peace and Security across all conflicts and situations on the Council's agenda.",
      },
      {
        index: "5d2b48d5-8985-4b24-86b1-9b05dbbab68e",
        start: "00:01:20,278",
        end: "00:01:26,480",
        text: "Second, call for the full, equal, meaningful, and safe participation and leadership of women",
      },
      {
        index: "2d525eef-7e28-48e8-93ea-580a7f6706c0",
        start: "00:01:26,480",
        end: "00:01:28,638",
        text: "in peace processes.",
      },
      {
        index: "cd8839f4-88d9-4fc5-b8aa-d0d758ebd53e",
        start: "00:01:28,638",
        end: "00:01:34,778",
        text: "Join the Secretary-General's call for women to make up at least one-third of all participants",
      },
      {
        index: "3c72c4f6-8285-46fe-a647-4895931fb865",
        start: "00:01:34,778",
        end: "00:01:42,000",
        text: "in U.N.-led or co-led peace processes, and urge all stakeholders, including the U.N.,",
      },
      {
        index: "0336fbb3-6264-4481-9f0b-21f8e948e07d",
        start: "00:01:42,000",
        end: "00:01:47,778",
        text: "to make women's participation the norm at every stage of peace processes, with the goal",
      },
      {
        index: "d91c9197-4179-402f-8c1f-e02461d7f81c",
        start: "00:01:47,778",
        end: "00:01:49,879",
        text: "of reaching 50 percent.",
      },
      {
        index: "ee8995ba-395c-4d13-8842-fdf2ede32a3b",
        start: "00:01:49,879",
        end: "00:01:55,638",
        text: "Third, invite the U.N. Department of Political and Peacebuilding Affairs, together with U.N.",
      },
      {
        index: "32b0fd1c-7c65-4c49-a600-d925c5edb83f",
        start: "00:01:55,638",
        end: "00:02:02,239",
        text: "Women, to provide regular and real-time updates on the progress of women's participation in",
      },
      {
        index: "6311779a-821a-4ef1-8434-61699e731bcf",
        start: "00:02:02,239",
        end: "00:02:08,879",
        text: "all relevant peace and security processes, including peace negotiations and transitions.",
      },
      {
        index: "65fee48c-1ac4-4d56-aefb-3c1cfb3782e1",
        start: "00:02:08,879",
        end: "00:02:16,399",
        text: "Fourth, express deep concern over the growing weaponization of gender by state and non-state",
      },
      {
        index: "725f51f6-d5fc-440f-addd-6a464c6b242e",
        start: "00:02:16,399",
        end: "00:02:22,399",
        text: "actors, and call for a gender-responsive approach to our response to transnational",
      },
      {
        index: "938a239a-e9db-4187-b830-df0fa77dfce8",
        start: "00:02:22,399",
        end: "00:02:23,399",
        text: "threats.",
      },
      {
        index: "634f8eda-7d72-41d2-ab49-98e4e71fa36a",
        start: "00:02:23,399",
        end: "00:02:30,399",
        text: "Fifth, call for the adoption of the longstanding 50 percent minimum funding target for gender",
      },
      {
        index: "2976727b-6be0-450f-b34a-eb4106908575",
        start: "00:02:30,399",
        end: "00:02:37,639",
        text: "equality as a core objective in U.N. peacebuilding funds, as well as by all donors in their official",
      },
      {
        index: "0161ea5c-a154-46d3-a782-56c87a2e0d92",
        start: "00:02:37,639",
        end: "00:02:43,240",
        text: "development assistance, humanitarian aid, post-conflict reconstruction, transitional",
      },
      {
        index: "9c7026f2-9a91-482d-93e2-e23c9332dc89",
        start: "00:02:43,240",
        end: "00:02:50,639",
        text: "justice, and counterterrorism funding, and to ensure that such funding is tracked separately.",
      },
      {
        index: "68711748-d616-4824-95e6-374710796bb9",
        start: "00:02:50,639",
        end: "00:02:58,520",
        text: "Sixth, urge all relevant U.N. sanctions committees to convene dedicated meetings on gender-related",
      },
      {
        index: "e498603d-e269-4cce-9a4e-c7c4ac621544",
        start: "00:02:58,520",
        end: "00:03:05,118",
        text: "issues, including briefings by gender experts, and to ensure that their mandates and designation",
      },
      {
        index: "75a7a654-5a48-4ce7-a860-a578c17044c5",
        start: "00:03:05,118",
        end: "00:03:11,639",
        text: "criteria explicitly address systematic violations of women's rights and sexual and gender-based",
      },
      {
        index: "f220554c-b8df-402a-91b4-0ad4217d10f8",
        start: "00:03:11,639",
        end: "00:03:12,639",
        text: "violence.",
      },
      {
        index: "d2d592ec-51ee-446d-bbb9-b325416a6fa0",
        start: "00:03:13,038",
        end: "00:03:20,399",
        text: "Seventh, call for full integration of the Women, Peace, and Security Agenda in all peace operations,",
      },
      {
        index: "eba79eac-4406-4fe1-b25f-9a716b211780",
        start: "00:03:20,399",
        end: "00:03:26,960",
        text: "and to ensure the continuity of work on this agenda in mission transitions and withdrawals,",
      },
      {
        index: "c2bd95ee-25fe-4b74-b0a3-cd008eb8dd0d",
        start: "00:03:26,960",
        end: "00:03:34,038",
        text: "including through retaining or further deploying gender and women's protection advisors.",
      },
      {
        index: "4331733f-a755-4eaf-92a3-c531d3aed49a",
        start: "00:03:34,038",
        end: "00:03:40,919",
        text: "Eighth, commit to enhancing protection and support for women human rights defenders, including",
      },
      {
        index: "3e438cc9-76f0-4f6a-a725-5658d6aef5af",
        start: "00:03:40,919",
        end: "00:03:48,599",
        text: "through dedicated flexible funding for specialized mechanisms for their protection, and emphasize",
      },
      {
        index: "7710fb47-9682-42b3-b190-fa995bbdb976",
        start: "00:03:48,599",
        end: "00:03:55,879",
        text: "that the risks they face must never be used as a pretext to limit their rights to participate",
      },
      {
        index: "c22b9903-a6a2-4a33-99c7-44c3280e21aa",
        start: "00:03:55,879",
        end: "00:03:59,520",
        text: "or to express their independent views.",
      },
      {
        index: "aef96933-576c-4f56-a9c1-23ee9abb4b66",
        start: "00:04:00,000",
        end: "00:04:08,159",
        text: "Ninth, reaffirm our commitment to ensuring that victims and survivors of sexual and gender-based",
      },
      {
        index: "553d183c-5fdc-4fd2-be37-57a4cee87a01",
        start: "00:04:08,159",
        end: "00:04:16,879",
        text: "violence in conflicts receive the care required by their specific needs and without any discrimination.",
      },
      {
        index: "9d19612f-f0d7-4879-8057-ba5299f0ee31",
        start: "00:04:16,879",
        end: "00:04:23,279",
        text: "Tenth, underscore the importance of accountability for all violations of human rights of women",
      },
      {
        index: "3922036c-0b38-4834-98d9-53bb53c9efb7",
        start: "00:04:23,279",
        end: "00:04:29,600",
        text: "and girls, and emphasize our support for the core international justice institutions, including",
      },
      {
        index: "f9e84228-e517-49ed-8765-00543cc344fd",
        start: "00:04:29,600",
        end: "00:04:38,399",
        text: "the ICC and ICJ. 11. Affirm that reproductive violence constitutes a violation of international",
      },
      {
        index: "0a4b096b-b971-4f35-86c8-4f83e1bf2db3",
        start: "00:04:38,399",
        end: "00:04:45,199",
        text: "law. Commit to ending impunity, and call for immediate and non-discriminatory access",
      },
      {
        index: "c86a20a8-9adf-4320-bac3-ebea4ff3a715",
        start: "00:04:45,199",
        end: "00:04:51,439",
        text: "to medical support for victims and survivors of war, including access to sexual and reproductive",
      },
      {
        index: "447c1ee6-728b-4d16-ba7e-0fe62c7bd873",
        start: "00:04:51,439",
        end: "00:04:57,199",
        text: "health and rights services, and psychosocial support for victims and survivors of sexual",
      },
      {
        index: "828f7f72-c48d-4b50-b5dc-219e1ae7b960",
        start: "00:04:57,199",
        end: "00:05:04,079",
        text: "violence. This is the time to act. We call on all current and future Council members",
      },
      {
        index: "4af97371-b04d-4090-8c12-6df1ab7b2a7f",
        start: "00:05:04,079",
        end: "00:05:10,079",
        text: "to ensure that the decisions and deliberations of the Security Council continue to highlight",
      },
      {
        index: "b7daafd2-c432-4fa0-8728-fb253201d651",
        start: "00:05:10,079",
        end: "00:05:17,199",
        text: "the impact of conflict on women and girls, to strengthen their participation, and to ensure",
      },
      {
        index: "f97416e8-8796-473d-b246-f2844c1fae02",
        start: "00:05:17,199",
        end: "00:05:32,079",
        text: "that these decisions are implemented, not ignored. Thank you.",
      },
    ],
    endpoints: [0, 343.933968],
  };

  const [subtitle, setSubtitle] = useState(subtitleSourceCode.subtitle);
  const [customize, setCustomize] = useState(videoData.customize);
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [isTranscript, setIsTranscript] = useState(true);
  const videoRef = useRef(null);
  const animationFrameId = useRef(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session && status === "authenticated") {
      fetch_data(session);
    }
  }, [session, status]);

  // can not use useEffect right here because we need to save reference whenever we run requestAnimationFrame.
  // if we use useEffect, the syncLoop will be recreated when calling requestAnimationFrame, resulting in bugs.
  const syncLoop = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;

      const active = subtitle.find(
        (item) =>
          srtToSecondsTimestamp(item.start) <= time &&
          srtToSecondsTimestamp(item.end) >= time
      );

      setCurrentSubtitle(active);
    }

    // Schedule the next sync using requestAnimationFrame for smooth updates
    animationFrameId.current = requestAnimationFrame(syncLoop);
  }, [subtitle]); // Re-create this function only when 'subtitle' changes

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => {
      if (!animationFrameId.current) {
        syncLoop();
      }
    };

    const handlePause = () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };

    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handlePause);

    // Cleanup function to remove event listeners when component unmounts or deps change
    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handlePause);
    };
  }, [syncLoop]); // Re-run effect only when syncLoop function changes

  const handleTranscriptButton = () => {
    setIsTranscript(true);
  };

  const handleStyleButton = () => {
    setIsTranscript(false);
  };

  let subtitleClasses = `${customize.is_bold ? "font-bold" : ""} ${
    customize.is_italic ? "italic" : ""
  } ${customize.is_underline ? "underline" : ""}  text-[${
    customize.font_color
  }] absolute left-1/2 transform -translate-x-1/2 text-center leading-tight break-words inline-block max-w-full 
bg-[${customize.background_color}]`;
  const strokeLayers = [];
  const steps = 64;
  const radius = customize.outline_width;

  for (let i = 0; i < steps; i++) {
    const angle = (i * 360) / steps;
    const rad = (angle * Math.PI) / 180;

    const x = (Math.cos(rad) * radius).toFixed(2);
    const y = (Math.sin(rad) * radius).toFixed(2);

    strokeLayers.push(`${x}px ${y}px 0 ${customize.outline_color}`);
  }

  const textShadow = strokeLayers.join(", ");

  function hexToRGBA(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-between items-center w-full flex-1 p-5 gap-5">
        {/* Left section */}
        <div className="flex flex-col w-full lg:w-3/5 gap-5 h-[600px]">
          <div className="flex flex-col relative items-center justify-center w-full bg-black rounded-2xl h-full">
            <video
              ref={videoRef}
              controls
              src="https://magicsub-storage.s3.ap-southeast-2.amazonaws.com/video_demo.mp4"
              className="shadow-xl w-full m-auto rounded-xl"
            ></video>
            {currentSubtitle && (
              <div
                className={subtitleClasses}
                style={{
                  color: customize.font_color,
                  bottom: `${customize.margin_bottom}px`,
                  fontSize: `${customize.font_size + 6}px`,
                  backgroundColor: `${
                    customize.border_style === "text_outline"
                      ? "transparent"
                      : hexToRGBA(
                          customize.background_color,
                          customize.background_opacity
                        )
                  }`,
                  textShadow: `${
                    customize.border_style === "text_outline"
                      ? textShadow
                      : "none"
                  }`,
                  fontFamily: customize.font_family,
                }}
              >
                {currentSubtitle.text}
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="w-full lg:w-2/5 h-[600px] flex flex-col items-center gap-10 bg-smoke rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-center shadow-lg gap-3 sm:gap-5 bg-white p-2 rounded-4xl">
            <button
              onClick={handleTranscriptButton}
              className={`w-24 gap-2 sm:w-30 flex justify-center items-center sm:text-base black hover:bg-zinc-200 rounded-2xl py-1`}
            >
              {isTranscript ? (
                <div className="h-[10px] w-[10px] rounded-full bg-iris"></div>
              ) : (
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
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
              )}
              <span className="text-xs">Transcript</span>
            </button>
            <button
              onClick={handleStyleButton}
              className={`w-24 gap-2 sm:w-30 flex justify-center items-center sm:text-base black hover:bg-zinc-200 rounded-2xl py-1`}
            >
              {!isTranscript ? (
                <div className="h-[10px] w-[10px] rounded-full bg-iris"></div>
              ) : (
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
                    d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                  />
                </svg>
              )}
              <span className="text-xs">Style</span>
            </button>
          </div>

          {isTranscript ? (
            <SubtitleScrollBox
              subtitle={subtitle}
              setSubtitle={setSubtitle}
              activeSubtitleIndex={
                currentSubtitle ? currentSubtitle.index : null
              }
            />
          ) : (
            <SubtitleStylingBox
              customize={customize}
              setCustomize={setCustomize}
              demo={true}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default DemoBox;

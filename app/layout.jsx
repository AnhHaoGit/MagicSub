import SessionWrapper from "@/components/SessionWraper";
import { ToastContainer } from "react-toastify";
import "./globals.css";

export const metadata = {
  title: "MagicSub",
  description:
    "Add subtitles to any video in any language — instantly with AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
        <ToastContainer position="top-center" autoClose={3000} />
      </body>
    </html>
  );
}

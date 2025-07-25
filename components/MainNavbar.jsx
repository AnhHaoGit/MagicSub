import React from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";

const MainNavbar = () => {
  return (
    <nav className=" fixed top-0 left-0 w-full rounded-b-2xl shadow-[0_0_30px_rgba(76,59,207,0.3)] bg-white z-50">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center">
            <Image src={logo} alt="LingoTube" width={30} />
            <p className="black text-2xl ml-2 font-semibold">MagicSub</p>
          </Link>
          <Link href="/" className="hover:light-gray ml-4">
            Home
          </Link>
          <Link href="/history" className="hover:light-gray">
            History
          </Link>
          <Link href="/feedback" className="hover:light-gray">
            Feedback
          </Link>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Link href='/main' className="px-5 py-2 bg-iris text-white rounded-full hover:bg-violet transition-colors cursor-pointer">
            + New video
          </Link>
          <p className="border-2 border-iris rounded-full px-4 py-2">
            Gems: 100 💎
          </p>
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;

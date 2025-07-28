import React from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

const LandingPageNavbar = () => {
  const { data: session } = useSession();

  const handleSignout = () => {
    localStorage.removeItem("videos");
    localStorage.removeItem("user");
    signOut();
  };
  return (
    <>
      <nav className="fixed top-0 left-0 w-full">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center">
              <Image src={logo} alt="LingoTube" width={30} />
              <p className="black text-2xl ml-2 font-semibold">MagicSub</p>
            </Link>
            <Link href="/feedback" className="hover:light-gray">
              Feedback
            </Link>
            <Link href="/" className="hover:light-gray">
              Pricing
            </Link>
            <Link href="/" className="hover:light-gray">
              FAQ
            </Link>
            {session && (
              <button onClick={handleSignout} className="hover:light-gray">
                Logout
              </button>
            )}
          </div>
          {!session ? (
            <div className="flex items-center gap-5">
              <Link href="/signup" className="hover:light-gray">
                Sign up
              </Link>

              <Link href="/login" className="hover:light-gray">
                Login
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <p className="font-semibold">
                🎉 Welcome, {session.user.email} 🎉
              </p>

              <Link
                href="/main"
                className="bg-iris px-7 py-3 text-white rounded-4xl hover:bg-violet transition-colors cursor-pointer"
              >
                Go to App
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default LandingPageNavbar;

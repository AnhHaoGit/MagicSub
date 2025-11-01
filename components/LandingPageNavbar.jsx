import React, { useState } from "react";
import Image from "next/image";
import logo from "@/assets/logo.png";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

const LandingPageNavbar = () => {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignout = () => {
    localStorage.removeItem("videos");
    localStorage.removeItem("user");
    signOut();
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
        {/* Left side: Logo + links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image src={logo} alt="MagicSub" width={30} />
            <p className="black text-xl sm:text-2xl ml-2 font-semibold">
              MagicSub
            </p>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {session ? (
              <>
                <Link href="/history" className="hover:text-gray-600">
                  History
                </Link>
                {/* <Link href="/pricing" className="hover:text-gray-600">
                  Pricing
                </Link> */}
                {/* {session.user.subscription && (
                  <Link href="/subscription" className="hover:text-gray-600">
                    Subscription
                  </Link>
                )} */}
                <button onClick={handleSignout} className="hover:text-gray-600">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/signup" className="hover:text-gray-600">
                  Sign up
                </Link>
                <Link href="/login" className="hover:text-gray-600">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right side: welcome + button */}
        <div className="hidden md:flex items-center gap-5">
          {session && (
            <p className="font-semibold hidden lg:block text-gray-700">
              🎉 Welcome, {session.user.email} 🎉
            </p>
          )}
          {session && (
            <Link
              href="/main"
              className="bg-black px-5 py-2 text-white rounded-3xl hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Go to App
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-black"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown mobile menu */}
      <div
        className={`md:hidden bg-white shadow-lg rounded-b-xl overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-4 px-6 py-6">
          {session ? (
            <>
              <Link href="/history" className="hover:text-gray-600">
                History
              </Link>
              {/* <Link href="/pricing" className="hover:text-gray-600">
                Pricing
              </Link> */}
              <button
                onClick={handleSignout}
                className="hover:text-gray-600 text-left"
              >
                Logout
              </button>
              {/* {session.user.subscription && (
                <Link href="/subscription" className="hover:text-gray-600">
                  Subscription
                </Link>
              )} */}
              <Link
                href="/main"
                className="bg-black px-5 py-2 text-white rounded-3xl hover:bg-gray-800 transition-colors cursor-pointer text-center"
              >
                Go to App
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="hover:text-gray-600">
                Sign up
              </Link>
              <Link href="/login" className="hover:text-gray-600">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default LandingPageNavbar;

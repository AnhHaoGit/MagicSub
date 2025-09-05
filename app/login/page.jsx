"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Google } from "@lobehub/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";

function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  if (authError === "OAuthAccountNotLinked") {
    toast.error(authError);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result.ok) {
      toast.success("Login successful!");
      router.push("/");
    } else {
      toast.error("Invalid credentials");
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <main className="flex items-center justify-center min-h-screen px-4 sm:px-6">
      {/* Back button */}
      <div className="flex justify-between items-center p-4 fixed top-0 left-0">
        <Link href="/" className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6 gray"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18"
            />
          </svg>

          <p className="text-sm ml-2 black">back to home</p>
        </Link>
      </div>

      {/* Login card */}
      <div className="flex flex-col items-center justify-center w-11/12 sm:w-4/5 md:w-2/3 lg:w-5/12 py-12 sm:py-16 md:py-20 shadow-2xl rounded-4xl bg-smoke">
        {/* Title */}
        <div className="flex flex-wrap items-center justify-center text-xl sm:text-2xl md:text-3xl lg:text-4xl text-center">
          <h1 className="font-bold">Welcome Back To</h1>
          <p className="bg-black white font-bold ml-2 px-1">MagicSub</p>
          <h1 className="font-bold ml-2">!!!</h1>
        </div>

        <p className="text-sm sm:text-base text-center mt-4 gray">
          Login to access your account
        </p>

        {/* Form */}
        <form
          className="flex flex-col items-center justify-center gap-4 mt-10 sm:mt-12 md:mt-16 w-11/12 sm:w-4/5"
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <div className="flex items-center bg-white rounded-full p-3 sm:p-4 w-full shadow-md group transition-colors duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5 sm:size-6 light-gray icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
            <div className="w-[1px] h-5 bg-light-gray ml-3"></div>
            <input
              type="email"
              placeholder="Email"
              className="bg-white border-none outline-none w-full ml-3 text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="flex items-center bg-white rounded-full p-3 sm:p-4 w-full shadow-md group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5 sm:size-6 light-gray icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
            <div className="w-[1px] h-5 bg-light-gray ml-3"></div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="bg-white border-none outline-none w-full ml-3 text-sm sm:text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="ml-2 focus:outline-none"
            >
              {/* Eye icon giữ nguyên */}
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5 text-light-gray"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5 text-light-gray"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="bg-iris text-white rounded-full py-3 sm:py-4 w-full shadow-md flex items-center justify-center hover:bg-violet transition-colors cursor-pointer text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mt-4 sm:mt-6 w-4/5">
          <div className="w-full h-0.5 bg-gray opacity-20"></div>
          <p className="text-xs sm:text-sm text-center gray opacity-50">or</p>
          <div className="w-full h-0.5 bg-gray opacity-20"></div>
        </div>

        {/* Google login */}
        <button
          className="bg-white rounded-full py-3 sm:py-4 w-11/12 sm:w-4/5 shadow-md flex items-center justify-center hover:bg-light-gray transition-colors mt-3 cursor-pointer text-sm sm:text-base"
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
        >
          <Google.Color size={20} />
          <p className="ml-2">
            {loadingGoogle ? "Logging in..." : "Continue with Google"}
          </p>
        </button>

        {/* Signup link */}
        <p className="text-xs sm:text-sm text-center mt-4">
          Don't have an account?{" "}
          <Link href="/signup" className="iris underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

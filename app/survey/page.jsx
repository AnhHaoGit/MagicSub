"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";

const SurveyPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [selectedSource, setSelectedSource] = useState("");
  const [loading, setLoading] = useState(false);

  const options = [
    "Instagram",
    "X",
    "Youtube",
    "Facebook",
    "TikTok",
    "Google",
    "Friend referral",
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleSubmit = async () => {
    if (!selectedSource) return toast.error("Please select a source!");
    if (!session?.user?.id) return toast.error("User ID not found!");

    try {
      setLoading(true);
      const res = await fetch("/api/update_source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          source: selectedSource,
        }),
      });

      if (!res.ok) throw new Error("Failed to update source.");

      toast.success("Thank you for your feedback!");
      router.push("/");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            How did you hear about this app?
          </h1>
        </CardHeader>

        <CardContent className="space-y-4">
          {options.map((opt) => (
            <div key={opt} className="flex items-center space-x-2">
              <input
                type="radio"
                id={opt}
                name="source"
                value={opt}
                checked={selectedSource === opt}
                onChange={() => setSelectedSource(opt)}
                className="cursor-pointer"
              />
              <label htmlFor={opt} className="cursor-pointer text-gray-700">
                {opt}
              </label>
            </div>
          ))}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 bg-iris hover:bg-violet text-white"
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SurveyPage;

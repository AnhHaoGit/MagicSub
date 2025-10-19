const fetch_data = async (session) => {
  try {
    const response = await fetch("/api/fetch_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: session.user.id }),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    localStorage.setItem("videos", JSON.stringify(data));
    localStorage.setItem("user", JSON.stringify(session.user));
  } catch (error) {
    toast.error("Failed to fetch data:", error);
  }
};

export default fetch_data

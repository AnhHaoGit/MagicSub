import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter();
  const { checkout_id } = router.query;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-green-600 mb-4">
        Thanh toán thành công 🎉
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        Cảm ơn bạn đã mua gói dịch vụ của MagicSub.
      </p>

      {checkout_id && (
        <p className="text-sm text-gray-500">
          Mã giao dịch: <span className="font-mono">{checkout_id}</span>
        </p>
      )}

      <button
        onClick={() => router.push("/dashboard")}
        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
      >
        Về trang Dashboard
      </button>
    </div>
  );
}

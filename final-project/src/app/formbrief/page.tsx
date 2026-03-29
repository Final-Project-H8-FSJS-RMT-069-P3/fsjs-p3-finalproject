import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

interface FormBriefPageProps {
  params: {
    userId: string;
  };
}

export default async function FormBriefPage({ params }: FormBriefPageProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/");
  }

  const { userId } = params;

  const res = await fetch(`/api/formbrief?userId=${userId}`, {
    cache: "no-store",
  });

  const data = await res.json();

  return (
    <div className="min-h-screen p-10 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Form Brief List</h1>

      {data.length === 0 ? (
        <p className="text-gray-500">No data available for this user</p>
      ) : (
        <div className="space-y-4">
          {data.map((item: any) => {
            const brief = item.brief || {};

            return (
              <div
                key={item._id}
                className="bg-white p-5 rounded-xl shadow border"
              >
                <p><strong>Nama:</strong> {brief.nama || "-"}</p>
                <p>
                  <strong>Keluhan:</strong>{" "}
                  {brief.keluhanUtama?.join(", ") || "-"}
                </p>
                <p><strong>Durasi:</strong> {brief.durasiKeluhan || "-"}</p>
                <p><strong>Mood:</strong> {brief.mood || "-"}</p>

                <p className="mt-2 text-xs text-gray-400">
                  Created: {new Date(item.createdAt).toLocaleString()}
                </p>

                {item.result && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                    <strong>AI Result:</strong>
                    <p className="mt-1 whitespace-pre-line">
                      {item.result}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
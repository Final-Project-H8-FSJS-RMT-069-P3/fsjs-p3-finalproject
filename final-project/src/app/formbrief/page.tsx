import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

interface FormBriefPageProps {
  searchParams?: {
    userId?: string;
  };
}

interface Brief {
  nama?: string;
  keluhanUtama?: string[];
  durasiKeluhan?: string;
  mood?: string;
}

interface FormBriefItem {
  _id: string;
  brief?: Brief;
  createdAt: string;
  result?: string;
}

export default async function FormBriefPage({
  searchParams,
}: FormBriefPageProps) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/");
  }

  const userId = searchParams?.userId;
  if (!userId) {
    redirect("/");
  }

  // await headers() to get ReadonlyHeaders (fixes TS2339)
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(
    `${baseUrl}/api/formbrief?userId=${encodeURIComponent(userId)}`,
    {
      cache: "no-store",
    },
  );

  const data: FormBriefItem[] = res.ok ? await res.json() : [];

  return (
    <div className="min-h-screen p-10 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Form Brief List</h1>

      {data.length === 0 ? (
        <p className="text-gray-500">No data available for this user</p>
      ) : (
        <div className="space-y-4">
          {data.map((item: FormBriefItem) => {
            const brief = item.brief || {};

            return (
              <div
                key={item._id}
                className="bg-white p-5 rounded-xl shadow border"
              >
                <p>
                  <strong>Nama:</strong> {brief.nama || "-"}
                </p>
                <p>
                  <strong>Keluhan:</strong>{" "}
                  {brief.keluhanUtama?.join(", ") || "-"}
                </p>
                <p>
                  <strong>Durasi:</strong> {brief.durasiKeluhan || "-"}
                </p>
                <p>
                  <strong>Mood:</strong> {brief.mood || "-"}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Created: {new Date(item.createdAt).toLocaleString()}
                </p>

                {item.result && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
                    <strong>AI Result:</strong>
                    <p className="mt-1 whitespace-pre-line">{item.result}</p>
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

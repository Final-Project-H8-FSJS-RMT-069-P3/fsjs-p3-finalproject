import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import ReactMarkdown from "react-markdown";

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

interface FormBriefPageProps {
  params: {
    userId: string;
  };
}
function parseBrief(briefData: unknown): Brief {
  if (!briefData) return {};

  try {
    if (typeof briefData === "string") {
      return JSON.parse(briefData);
    }
    return briefData as Brief;
  } catch (err) {
    console.error("Parse error:", briefData);
    return {};
  }
}

export default async function FormBriefPage({ params }: FormBriefPageProps) {
  // 1️⃣ Auth check
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 2️⃣ Get userId from params
  const { userId } = await params;
  console.log("session.user.id:", session.user.id);
  console.log("session.user.role:", session.user.role);
  console.log("params userId:", userId);
  if (session.user.role !== "DOCTOR" && session.user.id !== userId)
    redirect("/");

  // 3️⃣ Fetch data from API (server component can use relative URL)
  let data: FormBriefItem[] = [];
  try {
    const cookiesStore = await cookies();
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL
      }/api/formbrief?userId=${encodeURIComponent(userId)}`,
      {
        cache: "no-store",
        headers: {
          Cookie: cookiesStore
            .getAll()
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join("; "),
        },
      }
    );
    console.log("RES:", res);

    if (res.ok) {
      data = (await res.json()) as FormBriefItem[];
    } else {
      console.warn("API returned non-ok status:", res.status);
    }
  } catch (err) {
    console.error("Failed to fetch form brief data:", err);
  }

  // 4️⃣ Render JSX
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Form Brief List
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {data.length} record{data.length !== 1 ? "s" : ""} ditemukan
          </p>
          <div className="mt-4 h-px bg-gray-200" />
        </div>

        {/* Empty State */}
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">
              Belum ada data tersedia
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Data akan muncul setelah form diisi
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => {
              const brief = parseBrief(item.brief);

              return (
                <div
                  key={item._id}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {brief.nama || "Tanpa Nama"}
                      </h2>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {brief.mood && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        {brief.mood}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-4 h-px bg-gray-100" />

                  {/* Detail grid */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Keluhan Utama
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {brief.keluhanUtama?.join(", ") || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Durasi Keluhan
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {brief.durasiKeluhan || "-"}
                      </p>
                    </div>
                  </div>

                  {/* AI Result */}
                  {item.result && (
                    <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                        AI Result
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-blue-900">
                        <ReactMarkdown>{item.result}</ReactMarkdown>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";


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
  if (session.user.role !== "DOCTOR") redirect("/");

  // 2️⃣ Get userId from params
  const {userId} =await params;

  // 3️⃣ Fetch data from API (server component can use relative URL)
  let data: FormBriefItem[] = [];
  try {
    const cookiesStore=await cookies()
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/formbrief?userId=${encodeURIComponent(userId)}`, {
      cache: "no-store",
      headers:{
        Cookie:cookiesStore.getAll().map((cookie) => `${cookie.name}=${cookie.value}`).join("; ") 
      }
    });
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
    <div className="min-h-screen p-10 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Form Brief List</h1>

      {data.length === 0 ? (
        <p className="text-gray-500">No data available for this user</p>
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const brief = parseBrief(item.brief);
            
            return (
              <div key={item._id} className="bg-white p-5 rounded-xl shadow border">
                <p>
                  <strong>Nama:</strong> {brief.nama}
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
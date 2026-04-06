import { NextResponse } from "next/server";
import { getOfficesWithWaiting } from "@/lib/api-clients";

export async function GET() {
  try {
    const offices = await getOfficesWithWaiting();
    return NextResponse.json({ offices });
  } catch (error) {
    console.error("Offices API error:", error);
    return NextResponse.json(
      { error: "민원실 정보를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

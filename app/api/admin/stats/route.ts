import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/models/Student";
import { HouseType, HOUSE_CONFIG } from "@/config/houses";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  // Check admin password
  const authError = requireAdmin(request);
  if (authError) return authError;

  try {
    await connectDB();

    const total = await Student.countDocuments();

    const allHouses = Object.keys(HOUSE_CONFIG) as HouseType[];

    const houseCounts: Record<HouseType, number> = allHouses.reduce(
      (acc, house) => {
        acc[house] = 0;
        return acc;
      },
      {} as Record<HouseType, number>
    );

    for (const house of allHouses) {
      const count = await Student.countDocuments({ house });
      houseCounts[house] = count;
    }

    return NextResponse.json({
      stats: {
        total,
        houses: houseCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}


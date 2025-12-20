import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { getAuthUser } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    const items = await db.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        createdAt: true,
        mindMapId: true,
        workspaceId: true,
      },
    });

    return apiSuccess({ items });
  } catch (error) {
    return apiFail(error instanceof Error ? error : "Failed to fetch activity");
  }
}

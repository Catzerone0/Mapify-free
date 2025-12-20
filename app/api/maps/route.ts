import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiFail, apiSuccess } from "@/lib/api-response";
import { getAuthUser } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const { searchParams } = request.nextUrl;

    const workspaceId = searchParams.get("workspaceId") || undefined;
    const q = searchParams.get("q") || undefined;
    const sort = searchParams.get("sort") || "recent";

    const take = Math.min(Number(searchParams.get("take") || 20), 100);
    const skip = Math.max(Number(searchParams.get("skip") || 0), 0);

    const orderBy =
      sort === "name"
        ? [{ title: "asc" as const }]
        : sort === "created"
          ? [{ createdAt: "desc" as const }]
          : [{ updatedAt: "desc" as const }];

    const mindMaps = await db.mindMap.findMany({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        workspace: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        provider: true,
        complexity: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { nodes: true, shareLinks: true },
        },
      },
      orderBy,
      skip,
      take,
    });

    const result = mindMaps.map((m) => ({
      ...m,
      nodeCount: m._count.nodes,
      shared: m._count.shareLinks > 0,
    }));

    return apiSuccess({
      mindMaps: result,
      total: result.length,
      take,
      skip,
    });
  } catch (error) {
    return apiFail(error instanceof Error ? error : "Failed to list maps");
  }
}

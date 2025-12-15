import { apiSuccess } from "@/lib/api-response";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    return apiSuccess({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    return apiSuccess(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      503
    );
  }
}

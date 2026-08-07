import { handleApiError, ValidationError } from "@/lib/errors";
import { getCurrentUserId } from "@/modules/auth/server";
import {
  getTodayLook,
  todayLookInputSchema,
} from "@/modules/recommendations/server";

/**
 * POST /api/recommendations
 *
 * Request:  { occasion?, mood?, weather? }
 * Response: TodayLookResult (RecommendationResult + resolved outfit)
 */
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    const body = await request.json().catch(() => ({}));
    const parsed = todayLookInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid recommendation request", {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }

    const look = await getTodayLook(userId, parsed.data);
    return Response.json(look, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

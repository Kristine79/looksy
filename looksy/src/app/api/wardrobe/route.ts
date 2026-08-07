import { handleApiError, ValidationError } from "@/lib/errors";
import { getCurrentUserId } from "@/modules/auth/server";
import {
  addClothingItemWithAnalysis,
  getWardrobeForPage,
  addToWardrobeInputSchema,
} from "@/modules/closet/server";

/**
 * Wardrobe API.
 *
 * GET  /api/wardrobe?type=shirt  -> WardrobeItemWithPhotos[]
 * POST /api/wardrobe             -> { imageData, notes? } -> add + AI analysis
 */
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const url = new URL(request.url);
    const items = await getWardrobeForPage(userId, {
      type: url.searchParams.get("type") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });
    return Response.json(items, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    const body = await request.json().catch(() => ({}));
    const parsed = addToWardrobeInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Invalid wardrobe item", {
        issues: parsed.error.issues.map((issue) => issue.message),
      });
    }

    const result = await addClothingItemWithAnalysis(userId, parsed.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

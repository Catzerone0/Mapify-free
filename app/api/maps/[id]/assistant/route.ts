import { NextRequest } from 'next/server';
import { db as prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/middleware';
import { apiResponse, ApiError } from '@/lib/api-response';
import { AssistantService } from '@/lib/ai/assistant-service';
import { z } from 'zod';
import { decryptKey } from '@/lib/encryption';

const assistantQuestionSchema = z.object({
  question: z.string().min(1).max(1000),
  language: z.string().optional().default('en'),
});

// POST /api/maps/[id]/assistant - Ask a question about the mind map
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    const { id: mindMapId } = await params;

    // Verify user has access to this mind map
    const mindMap = await prisma.mindMap.findFirst({
      where: {
        id: mindMapId,
        workspace: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
    });

    if (!mindMap) {
      throw new ApiError(404, 'Mind map not found');
    }

    const body = await req.json();
    const { question, language } = assistantQuestionSchema.parse(body);

    // Get user's API key for the provider used to generate the map
    const provider = mindMap.provider || 'openai';
    const userKey = await prisma.userProviderKey.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider,
        },
      },
    });

    if (!userKey) {
      throw new ApiError(
        400,
        `Please configure your ${provider} API key in settings`
      );
    }

    const apiKey = decryptKey(userKey.encryptedKey);

    // Answer the question
    const answer = await AssistantService.answerQuestion(
      {
        question,
        mindMapId,
        language,
      },
      provider,
      apiKey
    );

    return apiResponse(answer);
  } catch (error) {
    if (error instanceof ApiError) {
      return apiResponse(null, error.message, error.statusCode);
    }
    console.error('Error answering question:', error);
    return apiResponse(null, 'Failed to answer question', 500);
  }
}

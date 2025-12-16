import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api-response';
import { defaultTemplates, getAllCategories, getTemplatesByCategory } from '@/lib/templates/templates-data';

// GET /api/templates - Get all templates or filter by category
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const language = searchParams.get('language') || 'en';

    let templates = defaultTemplates;

    // Filter by category if provided
    if (category) {
      templates = getTemplatesByCategory(category);
    }

    // Filter by language if provided
    if (language !== 'en') {
      templates = templates.filter((t) => t.language === language);
    }

    const categories = getAllCategories();

    return apiResponse({
      templates,
      categories,
      total: templates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return apiResponse(null, 'Failed to fetch templates', 500);
  }
}

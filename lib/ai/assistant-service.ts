import { db as prisma } from '@/lib/db';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface NodeCitation {
  id: string;
  title: string;
  url: string | null;
  author: string | null;
  summary: string | null;
}

interface NodeWithCitations {
  id: string;
  title: string | null;
  content: string;
  parentId: string | null;
  order: number;
  citations: NodeCitation[];
}

export interface AssistantQuestion {
  question: string;
  mindMapId: string;
  language?: string;
}

export interface AssistantAnswer {
  answer: string;
  sources: {
    nodeId: string;
    nodeTitle: string;
    nodeContent: string;
    relevanceScore?: number;
  }[];
  confidence: number;
}

export class AssistantService {
  /**
   * Answer a question based on the mind map content
   */
  static async answerQuestion(
    question: AssistantQuestion,
    provider: string,
    apiKey: string
  ): Promise<AssistantAnswer> {
    const { question: userQuestion, mindMapId, language = 'en' } = question;

    // Fetch the mind map with all nodes
    const mindMap = await prisma.mindMap.findUnique({
      where: { id: mindMapId },
      include: {
        nodes: {
          include: {
            citations: true,
          },
        },
      },
    });

    if (!mindMap) {
      throw new Error('Mind map not found');
    }

    // Build context from nodes
    const context = this.buildContextFromNodes(mindMap.nodes);

    // Generate answer using AI
    let answer: string;
    let sources: AssistantAnswer['sources'] = [];

    if (provider === 'openai') {
      const result = await this.answerWithOpenAI(userQuestion, context, apiKey, language);
      answer = result.answer;
      sources = result.sources;
    } else if (provider === 'google') {
      const result = await this.answerWithGemini(userQuestion, context, apiKey, language);
      answer = result.answer;
      sources = result.sources;
    } else {
      throw new Error('Unsupported AI provider');
    }

    // Calculate confidence based on sources found
    const confidence = Math.min(sources.length * 0.2 + 0.3, 1.0);

    return {
      answer,
      sources,
      confidence,
    };
  }

  /**
   * Build context string from mind map nodes
   */
  private static buildContextFromNodes(nodes: NodeWithCitations[]): string {
    let context = '';

    const processNode = (node: NodeWithCitations, level: number = 0) => {
      const indent = '  '.repeat(level);
      context += `${indent}[Node ID: ${node.id}]\n`;
      context += `${indent}Title: ${node.title || 'Untitled'}\n`;
      context += `${indent}Content: ${node.content}\n`;

      if (node.citations && node.citations.length > 0) {
        context += `${indent}Citations:\n`;
        for (const citation of node.citations) {
          context += `${indent}  - ${citation.title}`;
          if (citation.url) context += ` (${citation.url})`;
          context += `\n`;
        }
      }
      context += `\n`;
    };

    const buildTree = (parentId: string | null = null, level: number = 0) => {
      const children = nodes.filter((n) => n.parentId === parentId);
      children.sort((a, b) => a.order - b.order);
      for (const child of children) {
        processNode(child, level);
        buildTree(child.id, level + 1);
      }
    };

    buildTree(null, 0);

    return context;
  }

  /**
   * Answer using OpenAI
   */
  private static async answerWithOpenAI(
    question: string,
    context: string,
    apiKey: string,
    language: string
  ): Promise<{ answer: string; sources: AssistantAnswer['sources'] }> {
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a helpful AI assistant that answers questions based on a mind map's content.
The mind map structure and content is provided below. Answer the user's question using only the information from the mind map.
If you reference specific information, mention the Node ID so the user can find it.
Answer in ${language === 'en' ? 'English' : `the language code: ${language}`}.

Mind Map Content:
${context}

Instructions:
1. Answer the question accurately based on the mind map content
2. Reference specific nodes using [Node: title] format
3. If the answer is not in the mind map, say so clearly
4. Be concise but thorough
5. Use the specified language for your response`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer = response.choices[0].message.content || 'No answer generated';

    // Extract referenced node IDs from the answer
    const nodeIdMatches = answer.matchAll(/\[Node ID: ([^\]]+)\]/g);
    const referencedNodeIds = Array.from(nodeIdMatches, (match) => match[1]);

    // Find the referenced nodes
    const sources = await this.extractSources(context, referencedNodeIds);

    return { answer, sources };
  }

  /**
   * Answer using Google Gemini
   */
  private static async answerWithGemini(
    question: string,
    context: string,
    apiKey: string,
    language: string
  ): Promise<{ answer: string; sources: AssistantAnswer['sources'] }> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a helpful AI assistant that answers questions based on a mind map's content.
The mind map structure and content is provided below. Answer the user's question using only the information from the mind map.
If you reference specific information, mention the Node ID so the user can find it.
Answer in ${language === 'en' ? 'English' : `the language code: ${language}`}.

Mind Map Content:
${context}

Question: ${question}

Instructions:
1. Answer the question accurately based on the mind map content
2. Reference specific nodes using [Node: title] format
3. If the answer is not in the mind map, say so clearly
4. Be concise but thorough
5. Use the specified language for your response`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    // Extract referenced node IDs from the answer
    const nodeIdMatches = answer.matchAll(/\[Node ID: ([^\]]+)\]/g);
    const referencedNodeIds = Array.from(nodeIdMatches, (match) => match[1]);

    // Find the referenced nodes
    const sources = await this.extractSources(context, referencedNodeIds);

    return { answer, sources };
  }

  /**
   * Extract source nodes from context based on referenced IDs
   */
  private static async extractSources(
    context: string,
    nodeIds: string[]
  ): Promise<AssistantAnswer['sources']> {
    const sources: AssistantAnswer['sources'] = [];

    for (const nodeId of nodeIds) {
      const nodeMatch = context.match(
        new RegExp(`\\[Node ID: ${nodeId}\\]\\s*Title: ([^\\n]+)\\s*Content: ([^\\n]+)`, 'i')
      );

      if (nodeMatch) {
        sources.push({
          nodeId,
          nodeTitle: nodeMatch[1].trim(),
          nodeContent: nodeMatch[2].trim(),
        });
      }
    }

    return sources;
  }

  /**
   * Generate embeddings for mind map nodes (for future semantic search)
   */
  static async generateEmbeddings(mindMapId: string, provider: string, apiKey: string): Promise<void> {
    const mindMap = await prisma.mindMap.findUnique({
      where: { id: mindMapId },
      include: {
        nodes: true,
      },
    });

    if (!mindMap) {
      throw new Error('Mind map not found');
    }

    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });

      for (const node of mindMap.nodes) {
        const text = `${node.title || ''} ${node.content}`;
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text,
        });

        const embedding = response.data[0].embedding;

        await prisma.mapNode.update({
          where: { id: node.id },
          data: {
            embeddings: JSON.stringify(embedding),
          },
        });
      }

      // Store aggregated embeddings for the entire mind map
      const allEmbeddings = await prisma.mapNode.findMany({
        where: { mindMapId },
        select: { embeddings: true },
      });

      await prisma.mindMap.update({
        where: { id: mindMapId },
        data: {
          embeddings: JSON.stringify(allEmbeddings.map((e) => e.embeddings)),
        },
      });
    }
  }
}

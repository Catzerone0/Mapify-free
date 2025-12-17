import { db as prisma } from '@/lib/db';

interface NodeWithRelations {
  id: string;
  title: string | null;
  content: string;
  parentId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string | null;
  shape: string;
  order: number;
  isCollapsed: boolean;
  citations: {
    id: string;
    title: string;
    url: string | null;
    summary: string | null;
    author: string | null;
  }[];
  attachments: {
    id: string;
    type: string;
    url: string | null;
    content: string | null;
  }[];
}

export interface ExportOptions {
  format: 'markdown' | 'text' | 'json';
  includeCitations?: boolean;
  includeMetadata?: boolean;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

export class ExportService {
  /**
   * Export a mind map to Markdown format
   */
  static async exportToMarkdown(
    mindMapId: string,
    options: ExportOptions = { format: 'markdown', includeCitations: true, includeMetadata: true }
  ): Promise<ExportResult> {
    const mindMap = await prisma.mindMap.findUnique({
      where: { id: mindMapId },
      include: {
        nodes: {
          include: {
            citations: true,
            attachments: true,
          },
        },
      },
    });

    if (!mindMap) {
      throw new Error('Mind map not found');
    }

    let markdown = '';

    // Add metadata
    if (options.includeMetadata) {
      markdown += `# ${mindMap.title}\n\n`;
      if (mindMap.description) {
        markdown += `${mindMap.description}\n\n`;
      }
      if (mindMap.summary) {
        markdown += `## Summary\n\n${mindMap.summary}\n\n`;
      }
      markdown += `---\n\n`;
    }

    // Build node tree
    interface TreeNode extends NodeWithRelations {
      children: TreeNode[];
    }

    const buildNodeTree = (nodes: NodeWithRelations[], parentId: string | null = null): TreeNode[] => {
      return nodes
        .filter((node) => node.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((node) => ({
          ...node,
          children: buildNodeTree(nodes, node.id),
        }));
    };

    const rootNodes = buildNodeTree(mindMap.nodes);

    // Convert nodes to markdown
    const nodesToMarkdown = (nodes: TreeNode[], level: number = 1): string => {
      let md = '';
      for (const node of nodes) {
        const heading = '#'.repeat(Math.min(level + 1, 6));
        md += `${heading} ${node.title || 'Untitled'}\n\n`;
        
        if (node.content) {
          md += `${node.content}\n\n`;
        }

        // Add citations
        if (options.includeCitations && node.citations && node.citations.length > 0) {
          md += `**Sources:**\n\n`;
          for (const citation of node.citations) {
            if (citation.url) {
              md += `- [${citation.title}](${citation.url})`;
            } else {
              md += `- ${citation.title}`;
            }
            if (citation.author) {
              md += ` by ${citation.author}`;
            }
            md += `\n`;
          }
          md += `\n`;
        }

        // Add attachments
        if (node.attachments && node.attachments.length > 0) {
          md += `**Attachments:**\n\n`;
          for (const attachment of node.attachments) {
            if (attachment.type === 'link' && attachment.url) {
              md += `- [${attachment.content || 'Link'}](${attachment.url})\n`;
            } else if (attachment.type === 'note') {
              md += `- Note: ${attachment.content}\n`;
            }
          }
          md += `\n`;
        }

        // Recursively add children
        if (node.children && node.children.length > 0) {
          md += nodesToMarkdown(node.children, level + 1);
        }
      }
      return md;
    };

    markdown += nodesToMarkdown(rootNodes);

    // Add citations summary at the end
    if (options.includeCitations) {
      const allCitations = mindMap.nodes.flatMap((node) => node.citations);
      if (allCitations.length > 0) {
        markdown += `\n---\n\n## References\n\n`;
        const uniqueCitations = allCitations.filter(
          (citation, index, self) =>
            index === self.findIndex((c) => c.url === citation.url && c.title === citation.title)
        );
        for (const citation of uniqueCitations) {
          if (citation.url) {
            markdown += `- [${citation.title}](${citation.url})`;
          } else {
            markdown += `- ${citation.title}`;
          }
          if (citation.author) {
            markdown += ` by ${citation.author}`;
          }
          if (citation.summary) {
            markdown += `\n  ${citation.summary}`;
          }
          markdown += `\n`;
        }
      }
    }

    const filename = `${mindMap.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

    return {
      content: markdown,
      filename,
      mimeType: 'text/markdown',
    };
  }

  /**
   * Export a mind map to plain text format
   */
  static async exportToText(mindMapId: string): Promise<ExportResult> {
    const result = await this.exportToMarkdown(mindMapId, {
      format: 'text',
      includeCitations: true,
      includeMetadata: true,
    });

    // Strip markdown formatting
    let text = result.content;
    text = text.replace(/#+\s/g, ''); // Remove heading markers
    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold
    text = text.replace(/\*(.*?)\*/g, '$1'); // Remove italic
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)'); // Convert links
    text = text.replace(/---+/g, ''); // Remove horizontal rules

    const filename = result.filename.replace('.md', '.txt');

    return {
      content: text,
      filename,
      mimeType: 'text/plain',
    };
  }

  /**
   * Export a mind map to JSON format
   */
  static async exportToJSON(mindMapId: string): Promise<ExportResult> {
    const mindMap = await prisma.mindMap.findUnique({
      where: { id: mindMapId },
      include: {
        nodes: {
          include: {
            citations: true,
            attachments: true,
          },
        },
      },
    });

    if (!mindMap) {
      throw new Error('Mind map not found');
    }

    // Build node tree
    interface JsonTreeNode {
      id: string;
      title: string | null;
      content: string;
      visual: {
        x: number;
        y: number;
        width: number;
        height: number;
        color: string | null;
        shape: string;
        isCollapsed: boolean;
      };
      citations: NodeWithRelations['citations'];
      attachments: NodeWithRelations['attachments'];
      children: JsonTreeNode[];
    }

    const buildNodeTree = (nodes: NodeWithRelations[], parentId: string | null = null): JsonTreeNode[] => {
      return nodes
        .filter((node) => node.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((node) => ({
          id: node.id,
          title: node.title,
          content: node.content,
          visual: {
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            color: node.color,
            shape: node.shape,
            isCollapsed: node.isCollapsed,
          },
          citations: node.citations,
          attachments: node.attachments,
          children: buildNodeTree(nodes, node.id),
        }));
    };

    const rootNodes = buildNodeTree(mindMap.nodes);

    const exportData = {
      version: '1.0',
      mindMap: {
        id: mindMap.id,
        title: mindMap.title,
        description: mindMap.description,
        summary: mindMap.summary,
        prompt: mindMap.prompt,
        provider: mindMap.provider,
        complexity: mindMap.complexity,
        createdAt: mindMap.createdAt,
        updatedAt: mindMap.updatedAt,
      },
      nodes: rootNodes,
    };

    const filename = `${mindMap.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    return {
      content: JSON.stringify(exportData, null, 2),
      filename,
      mimeType: 'application/json',
    };
  }

  /**
   * Generate a PNG/JPG export URL (to be rendered client-side)
   */
  static getImageExportData(mindMapId: string) {
    return {
      mindMapId,
      exportUrl: `/api/maps/${mindMapId}/export/image`,
    };
  }
}

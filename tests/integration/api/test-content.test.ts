import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Import mocked functions
import { getAllPages, getAllPosts, getContentStats } from '@/lib/content';
import { GET } from '@/app/api/test-content/route';

// Mock dependencies
vi.mock('@/lib/content', () => ({
  getAllPages: vi.fn(),
  getAllPosts: vi.fn(),
  getContentStats: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockGetAllPages = getAllPages as any;
const mockGetAllPosts = getAllPosts as any;
const mockGetContentStats = getContentStats as any;

describe('API Integration Tests - /api/test-content', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/test-content', () => {
    it('should return successful response with content data', async () => {
      // Setup mocks
      mockGetAllPosts.mockImplementation((locale: string) => {
        if (locale === 'en') {
          return [
            {
              metadata: {
                title: 'Test Post EN',
                slug: 'test-post-en',
                publishedAt: '2024-01-01',
              },
            },
          ];
        }
        return [
          {
            metadata: {
              title: 'Test Post ZH',
              slug: 'test-post-zh',
              publishedAt: '2024-01-02',
            },
          },
        ];
      });

      mockGetAllPages.mockImplementation((locale: string) => {
        if (locale === 'en') {
          return [
            {
              metadata: {
                title: 'Test Page EN',
                slug: 'test-page-en',
              },
            },
          ];
        }
        return [
          {
            metadata: {
              title: 'Test Page ZH',
              slug: 'test-page-zh',
            },
          },
        ];
      });

      mockGetContentStats.mockReturnValue({
        totalFiles: 4,
        totalSize: 1024,
        lastModified: '2024-01-01T00:00:00Z',
      });

      // Execute API call
      const response = await GET();
      const data = await response.json();

      // Verify response structure
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Content management system is working!');

      // Verify posts data
      expect(data.data.posts.en).toBe(1);
      expect(data.data.posts.zh).toBe(1);
      expect(data.data.posts.total).toBe(2);
      expect(data.data.posts.examples.en).toEqual({
        title: 'Test Post EN',
        slug: 'test-post-en',
        publishedAt: '2024-01-01',
      });

      // Verify pages data
      expect(data.data.pages.en).toBe(1);
      expect(data.data.pages.zh).toBe(1);
      expect(data.data.pages.total).toBe(2);
      expect(data.data.pages.examples.en).toEqual({
        title: 'Test Page EN',
        slug: 'test-page-en',
      });

      // Verify stats
      expect(data.data.stats).toEqual({
        totalFiles: 4,
        totalSize: 1024,
        lastModified: '2024-01-01T00:00:00Z',
      });

      // Verify features
      expect(data.data.features).toEqual({
        mdxParsing: true,
        frontmatterValidation: true,
        multiLanguageSupport: true,
        typeScriptTypes: true,
        contentValidation: true,
        gitBasedWorkflow: true,
      });
    });

    it('should handle empty content gracefully', async () => {
      // Setup mocks for empty content
      mockGetAllPosts.mockReturnValue([]);
      mockGetAllPages.mockReturnValue([]);
      mockGetContentStats.mockReturnValue({
        totalFiles: 0,
        totalSize: 0,
        lastModified: null,
      });

      // Execute API call
      const response = await GET();
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.posts.total).toBe(0);
      expect(data.data.pages.total).toBe(0);
      expect(data.data.posts.examples.en).toBeNull();
      expect(data.data.posts.examples.zh).toBeNull();
      expect(data.data.pages.examples.en).toBeNull();
      expect(data.data.pages.examples.zh).toBeNull();
    });

    it('should handle content with missing metadata', async () => {
      // Setup mocks with incomplete metadata
      mockGetAllPosts.mockReturnValue([
        {
          metadata: {
            // Missing title and slug
            publishedAt: '2024-01-01',
          },
        },
      ]);

      mockGetAllPages.mockReturnValue([
        {
          metadata: {
            // Missing title and slug
          },
        },
      ]);

      mockGetContentStats.mockReturnValue({
        totalFiles: 2,
        totalSize: 512,
        lastModified: '2024-01-01T00:00:00Z',
      });

      // Execute API call
      const response = await GET();
      const data = await response.json();

      // Verify response handles missing metadata gracefully
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.posts.examples.en).toEqual({
        title: 'Untitled',
        slug: '',
        publishedAt: '2024-01-01',
      });
      expect(data.data.pages.examples.en).toEqual({
        title: 'Untitled',
        slug: '',
      });
    });

    it('should handle errors and return 500 status', async () => {
      // Setup mock to throw error
      mockGetAllPosts.mockImplementation(() => {
        throw new Error('Content loading failed');
      });

      // Execute API call
      const response = await GET();
      const data = await response.json();

      // Verify error response
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.message).toBe('Content management system test failed');
      expect(data.error).toBe('Content loading failed');
    });

    it('should handle non-Error exceptions', async () => {
      // Setup mock to throw non-Error
      mockGetAllPosts.mockImplementation(() => {
        throw 'String error';
      });

      // Execute API call
      const response = await GET();
      const data = await response.json();

      // Verify error response
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unknown error');
    });

    it('should call all required content functions', async () => {
      // Setup mocks
      mockGetAllPosts.mockReturnValue([]);
      mockGetAllPages.mockReturnValue([]);
      mockGetContentStats.mockReturnValue({});

      // Execute API call
      await GET();

      // Verify all functions were called
      expect(mockGetAllPosts).toHaveBeenCalledWith('en');
      expect(mockGetAllPosts).toHaveBeenCalledWith('zh');
      expect(mockGetAllPages).toHaveBeenCalledWith('en');
      expect(mockGetAllPages).toHaveBeenCalledWith('zh');
      expect(mockGetContentStats).toHaveBeenCalled();
    });

    it('should return NextResponse with correct headers', async () => {
      // Setup mocks
      mockGetAllPosts.mockReturnValue([]);
      mockGetAllPages.mockReturnValue([]);
      mockGetContentStats.mockReturnValue({});

      // Execute API call
      const response = await GET();

      // Verify response is NextResponse instance
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.headers.get('content-type')).toContain(
        'application/json',
      );
    });
  });
});

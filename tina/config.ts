import { defineConfig } from 'tinacms';

// 支持的语言
const SUPPORTED_LOCALES = ['en', 'zh'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

// 语言标签映射
const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};

// SEO 字段模板
const seoFields = [
  {
    type: 'string',
    name: 'title',
    label: 'SEO Title',
    description: 'Override the default title for SEO',
  },
  {
    type: 'string',
    name: 'description',
    label: 'SEO Description',
    description: 'Meta description for search engines',
    ui: {
      component: 'textarea',
    },
  },
  {
    type: 'string',
    name: 'keywords',
    label: 'SEO Keywords',
    list: true,
    description: 'Keywords for search engines',
  },
  {
    type: 'image',
    name: 'ogImage',
    label: 'Open Graph Image',
    description: 'Image for social media sharing',
  },
];

export default defineConfig({
  // Git 提供者配置
  branch: process.env.NEXT_PUBLIC_TINA_BRANCH || 'main',
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },

  media: {
    tina: {
      mediaRoot: 'images',
      publicFolder: 'public',
    },
  },

  schema: {
    collections: [
      // 博客文章集合
      {
        name: 'posts',
        label: 'Blog Posts',
        path: 'content/posts',
        format: 'mdx',
        match: {
          include: '{en,zh}/**/*',
        },
        defaultItem: () => ({
          locale: 'en',
          draft: true,
          featured: false,
          publishedAt: new Date().toISOString().split('T')[0],
        }),
        fields: [
          // 语言选择
          {
            type: 'string',
            name: 'locale',
            label: 'Language',
            options: SUPPORTED_LOCALES.map((locale) => ({
              value: locale,
              label: LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS],
            })),
            required: true,
            ui: {
              component: 'select',
            },
          },
          // 基本信息
          {
            type: 'string',
            name: 'title',
            label: 'Title',
            isTitle: true,
            required: true,
          },
          {
            type: 'string',
            name: 'description',
            label: 'Description',
            required: true,
            ui: {
              component: 'textarea',
            },
          },
          {
            type: 'string',
            name: 'slug',
            label: 'Slug',
            required: true,
            description: 'URL-friendly version of the title',
          },
          // 发布信息
          {
            type: 'datetime',
            name: 'publishedAt',
            label: 'Published Date',
            required: true,
            ui: {
              dateFormat: 'YYYY-MM-DD',
            },
          },
          {
            type: 'datetime',
            name: 'updatedAt',
            label: 'Updated Date',
            ui: {
              dateFormat: 'YYYY-MM-DD',
            },
          },
          {
            type: 'string',
            name: 'author',
            label: 'Author',
            required: true,
            options: [
              'Tucsenberg Team',
              'Technical Team',
              'Marketing Team',
              'Product Team',
            ],
          },
          // 分类和标签
          {
            type: 'string',
            name: 'tags',
            label: 'Tags',
            list: true,
            ui: {
              component: 'tags',
            },
          },
          {
            type: 'string',
            name: 'categories',
            label: 'Categories',
            list: true,
            options: [
              'Technology',
              'Web Development',
              'Enterprise',
              'Tutorial',
              'News',
              'Case Study',
            ],
          },
          // 状态控制
          {
            type: 'boolean',
            name: 'featured',
            label: 'Featured Post',
            description: 'Show this post in featured sections',
          },
          {
            type: 'boolean',
            name: 'draft',
            label: 'Draft',
            description: 'Hide this post from public view',
          },
          // 内容摘要
          {
            type: 'string',
            name: 'excerpt',
            label: 'Excerpt',
            ui: {
              component: 'textarea',
            },
            description: 'Brief summary of the post',
          },
          {
            type: 'number',
            name: 'readingTime',
            label: 'Reading Time (minutes)',
            description: 'Estimated reading time in minutes',
          },
          // 媒体
          {
            type: 'image',
            name: 'coverImage',
            label: 'Cover Image',
            description: 'Main image for the post',
          },
          // SEO 配置
          {
            type: 'object',
            name: 'seo',
            label: 'SEO Settings',
            fields: seoFields,
          },
          // 文章内容
          {
            type: 'rich-text',
            name: 'body',
            label: 'Content',
            isBody: true,
            templates: [
              {
                name: 'CodeBlock',
                label: 'Code Block',
                fields: [
                  {
                    type: 'string',
                    name: 'language',
                    label: 'Language',
                    options: [
                      'typescript',
                      'javascript',
                      'jsx',
                      'tsx',
                      'css',
                      'html',
                      'bash',
                      'json',
                    ],
                  },
                  {
                    type: 'string',
                    name: 'code',
                    label: 'Code',
                    ui: {
                      component: 'textarea',
                    },
                  },
                ],
              },
              {
                name: 'Callout',
                label: 'Callout',
                fields: [
                  {
                    type: 'string',
                    name: 'type',
                    label: 'Type',
                    options: ['info', 'warning', 'error', 'success'],
                  },
                  {
                    type: 'string',
                    name: 'title',
                    label: 'Title',
                  },
                  {
                    type: 'rich-text',
                    name: 'content',
                    label: 'Content',
                  },
                ],
              },
            ],
          },
        ],
        ui: {
          router: ({ document }) => {
            // eslint-disable-next-line no-underscore-dangle
            const locale = document._sys.relativePath.includes('/zh/')
              ? 'zh'
              : 'en';
            // eslint-disable-next-line no-underscore-dangle
            const slug = document.slug || document._sys.basename;
            return `/${locale}/blog/${slug}`;
          },
          filename: {
            readonly: false,
            slugify: (values) => {
              const locale = values.locale || 'en';
              return `${locale}/${values.slug}`;
            },
          },
        },
      },
      // 页面集合
      {
        name: 'pages',
        label: 'Pages',
        path: 'content/pages',
        format: 'mdx',
        match: {
          include: '{en,zh}/**/*',
        },
        defaultItem: () => ({
          locale: 'en',
          draft: false,
          showToc: true,
        }),
        fields: [
          // 语言选择
          {
            type: 'string',
            name: 'locale',
            label: 'Language',
            options: SUPPORTED_LOCALES.map((locale) => ({
              value: locale,
              label: LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS],
            })),
            required: true,
            ui: {
              component: 'select',
            },
          },
          // 基本信息
          {
            type: 'string',
            name: 'title',
            label: 'Title',
            isTitle: true,
            required: true,
          },
          {
            type: 'string',
            name: 'description',
            label: 'Description',
            required: true,
            ui: {
              component: 'textarea',
            },
          },
          {
            type: 'string',
            name: 'slug',
            label: 'Slug',
            required: true,
          },
          // 发布信息
          {
            type: 'datetime',
            name: 'publishedAt',
            label: 'Published Date',
            ui: {
              dateFormat: 'YYYY-MM-DD',
            },
          },
          {
            type: 'datetime',
            name: 'updatedAt',
            label: 'Updated Date',
            ui: {
              dateFormat: 'YYYY-MM-DD',
            },
          },
          {
            type: 'string',
            name: 'author',
            label: 'Author',
            required: true,
          },
          // 页面配置
          {
            type: 'string',
            name: 'layout',
            label: 'Layout',
            options: ['default', 'wide', 'narrow'],
            description: 'Page layout template',
          },
          {
            type: 'boolean',
            name: 'showToc',
            label: 'Show Table of Contents',
            description: 'Display table of contents for this page',
          },
          {
            type: 'datetime',
            name: 'lastReviewed',
            label: 'Last Reviewed',
            ui: {
              dateFormat: 'YYYY-MM-DD',
            },
          },
          {
            type: 'boolean',
            name: 'draft',
            label: 'Draft',
            description: 'Hide this page from public view',
          },
          // SEO 配置
          {
            type: 'object',
            name: 'seo',
            label: 'SEO Settings',
            fields: seoFields,
          },
          // 页面内容
          {
            type: 'rich-text',
            name: 'body',
            label: 'Content',
            isBody: true,
          },
        ],
        ui: {
          router: ({ document }) => {
            // eslint-disable-next-line no-underscore-dangle
            const locale = document._sys.relativePath.includes('/zh/')
              ? 'zh'
              : 'en';
            // eslint-disable-next-line no-underscore-dangle
            const slug = document.slug || document._sys.basename;
            return `/${locale}/${slug}`;
          },
          filename: {
            readonly: false,
            slugify: (values) => {
              const locale = values.locale || 'en';
              return `${locale}/${values.slug}`;
            },
          },
        },
      },
    ],
  },
});

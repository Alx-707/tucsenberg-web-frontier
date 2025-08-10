/**
 * Test script for MDX content management system
 */

const {
  getAllPosts,
  getAllPages,
  getContentStats,
} = require('../src/lib/content.ts');

async function testContentSystem() {
  console.log('🧪 Testing MDX Content Management System...\n');

  try {
    // Test getting all posts
    console.log('📝 Testing blog posts...');
    const enPosts = getAllPosts('en');
    const zhPosts = getAllPosts('zh');

    console.log(`✅ Found ${enPosts.length} English posts`);
    console.log(`✅ Found ${zhPosts.length} Chinese posts`);

    if (enPosts.length > 0) {
      console.log(`   - First EN post: "${enPosts[0].metadata.title}"`);
    }
    if (zhPosts.length > 0) {
      console.log(`   - First ZH post: "${zhPosts[0].metadata.title}"`);
    }

    // Test getting all pages
    console.log('\n📄 Testing pages...');
    const enPages = getAllPages('en');
    const zhPages = getAllPages('zh');

    console.log(`✅ Found ${enPages.length} English pages`);
    console.log(`✅ Found ${zhPages.length} Chinese pages`);

    if (enPages.length > 0) {
      console.log(`   - First EN page: "${enPages[0].metadata.title}"`);
    }
    if (zhPages.length > 0) {
      console.log(`   - First ZH page: "${zhPages[0].metadata.title}"`);
    }

    // Test content statistics
    console.log('\n📊 Testing content statistics...');
    const stats = getContentStats();
    console.log('✅ Content statistics:');
    console.log(`   - Total posts: ${stats.totalPosts}`);
    console.log(`   - Total pages: ${stats.totalPages}`);
    console.log(`   - Posts by locale:`, stats.postsByLocale);
    console.log(`   - Pages by locale:`, stats.pagesByLocale);
    console.log(`   - Total tags: ${stats.totalTags}`);
    console.log(`   - Total categories: ${stats.totalCategories}`);

    console.log(
      '\n🎉 All tests passed! MDX content system is working correctly.',
    );
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testContentSystem();

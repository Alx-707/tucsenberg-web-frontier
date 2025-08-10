#!/usr/bin/env node

/**
 * TinaCMS GraphQL 端点测试脚本
 * 用于验证 GraphQL API 的功能和响应
 */

const https = require('http');

console.log('🔍 Testing TinaCMS GraphQL Endpoint...\n');

// 测试查询列表
const testQueries = [
  {
    name: 'Collections Query',
    query: '{ collections { name label } }',
    description: '获取所有集合信息',
  },
  {
    name: 'Posts Query',
    query:
      '{ postsConnection { totalCount edges { node { title locale slug publishedAt } } } }',
    description: '获取所有博客文章',
  },
  {
    name: 'Pages Query',
    query:
      '{ pagesConnection { totalCount edges { node { title locale slug } } } }',
    description: '获取所有页面',
  },
  {
    name: 'Schema Introspection',
    query: '{ __schema { types { name } } }',
    description: '获取 GraphQL Schema 信息',
  },
];

async function testGraphQLQuery(query, name, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });

    const options = {
      hostname: 'localhost',
      port: 4001,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ name, description, response, status: res.statusCode });
        } catch (error) {
          reject({
            name,
            description,
            error: `Failed to parse JSON: ${error.message}`,
            rawData: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ name, description, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('📋 Running GraphQL endpoint tests...\n');

  let passedTests = 0;
  let totalTests = testQueries.length;

  for (const test of testQueries) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      console.log(`   Description: ${test.description}`);

      const result = await testGraphQLQuery(
        test.query,
        test.name,
        test.description,
      );

      if (
        result.status === 200 &&
        result.response.data &&
        !result.response.errors
      ) {
        console.log(`   ✅ PASSED - Status: ${result.status}`);
        console.log(
          `   📊 Data: ${JSON.stringify(result.response.data).substring(0, 100)}...`,
        );
        passedTests++;
      } else if (result.response.errors) {
        console.log(`   ❌ FAILED - GraphQL Errors:`);
        result.response.errors.forEach((error, index) => {
          console.log(`      ${index + 1}. ${error.message}`);
        });
      } else {
        console.log(`   ❌ FAILED - Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.error || error.message}`);
    }

    console.log('');
  }

  // 生成测试报告
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Tests Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ TinaCMS GraphQL endpoint is working correctly');
    console.log('\n🔗 Access URLs:');
    console.log('• GraphQL API: http://localhost:4001/graphql');
    console.log('• TinaCMS Admin: http://localhost:4001/admin/index.html');
    console.log(
      '• GraphQL Playground: http://localhost:4001/admin/index.html#/graphql',
    );
  } else {
    console.log('\n🚨 SOME TESTS FAILED');
    console.log('Please check the TinaCMS configuration and content files.');
  }
}

// 运行测试
runTests().catch(console.error);

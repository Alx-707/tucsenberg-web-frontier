#!/usr/bin/env node

/**
 * Security Configuration Check Script
 *
 * This script validates the security configuration of the application
 * and provides recommendations for improvement.
 */

const fs = require('fs');
const path = require('path');

class SecurityChecker {
  constructor() {
    this.results = {
      passed: true,
      checks: [],
      warnings: [],
      recommendations: [],
    };
  }

  /**
   * Run all security checks
   */
  async runChecks() {
    console.log('🔒 Running security configuration checks...\n');

    this.checkEnvironmentVariables();
    this.checkSecurityHeaders();
    this.checkCSPConfiguration();
    this.checkDependencies();
    this.checkFilePermissions();
    this.checkGitIgnore();
    this.checkTurnstileConfiguration();

    this.generateReport();
  }

  /**
   * Check environment variables configuration
   */
  checkEnvironmentVariables() {
    console.log('🔍 Checking environment variables...');

    // Check .env.example exists
    this.addCheck(
      'Environment template exists',
      fs.existsSync('.env.example'),
      '.env.example file should exist as a template'
    );

    // Check .env files are not committed
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    envFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addWarning(`${file} exists - ensure it's not committed to version control`);
      }
    });

    // Check env.mjs exists
    this.addCheck(
      'Environment validation exists',
      fs.existsSync('env.mjs'),
      'env.mjs file should exist for environment variable validation'
    );

    // Check for sensitive data in .env.example
    if (fs.existsSync('.env.example')) {
      const envExample = fs.readFileSync('.env.example', 'utf8');

      // Look for uncommented lines with sensitive values that don't look like placeholders
      const lines = envExample.split('\n');
      const sensitiveLines = lines.filter(line => {
        // Skip comments
        if (line.trim().startsWith('#')) return false;

        // Check for sensitive keys with non-placeholder values
        const sensitivePattern = /(password|secret|key|token)=/i;
        const placeholderPattern = /(your_|test_|example_|placeholder|changeme|replace)/i;

        if (sensitivePattern.test(line)) {
          const value = line.split('=')[1]?.trim();
          if (value && !placeholderPattern.test(value) && value.length > 10) {
            return true;
          }
        }
        return false;
      });

      this.addCheck(
        'No sensitive data in .env.example',
        sensitiveLines.length === 0,
        '.env.example should not contain real sensitive data'
      );

      if (sensitiveLines.length > 0) {
        console.log(`     Found potentially sensitive lines: ${sensitiveLines.length}`);
      }
    }
  }

  /**
   * Check security headers configuration
   */
  checkSecurityHeaders() {
    console.log('🛡️  Checking security headers...');

    // Check security config exists
    const securityConfigPath = 'src/config/security.ts';
    this.addCheck(
      'Security configuration exists',
      fs.existsSync(securityConfigPath),
      'Security configuration file should exist'
    );

    // Check next.config.ts for security headers
    if (fs.existsSync('next.config.ts')) {
      const nextConfig = fs.readFileSync('next.config.ts', 'utf8');

      this.addCheck(
        'Security headers configured',
        nextConfig.includes('getSecurityHeaders'),
        'next.config.ts should use getSecurityHeaders function'
      );

      this.addCheck(
        'CSP configured',
        nextConfig.includes('Content-Security-Policy') || nextConfig.includes('getSecurityHeaders'),
        'Content Security Policy should be configured'
      );
    }
  }

  /**
   * Check CSP configuration
   */
  checkCSPConfiguration() {
    console.log('🔐 Checking CSP configuration...');

    // Check CSP report endpoint exists
    const cspReportPath = 'src/app/api/csp-report/route.ts';
    this.addCheck(
      'CSP report endpoint exists',
      fs.existsSync(cspReportPath),
      'CSP report endpoint should exist for violation reporting'
    );

    // Check middleware includes security
    if (fs.existsSync('middleware.ts')) {
      const middleware = fs.readFileSync('middleware.ts', 'utf8');

      this.addCheck(
        'Middleware includes security',
        middleware.includes('getSecurityHeaders') || middleware.includes('generateNonce'),
        'Middleware should include security headers'
      );
    }
  }

  /**
   * Check dependencies for security vulnerabilities
   */
  checkDependencies() {
    console.log('📦 Checking dependencies...');

    // Check if security-related packages are installed
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      this.addCheck(
        'Environment validation package installed',
        '@t3-oss/env-nextjs' in dependencies,
        '@t3-oss/env-nextjs should be installed for environment validation'
      );

      this.addCheck(
        'Bot protection package installed',
        '@marsidev/react-turnstile' in dependencies,
        'Turnstile package should be installed for bot protection'
      );

      this.addCheck(
        'Security linting installed',
        'eslint-plugin-security' in dependencies,
        'Security ESLint plugin should be installed'
      );

      // Check for known vulnerable packages (basic check)
      const vulnerablePackages = ['lodash', 'moment', 'request'];
      vulnerablePackages.forEach(pkg => {
        if (pkg in dependencies) {
          this.addWarning(`${pkg} is installed - consider using modern alternatives`);
        }
      });
    }
  }

  /**
   * Check file permissions and sensitive files
   */
  checkFilePermissions() {
    console.log('📁 Checking file permissions...');

    // Check for sensitive files that shouldn't exist
    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'private.key',
      'server.key',
      'id_rsa',
      'id_dsa',
    ];

    sensitiveFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.addWarning(`Sensitive file ${file} exists - ensure it's properly secured`);
      }
    });
  }

  /**
   * Check .gitignore configuration
   */
  checkGitIgnore() {
    console.log('📝 Checking .gitignore...');

    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');

      const requiredEntries = [
        { pattern: '.env', alternatives: ['.env', '.env*'] },
        { pattern: '.env.local', alternatives: ['.env.local', '.env*'] },
        { pattern: '.env.*.local', alternatives: ['.env.*.local', '.env*'] },
        { pattern: 'node_modules', alternatives: ['node_modules', '/node_modules'] },
      ];

      requiredEntries.forEach(({ pattern, alternatives }) => {
        const isIncluded = alternatives.some(alt => gitignore.includes(alt));
        this.addCheck(
          `.gitignore includes ${pattern}`,
          isIncluded,
          `${pattern} should be in .gitignore`
        );
      });
    } else {
      this.addCheck(
        '.gitignore exists',
        false,
        '.gitignore file should exist'
      );
    }
  }

  /**
   * Check Turnstile configuration
   */
  checkTurnstileConfiguration() {
    console.log('🤖 Checking bot protection...');

    // Check Turnstile component exists
    const turnstilePath = 'src/components/security/turnstile.tsx';
    this.addCheck(
      'Turnstile component exists',
      fs.existsSync(turnstilePath),
      'Turnstile component should exist for bot protection'
    );

    // Check Turnstile verification endpoint exists
    const verifyPath = 'src/app/api/verify-turnstile/route.ts';
    this.addCheck(
      'Turnstile verification endpoint exists',
      fs.existsSync(verifyPath),
      'Turnstile verification endpoint should exist'
    );
  }

  /**
   * Add a check result
   */
  addCheck(name, passed, message) {
    this.results.checks.push({
      name,
      passed,
      message,
    });

    if (!passed) {
      this.results.passed = false;
    }

    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}`);
    if (!passed) {
      console.log(`     ${message}`);
    }
  }

  /**
   * Add a warning
   */
  addWarning(message) {
    this.results.warnings.push(message);
    console.log(`  ⚠️  ${message}`);
  }

  /**
   * Add a recommendation
   */
  addRecommendation(message) {
    this.results.recommendations.push(message);
  }

  /**
   * Generate final report
   */
  generateReport() {
    console.log('\n📊 Security Check Report');
    console.log('========================');

    const totalChecks = this.results.checks.length;
    const passedChecks = this.results.checks.filter(c => c.passed).length;
    const failedChecks = totalChecks - passedChecks;

    console.log(`Total checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Failed: ${failedChecks}`);
    console.log(`Warnings: ${this.results.warnings.length}`);

    if (this.results.passed) {
      console.log('\n🎉 All security checks passed!');
    } else {
      console.log('\n⚠️  Some security checks failed. Please review and fix the issues above.');
    }

    // Add general recommendations
    this.addRecommendation('Regularly update dependencies to patch security vulnerabilities');
    this.addRecommendation('Use strong, unique secrets in production');
    this.addRecommendation('Enable security monitoring and alerting');
    this.addRecommendation('Regularly review and update security configurations');

    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    // Save report to file
    const reportPath = 'reports/security-check-report.json';
    const reportsDir = path.dirname(reportPath);

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Report saved to ${reportPath}`);

    // Exit with appropriate code
    process.exit(this.results.passed ? 0 : 1);
  }
}

// Run the security check
if (require.main === module) {
  const checker = new SecurityChecker();
  checker.runChecks().catch(error => {
    console.error('Error running security checks:', error);
    process.exit(1);
  });
}

module.exports = SecurityChecker;

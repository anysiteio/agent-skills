#!/usr/bin/env node

/**
 * Anysite Agent Skills installer for Claude Code
 * Automatically adds the marketplace and displays installation instructions
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🚀 Installing Anysite Agent Skills...\n');

// Check if we're in Claude Code environment
try {
  console.log('📦 Adding marketplace to Claude Code...\n');

  // Try to add marketplace via Claude Code CLI
  try {
    execSync('/plugin marketplace add https://github.com/anysiteio/agent-skills', {
      stdio: 'inherit'
    });
    console.log('\n✅ Marketplace added successfully!\n');
  } catch (error) {
    console.log('⚠️  Could not add marketplace automatically.\n');
    console.log('Please run this command manually in Claude Code:\n');
    console.log('  /plugin marketplace add https://github.com/anysiteio/agent-skills\n');
  }

  console.log('📚 Available Skills:');
  console.log('  • anysite-lead-generation');
  console.log('  • anysite-competitor-intelligence');
  console.log('  • anysite-influencer-discovery');
  console.log('  • anysite-content-analytics');
  console.log('  • anysite-trend-analysis');
  console.log('  • anysite-market-research');
  console.log('  • anysite-audience-analysis');
  console.log('  • anysite-brand-reputation');
  console.log('  • anysite-person-analyzer');
  console.log('  • anysite-vc-analyst');
  console.log('  • anysite-competitor-analyzer\n');

  console.log('💡 To install a skill, run in Claude Code:');
  console.log('  /plugin install anysite-lead-generation@anysite-skills\n');

  console.log('📖 Documentation: https://github.com/anysiteio/agent-skills\n');
  console.log('🔧 MCP Server: https://docs.anysite.io/mcp-server\n');

} catch (error) {
  console.error('Error during installation:', error.message);
  process.exit(1);
}

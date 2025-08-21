const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build process...');

try {
  // Generate Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Try to use nest build first
  try {
    console.log('Running nest build...');
    execSync('npx nest build', { stdio: 'inherit' });
  } catch (error) {
    console.log('Nest build failed, trying TypeScript compiler directly...');
    // Fallback to direct TypeScript compilation
    execSync('npx tsc', { stdio: 'inherit' });
  }
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

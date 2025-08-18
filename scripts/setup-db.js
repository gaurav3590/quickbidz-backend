const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env file exists, if not create it from example
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');
const envExampleContent = `# Database configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/quickbidz?schema=public"

# Application port
PORT=3000

# JWT Secret
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="1d"`;

console.log('Checking for .env file...');
if (!fs.existsSync(envPath)) {
  console.log('.env file not found, creating from example...');
  fs.writeFileSync(envPath, envExampleContent);
  console.log('.env file created successfully!');
} else {
  console.log('.env file already exists, skipping creation.');
}

console.log('\nInstalling dependencies...');
execSync('npm install', { stdio: 'inherit' });

console.log('\nGenerating Prisma client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('\nRunning Prisma migrations...');
console.log('This will create the database tables if they do not exist.');
try {
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
} catch (error) {
  console.error(
    'Error running migrations. Make sure your database is running and the connection string is correct in .env file.',
  );
  process.exit(1);
}

console.log('\nSetup completed successfully!');

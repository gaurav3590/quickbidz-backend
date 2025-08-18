// Script to check environment variables on Vercel

function checkEnvVars() {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_EXPIRATION',
    'JWT_REFRESH_EXPIRATION'
  ];

  console.log('Checking environment variables...');
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('ERROR: Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease add these variables to your Vercel project settings.');
    process.exit(1);
  } else {
    console.log('All required environment variables are set.');
    
    // Log sanitized DATABASE_URL (hide password)
    const dbUrl = process.env.DATABASE_URL || '';
    const sanitizedDbUrl = dbUrl.replace(/:[^:]*@/, ':****@');
    console.log(`DATABASE_URL: ${sanitizedDbUrl}`);
    
    // Log JWT expiration times
    console.log(`JWT_EXPIRATION: ${process.env.JWT_EXPIRATION}`);
    console.log(`JWT_REFRESH_EXPIRATION: ${process.env.JWT_REFRESH_EXPIRATION}`);
    
    console.log('Environment check passed.');
  }
}

checkEnvVars(); 
# QuickBidz Online Auction Platform

QuickBidz is a modern, real-time online auction platform that allows users to list items for auction, place bids, and participate in a secure and interactive bidding experience.

## Features

- **User Authentication**: Secure registration and login system
- **Auction Listings**: Create, browse, and search auction listings
- **Real-time Bidding**: Place bids and receive real-time updates on auction status
- **Comments & Interactions**: Comment on auction listings and interact with sellers
- **Payment Processing**: Secure payment processing for winning bids
- **Notifications**: Real-time notifications for bid updates, auction endings, etc.
- **User Stories**: Personalized experiences and user engagement
- **AI Integration**: Intelligent features powered by AI models (Grok)

## Tech Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **Real-time**: WebSockets for real-time updates
- **AI**: Integration with AI models via @ai-sdk
- **Hosting**: Deployed on Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/quickbidz-backend.git
   cd online-auction-platform-quickbidz-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/quickbidz"
   JWT_SECRET="your-jwt-secret"
   PORT=3005
   ```

4. Run database migrations:

   ```bash
   npm run prisma:migrate
   ```

5. Generate Prisma client:

   ```bash
   npm run prisma:generate
   ```

6. Start the development server:
   ```bash
   npm run start:dev
   ```

## Deployment

The application is configured for deployment on Vercel. For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deploy

1. **Using the deployment script** (recommended):
   ```bash
   # On Windows
   deploy.bat
   
   # On Linux/Mac
   ./deploy.sh
   ```

2. **Manual deployment**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

### Environment Variables

Make sure to set up the following environment variables in your Vercel project:

- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `JWT_EXPIRATION` - JWT token expiration time
- `JWT_REFRESH_EXPIRATION` - Refresh token expiration time

For a complete list of required environment variables, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Performance Monitoring

This application includes Vercel Speed Insights for performance monitoring and optimization.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

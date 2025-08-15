# QuickBidz Backend Setup

## Simplified Database Setup with Script

The easiest way to set up the database is to use our setup script:

```bash
npm run setup
```

This will:

1. Create a `.env` file if it doesn't exist
2. Install dependencies
3. Generate the Prisma client
4. Create database tables

## Manual Database Setup

1. Create a `.env` file in your project root directory with the following:

```
# Database configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/quickbidz?schema=public"

# Application port
PORT=3000

# JWT Secret
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="1d"
```

Replace the values with your actual database credentials.

2. Generate the Prisma client:

```bash
npx prisma generate
```

3. Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

## API Endpoints

### User Endpoints

- **Create User**: `POST /users`

  - Body: `{ "email": "user@example.com", "username": "user1", "password": "password", "firstName": "John", "lastName": "Doe" }`

- **Get All Users**: `GET /users`

- **Get User by ID**: `GET /users/:id`

- **Update User**: `PATCH /users/:id`

  - Body: `{ "firstName": "Updated Name" }` (any user fields can be updated)

- **Delete User**: `DELETE /users/:id`

### Auction Endpoints

- **Create Auction**: `POST /auctions`

  - Body:

  ```json
  {
    "title": "Vintage Watch",
    "description": "Rare vintage watch in excellent condition",
    "startingPrice": 100,
    "startTime": "2023-12-01T10:00:00Z",
    "endTime": "2023-12-08T10:00:00Z"
  }
  ```

- **Get All Auctions**: `GET /auctions`

  - Query Parameters:
    - `status`: Filter by status (PENDING, ACTIVE, ENDED, CANCELLED)
    - `sellerId`: Filter by seller ID
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Search Auctions**: `GET /auctions/search?term=vintage`

  - Query Parameters:
    - `term`: Search term
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Get Auction by ID**: `GET /auctions/:id`

- **Update Auction**: `PATCH /auctions/:id`

  - Body: `{ "title": "Updated Title", "description": "Updated description" }` (any auction fields can be updated)

- **Delete Auction**: `DELETE /auctions/:id`

- **Activate Auction**: `PUT /auctions/:id/activate`

- **Cancel Auction**: `PUT /auctions/:id/cancel`

### Bid Endpoints

- **Place Bid**: `POST /bids`

  - Body:

  ```json
  {
    "amount": 150,
    "auctionId": 1
  }
  ```

- **Get All Bids**: `GET /bids`

  - Query Parameters:
    - `auctionId`: Filter by auction ID
    - `bidderId`: Filter by bidder ID
    - `status`: Filter by status (PLACED, WINNING, OUTBID, ACCEPTED, REJECTED)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Get My Bids**: `GET /bids/my-bids`

  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Get Auction Bids**: `GET /bids/auction/:auctionId`

  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Get Bid by ID**: `GET /bids/:id`

- **Update Bid Status**: `PATCH /bids/:id`

  - Body: `{ "status": "ACCEPTED" }` (only the auction owner can update bid status)

- **Cancel Bid**: `DELETE /bids/:id` (only the bidder can cancel their bid)

### Comment Endpoints

- **Create Comment**: `POST /comments`

  - Body:

  ```json
  {
    "content": "Great item! I'm interested.",
    "auctionId": 1,
    "parentId": null // Optional, for replies to other comments
  }
  ```

- **Get All Comments**: `GET /comments`

  - Query Parameters:
    - `auctionId`: Filter by auction ID
    - `parentId`: Filter by parent comment ID (use 'null' for top-level comments)
    - `userId`: Filter by user ID
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Get My Comments**: `GET /comments/my-comments`

  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Get Auction Comments**: `GET /comments/auction/:auctionId`

  - Query Parameters:
    - `parentId`: Filter by parent comment ID (use 'null' for top-level comments)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Get Comment by ID**: `GET /comments/:id`

- **Update Comment**: `PATCH /comments/:id`

  - Body: `{ "content": "Updated comment text" }` (only the comment owner can update)

- **Delete Comment**: `DELETE /comments/:id` (only the comment owner can delete, and only if it has no replies)

### Notification Endpoints

- **Create Notification**: `POST /notifications`

  - Body:

  ```json
  {
    "type": "BID_PLACED",
    "title": "New Bid Placed",
    "message": "A new bid of $150 has been placed on your auction",
    "userId": 1,
    "data": {
      "auctionId": 1,
      "bidId": 5,
      "amount": 150
    }
  }
  ```

- **Get All Notifications**: `GET /notifications`

  - Query Parameters:
    - `userId`: Filter by user ID
    - `read`: Filter by read status (true/false)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Get My Notifications**: `GET /notifications/my`

  - Query Parameters:
    - `read`: Filter by read status (true/false)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)

- **Get Unread Count**: `GET /notifications/unread-count`

- **Get Notification by ID**: `GET /notifications/:id`

- **Update Notification**: `PATCH /notifications/:id`

  - Body: `{ "read": true }` (only the recipient can update the read status)

- **Mark as Read**: `PATCH /notifications/:id/mark-as-read`

- **Mark All as Read**: `PATCH /notifications/mark-all-as-read`

- **Delete Notification**: `DELETE /notifications/:id` (only the recipient can delete)

- **Delete All Read Notifications**: `DELETE /notifications/delete-all-read`

## Running the Application

1. Install dependencies:

```bash
npm install
```

2. Run the application in development mode:

```bash
npm run start:dev
```

3. The API will be available at `http://localhost:3000`

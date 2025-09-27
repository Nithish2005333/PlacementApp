# MongoDB Atlas Connection Setup

## Current Issue
Your MongoDB Atlas connection is failing because your IP address isn't whitelisted.

## Quick Fix

### 1. Whitelist Your IP Address
1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Navigate to **Network Access** in the left sidebar
3. Click **"Add IP Address"**
4. Click **"Add Current IP Address"** to automatically add your current IP
5. Click **"Confirm"**

### 2. Alternative: Allow All IPs (Development Only)
For development purposes, you can temporarily allow all IPs:
1. In Network Access, click **"Add IP Address"**
2. Enter `0.0.0.0/0` in the IP Address field
3. Add a comment like "Development - All IPs"
4. Click **"Confirm"**

⚠️ **Warning**: Never use `0.0.0.0/0` in production!

## Environment Variables Setup

Create a `.env` file in your project root with:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://placement_user:QuXJcxrr0BiUP2OV@cluster0.yqzgkin.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGO_DB=placement

# Server Configuration
PORT=10000
CLIENT_ORIGIN=http://localhost:5173

# Add other environment variables as needed
```

## After Setup
1. Restart your server: `npm run dev`
2. You should see: `✅ Connected to MongoDB successfully`

## Troubleshooting
- If you still get connection errors, check your MongoDB Atlas cluster status
- Ensure your database user has proper permissions
- Verify the connection string is correct

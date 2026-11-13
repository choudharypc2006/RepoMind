import mongoose from 'mongoose';

/**
 * Connect Express application to MongoDB Atlas
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    console.warn(
      '⚠️ [MongoDB]: MONGODB_URI is not set in backend/.env. Database connection skipped.'
    );
    return false;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ [MongoDB]: Connected successfully to host: ${conn.connection.host}`);
    console.log(`🗄️  [MongoDB]: Database name: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB Connection Error]: ${error.message}`);
    return false;
  }
}

// Connection event listeners for runtime monitoring
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ [MongoDB]: Connection lost. Disconnected from database.');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ [MongoDB Runtime Error]: ${err.message}`);
});

export default connectDB;


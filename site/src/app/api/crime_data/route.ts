/* eslint-disable */
import { MongoClient } from "mongodb";

// Environment variables for MongoDB connection
const MONGO_CONN_STR = process.env.MONGO_CONN_STR as string;
const MONGO_DB = process.env.MONGO_DB as string;
const MONGO_COLL = process.env.MONGO_COLL as string;

// Define the interface for the document structure (adjust this as per your data)
interface Stats {
  _id: string;
  [key: string]: any; // Allows for any other fields in the stats document
}

// Function to read data from MongoDB
async function mongoReadStats(): Promise<any | null> {
  const client = new MongoClient(MONGO_CONN_STR);
  try {
    await client.connect();
    const db = client.db(MONGO_DB);
    const collection = db.collection(MONGO_COLL);
    const stats = await collection.findOne();

    // If no data is found, return null
    if (!stats) return null;

    // Convert _id to string
    // stats._id = stats._id.toString();

    return stats;
  } catch (error) {
    console.error("Error reading from MongoDB:", error);
    throw new Error("Failed to fetch stats");
  } finally {
    await client.close();
  }
}

export async function GET(): Promise<Response> {
  try {
    const data = await mongoReadStats();

    if (!data) {
      return new Response(JSON.stringify({ error: "No data found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
    });
  }
}

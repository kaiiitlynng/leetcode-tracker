import { db } from "../src/lib/db";

await db.$connect();
console.log("Database ready.");
await db.$disconnect();

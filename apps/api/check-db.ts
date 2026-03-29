import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

function getDbConnection() {
  const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/);
  
  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }
  
  const [, user, password, host, port, database] = match;
  
  return {
    user,
    password,
    host,
    port: parseInt(port, 10),
    database,
  };
}

async function checkDb() {
  const config = getDbConnection();
  
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: "postgres"
  });

  try {
    await client.connect();
    console.log("SUCCESS: Connected to 'postgres' database.");
    
    const res = await client.query("SELECT datname FROM pg_database WHERE datname = 'gapminer'");
    if (res.rows.length === 0) {
      console.log("Database 'gapminer' does not exist. Creating...");
      await client.query("CREATE DATABASE gapminer");
      console.log("Database 'gapminer' created successfully.");
    } else {
      console.log("Database 'gapminer' already exists.");
    }
  } catch (err) {
    console.error("FAILURE: Could not connect to Postgres.", err.message);
    if (err.message.includes("authentication failed")) {
      console.log(`HINT: The password for user '${config.user}' might be wrong.`);
      console.log(`Check your DATABASE_URL in .env file.`);
    }
  } finally {
    await client.end();
  }
}

checkDb();

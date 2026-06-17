import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the backend/.env file relative to this script's directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

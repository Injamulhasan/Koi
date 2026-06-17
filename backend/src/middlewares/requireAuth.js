import { db, usersTable } from "../db/index.js";
import { eq } from "drizzle-orm";
import { supabase } from "../lib/supabaseClient.js";
import { logger } from "../lib/logger.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Lookup user in local database by supabase_id
    let [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.supabaseId, user.id));

    // Auto-sync user profile if they exist in Supabase auth but not in our database
    if (!dbUser) {
      const email = user.email;
      const name = user.user_metadata?.name || user.user_metadata?.full_name || email.split("@")[0];
      const avatarUrl = user.user_metadata?.avatar_url || null;

      try {
        const [created] = await db
          .insert(usersTable)
          .values({
            supabaseId: user.id,
            email,
            name,
            avatarUrl,
          })
          .returning();
        dbUser = created;
        logger.info({ userId: dbUser.id }, "Auto-synced new user profile from Supabase");
      } catch (insertErr) {
        // Handle race conditions where another parallel request might have inserted the user
        const [retryUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.supabaseId, user.id));
        if (retryUser) {
          dbUser = retryUser;
        } else {
          throw insertErr;
        }
      }
    }

    req.dbUserId = dbUser.id;
    req.supabaseId = user.id;
    req.user = dbUser;
    next();
  } catch (err) {
    logger.error({ err }, "Error in requireAuth middleware");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const requireDbUser = requireAuth;
export default requireAuth;

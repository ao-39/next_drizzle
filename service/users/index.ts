import { DatabaseError, db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

export const userInsertSchema = createInsertSchema(users, {
  name: z.string().min(1).max(255),
  email: z.string().email(),
  discriminator: z
    .string()
    .regex(/^[A-Za-z0-9_]+$/)
    .min(3)
    .max(255),
}).pick({
  name: true,
  email: true,
  discriminator: true,
});

export type UserInsertType = z.infer<typeof userInsertSchema>;

// user 作成
export async function createUser(user: UserInsertType) {
  try {
    await db.insert(users).values(user);
    return "success";
  } catch (e) {
    // 一意制約違反の場合は409を返す
    if (e instanceof DatabaseError) {
      if (
        e.constraint === "users_discriminator_unique" ||
        e.constraint === "users_email_unique"
      ) {
        return e.constraint;
      }
    }
    // それ以外のエラーは500を返す
    return "internal error";
  }
}

// user 取得
export async function getUserByDiscriminator(discriminator: string) {
  try {
    const selectedUser = await db
      .select({
        name: users.name,
        discriminator: users.discriminator,
      })
      .from(users)
      .where(eq(users.discriminator, discriminator));

    if (selectedUser.length !== 1) {
      return "not found";
    }
    return selectedUser[0];
  } catch (e) {
    return "internal error";
  }
}

export const userUpdateSchema = createInsertSchema(users, {
  name: z.string().min(1).max(255),
  email: z.string().email(),
  discriminator: z
    .string()
    .regex(/^[A-Za-z0-9_]+$/)
    .min(3)
    .max(255),
})
  .pick({
    name: true,
    email: true,
    discriminator: true,
    note: true,
  })
  .partial()
  .refine((val) => Object.keys(val).length >= 1, {
    message: "at least one field is required",
  });

type UserUpdateType = z.infer<typeof userUpdateSchema>;

export async function updateUser(discriminator: string, user: UserUpdateType) {
  try {
    const res = await db
      .update(users)
      .set(user)
      .where(eq(users.discriminator, discriminator));
    console.log(res);
    if (res.rowCount === 0) {
      return "not found";
    }
  } catch (e) {
    // 一意制約違反の場合は409を返す
    if (e instanceof DatabaseError) {
      if (
        e.constraint === "users_discriminator_unique" ||
        e.constraint === "users_email_unique"
      ) {
        return e.constraint;
      }
      return "success";
    }
    // それ以外のエラーは500を返す
    return "internal error";
  }
}

export async function deleteUser(discriminator: string) {
  try {
    const res = await db
      .delete(users)
      .where(eq(users.discriminator, discriminator));
    if (res.rowCount === 0) {
      return "not found";
    }
    return "success";
  } catch (e) {
    // それ以外のエラーは500を返す
    return "internal error";
  }
}

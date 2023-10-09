import { db, DatabaseError } from "@/db/db";
import { users } from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { createInsertSchema } from "drizzle-zod";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const userInsertReqSchema = createInsertSchema(users, {
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

type UserInsertReqSchema = z.infer<typeof userInsertReqSchema>;

export const userInsertResSchema = createSelectSchema(users).pick({
  name: true,
  email: true,
  discriminator: true,
});

type UserInsertReturn = z.infer<typeof userInsertResSchema>;

type UserInsertRes =
  | {
      data: UserInsertReturn;
    }
  | {
      validateError?: z.ZodError<UserInsertReqSchema>;
      uniqueError?: "users_discriminator_unique" | "users_email_unique";
      error?: "internal error";
    };

export async function POST(
  req: NextRequest
): Promise<NextResponse<UserInsertRes>> {
  // bodyのバリデーション
  const insertUserResult = userInsertReqSchema.safeParse(await req.json());

  if (!insertUserResult.success) {
    return NextResponse.json(
      { validateError: insertUserResult.error },
      {
        status: 400,
      }
    );
  }

  try {
    // insertとselectを行う
    const usersRes = await db
      .insert(users)
      .values(insertUserResult.data)
      .returning({
        name: users.name,
        email: users.email,
        discriminator: users.discriminator,
      });
    return NextResponse.json(
      { data: usersRes[0] },
      {
        status: 201,
      }
    );
  } catch (e) {
    // 一意制約違反の場合は409を返す
    if (e instanceof DatabaseError) {
      if (
        e.constraint === "users_discriminator_unique" ||
        e.constraint === "users_email_unique"
      ) {
        return NextResponse.json(
          { uniqueError: e.constraint },
          {
            status: 409,
          }
        );
      }
    }
    // それ以外のエラーは500を返す
    return NextResponse.json(
      { error: "internal error" },
      {
        status: 500,
      }
    );
  }
}

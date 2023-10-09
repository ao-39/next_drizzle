import { db } from "@/db/db";
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

type UserInsertRes = z.infer<typeof userInsertResSchema>;

export async function POST(req: NextRequest): Promise<
  NextResponse<
    | UserInsertRes
    | {
        message: z.ZodError<UserInsertReqSchema>;
      }
  >
> {
  // bodyのバリデーション
  const insertUserResult = userInsertReqSchema.safeParse(await req.json());

  if (!insertUserResult.success) {
    return NextResponse.json(
      { message: insertUserResult.error },
      {
        status: 400,
      }
    );
  }

  // insertとselectを行う
  const usersRes = await db
    .insert(users)
    .values(insertUserResult.data)
    .returning({
      name: users.name,
      email: users.email,
      discriminator: users.discriminator,
    });

  return NextResponse.json(usersRes[0]);
}

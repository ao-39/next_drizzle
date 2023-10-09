import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSelectSchema } from "drizzle-zod";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const userSelectResSchema = createSelectSchema(users, {
  name: z.string().min(1).max(255),
  email: z.string().email(),
  discriminator: z
    .string()
    .regex(/^[A-Za-z0-9_]+$/)
    .min(3)
    .max(255),
}).pick({
  name: true,
  discriminator: true,
});

export type UserSelectResSchema = z.infer<typeof userSelectResSchema>;

type UserSelectRes =
  | { data: UserSelectResSchema }
  | {
      error?: "not found";
    };

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { discriminator: string };
  }
): Promise<NextResponse<UserSelectRes>> {
  const selectedUser = await db
    .select({
      name: users.name,
      discriminator: users.discriminator,
    })
    .from(users)
    .where(eq(users.discriminator, params.discriminator));

  if (selectedUser.length !== 1) {
    return NextResponse.json(
      {
        error: "not found",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json({ data: selectedUser[0] });
}

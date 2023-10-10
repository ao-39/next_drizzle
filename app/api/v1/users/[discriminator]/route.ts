import { DatabaseError, db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
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

export const userInsertReqSchema = createInsertSchema(users, {
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

type UserUpdateReqType = z.infer<typeof userInsertReqSchema>;

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: { discriminator: string };
  }
): Promise<
  NextResponse<null | {
    validateError?: z.ZodError<UserUpdateReqType>;
    constraintError?: "users_discriminator_unique" | "users_email_unique";
    error?: "not found" | "internal error";
  }>
> {
  const validUpdateUser = userInsertReqSchema.safeParse(await request.json());

  if (validUpdateUser.success === false) {
    return NextResponse.json(
      {
        validateError: validUpdateUser.error,
      },
      {
        status: 400,
      }
    );
  }

  try {
    const res = await db
      .update(users)
      .set(validUpdateUser.data)
      .where(eq(users.discriminator, params.discriminator));
    console.log(res);
    if (res.rowCount === 0) {
      return NextResponse.json(
        {
          error: "not found",
        },
        {
          status: 404,
        }
      );
    }
  } catch (e) {
    // 一意制約違反の場合は409を返す
    if (e instanceof DatabaseError) {
      if (
        e.constraint === "users_discriminator_unique" ||
        e.constraint === "users_email_unique"
      ) {
        return NextResponse.json(
          { constraintError: e.constraint },
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

  return new NextResponse(null, {
    status: 204,
  });
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: { discriminator: string };
  }
): Promise<NextResponse<null | { error?: "not found" | "internal error" }>> {
  try {
    const res = await db
      .delete(users)
      .where(eq(users.discriminator, params.discriminator));
    if (res.rowCount === 0) {
      return NextResponse.json(
        {
          error: "not found",
        },
        {
          status: 404,
        }
      );
    }
  } catch (e) {
    // それ以外のエラーは500を返す
    return NextResponse.json(
      { error: "internal error" },
      {
        status: 500,
      }
    );
  }
  return new NextResponse(null, { status: 204 });
}

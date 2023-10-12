import { createUser, userInsertSchema } from "@/service/users";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const userValid = userInsertSchema.safeParse(await request.json());
  if (!userValid.success) {
    return NextResponse.json(
      {
        error: userValid.error,
      },
      {
        status: 400,
      }
    );
  }
  const result = await createUser(userValid.data);
  if (result === "success") {
    return NextResponse.json(null, { status: 201 });
  } else if (
    result === "users_discriminator_unique" ||
    result === "users_email_unique"
  ) {
    return NextResponse.json(
      {
        error: result,
      },
      {
        status: 409,
      }
    );
  } else {
    return NextResponse.json(
      {
        error: "internal error",
      },
      {
        status: 500,
      }
    );
  }
}

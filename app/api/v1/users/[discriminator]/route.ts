import {
  deleteUser,
  getUserByDiscriminator,
  updateUser,
  userUpdateSchema,
} from "@/service/users";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { discriminator: string };
  }
) {
  const user = await getUserByDiscriminator(params.discriminator);
  if (user === "not found") {
    return NextResponse.json(
      {
        error: "not found",
      },
      {
        status: 404,
      }
    );
  } else if (user === "internal error") {
    return NextResponse.json(
      {
        error: "internal error",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({ data: user });
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: { discriminator: string };
  }
) {
  const userValid = userUpdateSchema.safeParse(await request.json());
  if (!userValid.success) {
    return NextResponse.json(
      {
        validateError: userValid.error,
      },
      {
        status: 400,
      }
    );
  }
  const result = await updateUser(params.discriminator, userValid.data);
  if (result === "not found") {
    return NextResponse.json(
      {
        error: "not found",
      },
      {
        status: 404,
      }
    );
  } else if (result === "internal error") {
    return NextResponse.json(
      {
        error: "internal error",
      },
      {
        status: 500,
      }
    );
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
  }
  return NextResponse.json(null, { status: 204 });
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: { discriminator: string };
  }
) {
  const result = await deleteUser(params.discriminator);
  if (result === "not found") {
    return NextResponse.json(
      {
        error: "not found",
      },
      {
        status: 404,
      }
    );
  } else if (result === "internal error") {
    return NextResponse.json(
      {
        error: "internal error",
      },
      {
        status: 500,
      }
    );
  }
  return NextResponse.json(null, { status: 204 });
}

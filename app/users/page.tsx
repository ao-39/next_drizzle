import { createUser, userInsertSchema } from "@/service/users";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export default async function Page(params: { searchParams: { e?: string } }) {
  async function createUserAction(formData: FormData) {
    "use server";
    const userValid = userInsertSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      discriminator: formData.get("discriminator"),
    });

    if (!userValid.success) {
      redirect(`/users?e=${"validation"}`);
    }

    const result = await createUser(userValid.data);

    if (result === "success") {
      redirect(`/users/${userValid.data.discriminator}?m=${"created"}`);
    } else if (result === "internal error") {
      redirect(`/users?e=${"server_error"}`);
    } else if (
      result === "users_discriminator_unique" ||
      result === "users_email_unique"
    ) {
      redirect(`/users?e=${result}`);
    }
  }

  return (
    <>
      <form action={createUserAction}>
        <input type="text" name="name" />
        <input type="text" name="email" />
        <input type="text" name="discriminator" />
        <button type="submit">Submit</button>
      </form>
      <div>{params.searchParams.e}</div>
    </>
  );
}

export default async function Page({
  params,
}: {
  params: { discriminator: string };
}) {
  return (
    <>
      <div>ユーザー画面</div>
      <div>{params.discriminator}</div>
    </>
  );
}

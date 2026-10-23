import AuthForm from "../../../components/auth-form";
export default async function Page({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return <AuthForm mode={path} />;
}

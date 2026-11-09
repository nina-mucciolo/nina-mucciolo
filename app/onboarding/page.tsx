import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import UsernameForm from "./UsernameForm";

export default async function Onboarding() {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("profiles").select("username, display_name").eq("id", user.id).single();
  return (
    <div className="login">
      <div className="login-card">
        <h1>{data?.username ? "Edit profile" : "Pick a username"}</h1>
        <p className="muted">Friends find you by this.</p>
        <UsernameForm username={data?.username ?? ""} displayName={data?.display_name ?? ""} />
      </div>
    </div>
  );
}

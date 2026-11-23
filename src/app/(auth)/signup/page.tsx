import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "../auth-form";

export const metadata = { title: "Create account · LeetCode Tracker" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="signup" />;
}

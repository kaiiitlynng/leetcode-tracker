import { NextResponse } from "next/server";
import { getProblems } from "@/app/actions";

export async function GET() {
  const problems = await getProblems();
  return NextResponse.json(problems);
}

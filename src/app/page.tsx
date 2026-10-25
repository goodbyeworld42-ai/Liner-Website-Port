import { redirect } from "next/navigation";

// The real Liner web port (SPA built from tryliner/desktop) is served at
// /liner/index.html and mapped to "/" via next.config.ts rewrites. This page
// only acts as a fallback if the rewrite is bypassed.
export default function Home() {
  redirect("/liner/index.html");
}

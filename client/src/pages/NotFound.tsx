import { Link } from "wouter";
import { Mark } from "@/components/Brand";

export default function NotFound() {
  return (
    <section className="wall grain flex min-h-[100svh] flex-col items-center justify-center px-5 pt-24 text-center">
      <Mark className="w-32 animate-wobble" />
      <h1 className="font-display mt-6 text-[30vw] leading-none text-[var(--flavor)] md:text-[14rem]">404</h1>
      <p className="font-display text-4xl">Too krunk'd to find this page.</p>
      <Link href="/" className="btn btn-spray mt-8">Take me home</Link>
    </section>
  );
}

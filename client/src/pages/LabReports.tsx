import { LAB_REPORTS_URL } from "@shared/const";
import { useEffect } from "react";
import { Mark } from "@/components/Brand";

/**
 * Lab reports live in a shared Dropbox folder. Old links to /lab-reports
 * forward there; the page only shows for the moment the redirect takes.
 */
export default function LabReports() {
  useEffect(() => {
    window.location.replace(LAB_REPORTS_URL);
  }, []);

  return (
    <section className="wall flex min-h-[100svh] flex-col items-center justify-center px-5 pt-24 text-center">
      <Mark className="w-24 animate-wobble" />
      <p className="font-display mt-6 text-5xl">Opening lab reports…</p>
      <a href={LAB_REPORTS_URL} className="btn btn-spray mt-6">
        Open lab reports
      </a>
    </section>
  );
}

"use client";

import { useEffect } from "react";
import { sitePath } from "@/lib/content";

// Static detail HTML remains readable without JavaScript; interactive visits use the same two-rail shell.
export function ProjectDetailRedirect({ id }: { id: string }) {
  useEffect(() => { window.location.replace(`${sitePath("/")}#project/${id}/details`); }, [id]);
  return null;
}

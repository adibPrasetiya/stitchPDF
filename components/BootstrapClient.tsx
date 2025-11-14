"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // Import Bootstrap JavaScript dynamically on client side
    // @ts-expect-error - Bootstrap bundle types not available
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null;
}

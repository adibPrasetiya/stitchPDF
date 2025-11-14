"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // Import Bootstrap JavaScript dynamically on client side
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null;
}

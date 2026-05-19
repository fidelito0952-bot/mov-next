"use client";

import { useEffect } from "react";

export default function LandingRedirect() {
  useEffect(() => {
    window.location.href = "/mov";
  }, []);
  return null;
}

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { authClient } from "../client";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await authClient.signOut();
    // Full page load on purpose: the client router would reuse cached pages with the old session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  return (
    <Button variant="ghost" onClick={handleClick} disabled={pending}>
      Cerrar sesión
    </Button>
  );
}

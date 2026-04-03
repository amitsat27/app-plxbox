import React from "react";
import DebugScreen from "../components/ui/DebugScreen";

// This screen is only accessible in development
// In production, this route will 404 automatically
export default function DebugRoute() {
  return <DebugScreen />;
}

'use client'

import Dashboard from "@/components/Dashboard";
import { useState } from "react";

export default function Home() {

  const [input, setInput] = useState('');
  return (
    <div className="w-full h-fit">
      <Dashboard/>
    </div>
  );
}

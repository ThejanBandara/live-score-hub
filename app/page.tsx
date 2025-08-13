'use client'

import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export default function Home() {

  const {user, loading} = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      toast.error("You must be logged in to access this page.");
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center gap-2 skeleton">
      <span className="loading loading-spinner loading-lg"></span>
      <span>Loading... Please Wait</span>
    </div>;
  }
  return (
    <div className="w-full h-fit">
      <Dashboard/>
    </div>
  );
}

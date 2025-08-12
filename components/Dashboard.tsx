"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { auth } from "@/utils/firebase";
import { signOut } from "firebase/auth";

type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
};

export default function DashboardPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/matches", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        // Sort matches
        const statusOrder = { live: 0, scheduled: 1, ended: 2, cancelled: 3 };
        data.sort((a: Match, b: Match) => statusOrder[a.status] - statusOrder[b.status]);

        setMatches(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMatches();
  }, []);

  const filteredMatches =
    filter === "all" ? matches : matches.filter((m) => m.status === filter);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="p-4 space-y-4">
      {/* Navbar */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Image src="/VimasaLogo.png" alt="Logo" width={80} height={40} />
          <span className="font-bold text-lg">Live Score Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Button className="flex items-center gap-1" variant={'outline'}>
            <Plus size={18} /> Create Match
          </Button>
          <Popover>
            <PopoverTrigger>
              <Avatar>
                <AvatarImage src="/avatar.png" />
                <AvatarFallback>VI</AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push("/profile")}
              >
                <User size={16} className="mr-2" /> Profile
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut size={16} className="mr-2" /> Log out
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {["all", "scheduled", "live", "ended", "cancelled"].map((state) => (
          <Button
            key={state}
            variant={filter === state ? "default" : "outline"}
            onClick={() => setFilter(state)}
          >
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </Button>
        ))}
      </div>

      {/* Card grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {filteredMatches.map((match) => (
          <Card key={match.id}>
            <CardHeader>
              <CardTitle>
                {match.homeTeam} vs {match.awayTeam}
              </CardTitle>
              <CardDescription>
                {new Date(match.date).toLocaleString()} • {match.status}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-2">
              <Button size="sm" variant="outline">
                Edit
              </Button>
              <Button size="sm" variant="destructive">
                Delete
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(`/matches/${match.id}`)}
              >
                Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

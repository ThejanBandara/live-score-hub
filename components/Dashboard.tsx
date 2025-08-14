"use client";

// imports
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/utils/firebase";
import { signOut } from "firebase/auth";
import { LogOut, Plus, Settings, User, Delete } from "lucide-react";
import Image from "next/image";
import {
  MatchDoc,
  MatchStateDoc,
  rugbyPlayer,
  TeamCard,
} from "@/types/RugbyMatch";
import toast from "react-hot-toast";
import MatchCard from "./MatchCard";
import CreateMatchModal from "./modals/CreateMatch";

const Dashboard = () => {
  // Matches storage
  const [matches, setMatches] = useState<MatchDoc[]>([]);
  // filter 
  const [filter, setFilter] = useState("all");
  // Create Match Modal
  const [showModal, setShowModal] = useState(false);

  const router = useRouter();

  // Fetch matches on component mount 
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/matches", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const statusOrder = { live: 0, scheduled: 1, ended: 2, cancelled: 3 };
        data.sort(
          (a: MatchDoc, b: MatchDoc) =>
            statusOrder[a.status] - statusOrder[b.status]
        );
        setMatches(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMatches();
  }, []);



  // Filter matches based on selected filter
  const filteredMatches =
    filter === "all" ? matches : matches.filter((m) => m.status === filter);

  // Handle user logout
  const handleLogout = async () => {
    toast("Logging out...");
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="w-full min-h-screen bg-base-300">

      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-sm px-4">

        {/* Navbar left (logo and text */}
        <div className="flex flex-1 flex-row items-center gap-2">
          <Image
            src={"/VimasaLogo.png"}
            width={90}
            height={30}
            alt="Vimasa Logo"
          />
          <a className="text-xl">Live Score Hub</a>
        </div>

        {/* Navbar right (buttons and avatar) */}
        <div className="flex flex-row gap-4 items-center">
          <button className="btn btn-info" onClick={() => setShowModal(true)}>
            <Plus /> <span className="ml-2">Add Match</span>
          </button>
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                <img
                  alt="Avatar"
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <a>
                  <User className="size-5" />
                  Profile
                </a>
              </li>
              <li>
                <a>
                  <Settings className="size-5" />
                  Settings
                </a>
              </li>
              <li onClick={handleLogout}>
                <a className=" text-error">
                  <LogOut className="size-5" />
                  Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 p-4">
        {["all", "scheduled", "live", "ended", "cancelled"].map((state) => (
          <button
            key={state}
            className={`btn btn-sm ${
              filter === state ? "btn-info" : "btn-ghost btn-soft"
            }`}
            onClick={() => setFilter(state)}
          >
            {state.charAt(0).toUpperCase() + state.slice(1)}
          </button>
        ))}
      </div>

      {/* Matches grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 px-4">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchCard key={match.rugbyMatchID} match={match}/>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No matches found</p>
          </div>
        )}
      </div>

      {/* Comprehensive Modal Form */}
      {showModal && (
        <CreateMatchModal isOpen={showModal} setIsOpen={setShowModal}/>
      )}
    </div>
  );
};

export default Dashboard;
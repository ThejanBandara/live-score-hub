"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {user, loading: authLoading} = useAuth();

  // Redirect if user is already logged in
  if (!authLoading && user) {
    router.push("/");
    return null; 
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      localStorage.setItem("token", token);
      router.push("/");
    } catch (err: any) {
      const code = err.code || "unknown";
      setError(getFriendlyError(code));
    } finally {
      setLoading(false);
    }
  };

  function getFriendlyError(code: string) {
    switch (code) {
      case "auth/invalid-email": return "Invalid email format.";
      case "auth/user-not-found": return "No account found for this email.";
      case "auth/wrong-password": return "Incorrect password.";
      default: return "Login failed. Please try again.";
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-800 to-indigo-900">
      <form onSubmit={handleLogin} className="p-6 border rounded-lg w-5/6 sm:w-4/6 md:w-3/6 lg:w-4/12 xl:w-3/12 bg-gray-200 shadow-lg flex flex-col items-center">
        <Image src={'/VimasaLogo.png'} width={200} height={100} alt="Vimasa Logo"/>
        <h1 className="text-2xl font-bold mb-4 text-black text-center">Vimasa Network <br /> Live Score Hub</h1>
        <h2 className="text-black w-full text-left py-2 text-xl">Log in</h2>
        {error && <p className="text-red-500 text-sm mb-2 w-full ">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full mb-2 rounded border-black text-black"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full mb-4 rounded border-black text-black"
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-500 text-white p-2 w-full rounded ${loading && "opacity-50"}`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

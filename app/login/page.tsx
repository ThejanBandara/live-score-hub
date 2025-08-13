"use client";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (!authLoading && user) {
    toast.success("Logged in successfully!");
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
      case "auth/invalid-email":
        return "Invalid email format.";
      case "auth/user-not-found":
        return "No account found for this email.";
      case "auth/wrong-password":
        return "Incorrect password.";
      default:
        return "Login failed. Please try again.";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <form
        onSubmit={handleLogin}
        className="card w-full max-w-md bg-base-100 shadow-xl p-8 space-y-6"
      >
        <div className="flex justify-center mb-4">
          <Image
            src={"/VimasaLogo.png"}
            width={200}
            height={100}
            alt="Vimasa Logo"
            className="object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-center text-primary">
          Vimasa Network
          <br />
          Live Score Hub
        </h1>
        <h2 className="text-xl font-semibold text-center mt-2">Log in</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input input-bordered w-full"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input input-bordered w-full"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`btn w-full ${loading ? " btn-disabled	" : "btn-primary"}`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

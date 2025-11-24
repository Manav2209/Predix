"use client";
import { Eye } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "@/lib/config";

interface AuthFormProps {
  type: string;
}

export const AuthForm = ({ type }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === "signin") {
        const res = await axios.post(`${API_URL}/signin`, { email, password });
        const resData = res.data;
        console.log(resData)
        if (resData.success) {
          localStorage.setItem("token", resData.data);
          console.log("token", localStorage.getItem("token"))

          toast.success("Signed in successfully");
          router.push("/event");
          return;
        }
        toast.error("Failed to sign in");
      } else if (type === "signup") {
        const res = await axios.post(`${API_URL}/signup`, {
          username,
          email,
          password,
        });

        if (res.data.success) {
          toast.success("Signed up successfully. You can now sign in");
          router.push("/event");
          return;
        }
        toast.error("Failed to sign up");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${type === "signin" ? "sign in" : "sign up"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md shadow-2xl border border-white/10 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center bg-green-500/20 rounded-full p-3">
            <Eye className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">Predix</h1>
          <p className="mt-1 text-gray-400 text-sm">
            {type === "signin"
              ? "Welcome back! Please sign in to continue."
              : "Create your account to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {type === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Username
              </label>
              <input
                onChange={(e) => setUsername(e.target.value)}
                type="text"
                name="username"
                id="username"
                placeholder="Enter your username"
                className="w-full rounded-lg border border-gray-700 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email address
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              name="email"
              id="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-700 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Password
              </label>
              {type === "signin" && (
                <a
                  href="#"
                  className="text-sm text-green-400 hover:text-green-300 transition"
                >
                  Forgot password?
                </a>
              )}
            </div>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              name="password"
              id="password"
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-gray-700 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold py-2 transition disabled:opacity-60"
          >
            {loading
              ? type === "signin"
                ? "Signing in..."
                : "Signing up..."
              : type === "signin"
              ? "Sign In"
              : "Sign Up"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          {type === "signin" ? (
            <>
              Don’t have an account?{" "}
              <a
                href="/auth/signup"
                className="text-green-400 font-semibold hover:text-green-300 transition"
              >
                Sign up
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a
                href="/auth/signin"
                className="text-green-400 font-semibold hover:text-green-300 transition"
              >
                Sign in
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  ); 
};

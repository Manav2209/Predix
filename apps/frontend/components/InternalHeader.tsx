"use client";
import { Eye, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const InternalHeader = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token")
        console.log(token)
        const res = await axios.get(`${API_URL}/me`, {
          headers: { Authorization:  `${token}` },
        });
        console.log("Fetched user:", res);
        setUser(res.data.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    };

    if (localStorage.getItem("token")) fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/auth/signin");
  };

  return (
    <header className="text-black shadow-md w-full bg-white">
      <div className="h-16 flex items-center justify-between px-10">
        <Link href="/" className="flex items-center gap-1 cursor-pointer">
          <Eye />
          <span className="text-2xl font-semibold hidden sm:block">Predix</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-md relative group">
            <span className="relative">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>
          <Link href="/event" className="text-md relative group">
            <span className="relative">
              Trade
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>
        </nav>

        {user ? (
          <div className="flex items-center space-x-6">
            <div className="flex flex-row items-center gap-2 p-2 rounded-xl bg-gray-50">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-semibold">{user.balance}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative flex items-center gap-2 bg-gray-200 p-2 rounded-full cursor-pointer">
                  <User />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-none">
                <DropdownMenuGroup>
                  <DropdownMenuItem disabled>
                    {user.username}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 hover:bg-gray-100"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <Link
            href="/auth/signin"
            className="hidden md:block bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/80 transition"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  );
};

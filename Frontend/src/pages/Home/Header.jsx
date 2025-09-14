import React, { useEffect, useState } from "react";
import { Search, ShoppingCart, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { logo } from "../../assets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null); // null = not fetched yet
  const [loading, setLoading] = useState(true);

  const cartItemsCount = 3; // dummy

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/user/profile", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setProfile(false); // 401 → user not signed in
        }
      } catch {
        setProfile(false);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:8080/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setProfile(false);
    navigate("/");
  };

  /* ---------- render helpers ---------- */
  const renderRight = () => {
    if (loading) return null; // keep UI clean while loading

    if (!profile) {
      // ---------------- not signed in ----------------
      return (
        <Button variant="outline" size="sm" asChild>
          <Link to="/email">Sign in</Link>
        </Button>
      );
    }

    // ---------------- signed in ----------------
    const initials = `${profile.name?.[0] ?? ""}${
      profile.name?.[1] ?? ""
    }`.toUpperCase();
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9 border-2 cursor-pointer">
              <AvatarImage src={profile.avatar} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{profile.name || profile.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/orders">Orders</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  /* ---------- actual render ---------- */
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 text-xl font-bold tracking-tight">
          {/* Logo */}
          <img
            className="h-12 w-26"
            src={logo}
            alt="logo"
          />
          <span
            className="text-2xl mb-1 font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent"
           style={{textShadow: "2px 2px 4px rgba(0,0,0,0.4), -1px -1px 2px rgba(255,255,255,0.2)", lineHeight:1.1}}>
                Poster <br /> पटाका
          </span>
        </Link>

        {/* CENTER: search */}
        <div className="hidden w-full max-w-sm md:block">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products…"
              className="pl-8"
            />
          </div>
        </div>

        {/* RIGHT: profile / cart */}
        <div className="flex items-center gap-4">
          {renderRight()}

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

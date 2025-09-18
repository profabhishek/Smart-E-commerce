import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-purple-900 to-black text-gray-300 border-t border-gray-700 mt-0">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo & Tagline */}
          <div>
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow">
              Poster पटाका
            </h2>
            <p className="mt-3 text-gray-400 text-sm leading-relaxed">
              Bring your walls to life with our unique and vibrant posters.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-white cursor-pointer">Home</Link></li>
              <li><Link to="/profile" className="hover:text-white cursor-pointer">My Account</Link></li>
              <li><Link to="/orders" className="hover:text-white cursor-pointer">Orders</Link></li>
              <li><Link to="/cart" className="hover:text-white cursor-pointer">Cart</Link></li>
              <li><Link to="/admin/login" className="hover:text-white cursor-pointer">Admin Login</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
              Categories
            </h3>
            <ul className="space-y-2">
              <li><Link to="/categories/abstract" className="hover:text-white cursor-pointer">Abstract</Link></li>
              <li><Link to="/categories/motivational" className="hover:text-white cursor-pointer">Motivational</Link></li>
              <li><Link to="/categories/movies" className="hover:text-white cursor-pointer">Movies</Link></li>
              <li><Link to="/categories/anime" className="hover:text-white cursor-pointer">Anime</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" /> support@posterpataka.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" /> +91 98765 43210
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" /> New Delhi, India
              </li>
            </ul>
          </div>
        </div>

        {/* Separator */}
        <Separator className="my-8 bg-gray-700" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Poster Pataka. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" asChild>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="cursor-pointer">
                <Facebook className="h-5 w-5 text-gray-400 hover:text-blue-500" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="cursor-pointer">
                <Instagram className="h-5 w-5 text-gray-400 hover:text-pink-500" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="cursor-pointer">
                <Twitter className="h-5 w-5 text-gray-400 hover:text-sky-400" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";
import Header from "./Header";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <Header />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-100 via-white to-green-50 py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 leading-tight">
            Express Yourself with <span className="text-green-700">Posters</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Find trendy, quirky, and inspiring posters to brighten up your walls.
            From art prints to motivational quotes, Poster Pataka has it all.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              to="/products"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md"
            >
              Shop Now
            </Link>
            <Link
              to="/about"
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Featured Posters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Example product cards (replace with API later) */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >
                <img
                  src={`https://picsum.photos/400/300?random=${i}`}
                  alt={`Poster ${i}`}
                  className="w-full h-56 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Poster #{i}
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">
                    Aesthetic wall art to brighten your space.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 font-bold">₹299</span>
                    <Link
                      to={`/products/${i}`}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {["Motivational", "Anime", "Minimal", "Music"].map((cat) => (
              <Link
                key={cat}
                to={`/category/${cat.toLowerCase()}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md flex flex-col items-center"
              >
                <img
                  src="https://picsum.photos/200/200"
                  alt={cat}
                  className="w-20 h-20 rounded-full mb-4 object-cover"
                />
                <span className="font-medium text-gray-700">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-6 mt-auto">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} Poster Pataka. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

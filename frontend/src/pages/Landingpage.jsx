import React from "react";
import LandingPageAppBar from "../components/LandingPageHeader";
import { Link } from "react-router-dom"; // ✅ Fixed import
import { motion } from "framer-motion";

function Landingpage() {
  return (
    <>
      <LandingPageAppBar />

      <main className="flex flex-col items-center px-4 py-6 space-y-14 bg-gray-100 text-center pb-20">

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl font-bold">MAZIWA</h1>
          <p className="text-base text-gray-600">Your Smart Money Companion</p>
          <p className="mt-2 text-sm text-gray-700 italic">
            Join your chama, contribute, borrow & grow together.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 flex gap-4 justify-center">
            <Link
              to="/login"
              className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition"
            >
              Register
            </Link>
          </div>
        </motion.section>

        {/* Why Choose Us */}
        <motion.section
          className="max-w-md"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-semibold text-lg">WHY CHOOSE US?</h2>
          <p className="text-sm text-gray-700 mt-2">
            Maziwa brings all your financial needs under one roof, allowing you to
            track expenses, save smarter, and invest effortlessly. No more juggling
            multiple apps—manage everything in one place.
          </p>
        </motion.section>

        {/* Image Section */}
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-white p-4 rounded-lg shadow-md"
        >
          <img
            src="/growth.png"
            alt="Growth chart"
            className="w-60 mx-auto rounded-md"
          />
          <p className="text-xs text-gray-500 mt-2">Track your growth easily</p>
        </motion.section>

        {/* Powered By */}
        <motion.section
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h3 className="italic font-semibold">POWERED BY</h3>
          <div className="flex justify-center items-center gap-10 mt-4 flex-wrap">
            <img src="/cj2.jpg" alt="CMA" className="w-16 sm:w-20" />
            <img src="/safaricom.png" alt="Safaricom" className="w-16 sm:w-20" />
          </div>
        </motion.section>

        {/* Contact Form */}
        <motion.section
          className="bg-white w-full max-w-md p-4 rounded shadow-md"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <form className="flex flex-col gap-3">
            <input type="text" placeholder="Name" className="p-2 border rounded" />
            <input type="email" placeholder="Email" className="p-2 border rounded" />
            <textarea placeholder="Your Message" className="p-2 border rounded" />
            <button type="submit" className="bg-black text-white py-2 rounded">
              SUBMIT
            </button>
          </form>
        </motion.section>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-600 pt-6 border-t w-full">
          <p>📧 concretejungle@gmail.com</p>
          <p>📞 0117155550</p>

          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>

          <p className="mt-4 text-xs">
            Copyrights © 2025 Concrete Jungle Holdings
          </p>
        </footer>
      </main>
    </>
  );
}

export default Landingpage;
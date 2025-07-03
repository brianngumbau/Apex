import React from "react";
import Nav from "../components/Navbar";
import ProminentAppBar from "../components/header";

function Landingpage() {
  
  return (
    <>
      < ProminentAppBar />

      <main className="flex flex-col items-center px-4 py-6 space-y-10 bg-gray-100 text-center pb-20">

        {/* Title */}
        <section>
          <h1 className="text-2xl font-bold">MAZIWA</h1>
          <p className="text-sm text-gray-600">Your Smart Money Companion</p>
        </section>

        {/* Why Choose Us */}
        <section className="max-w-md">
          <h2 className="font-semibold text-lg">WHY CHOOSE US?</h2>
          <p className="text-sm text-gray-700 mt-2">
            Maziwa brings all your financial needs under one roof, allowing you to
            track expenses, save smarter, and invest effortlessly. No more juggling
            multiple apps—manage everything in one place.
          </p>
        </section>

        {/* Image Section */}
        <section>
          <img
            src="/growth.png"
            alt="Growth chart"
            className="w-60 rounded-md shadow-md"
          />
        </section>

        {/* Powered By */}
        <section className="text-center">
          <h3 className="italic font-semibold">POWERED BY</h3>
          <div className="flex justify-center items-center gap-10 mt-4">
            <img src="/cj2.jpg" alt="CMA" className="w-20" />
            <img src="/safaricom.png" alt="Safaricom" className="w-20" />
          </div>
        </section>

        {/* Contact Form */}
        <section className="bg-white w-full max-w-md p-4 rounded shadow-md">
          <form className="flex flex-col gap-3">
            <input type="text" placeholder="Name" className="p-2 border rounded" />
            <input type="email" placeholder="Email" className="p-2 border rounded" />
            <textarea placeholder="Your Message" className="p-2 border rounded" />
            <button type="submit" className="bg-black text-white py-2 rounded">SUBMIT</button>
          </form>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-600 pt-6 border-t w-full">
          <p>📧 concretejungle@gmail.com</p>
          <p>📞 0712345678</p>
          <p className="mt-4 text-xs">Copyrights © 2025 Concrete Jungle Holdings</p>
        </footer>
      </main>

      <Nav />
    </>
  );
}

export default Landingpage;

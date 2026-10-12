import React from "react";
import Navbar from "../components/Navbar";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-red-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-16 mt-8">
      
        <h1 className="text-4xl font-bold text-center text-rose-500 mb-8">
          About Community Skill Exchange Platform
        </h1>

       
        <section className="mb-12 text-center">
          <p className="text-gray-700 text-lg leading-relaxed">
            Our platform connects learners and experts to exchange skills and
            grow together. Whether you’re a developer, artist, teacher, or student,
            we help you share your knowledge and learn something new — completely free.
          </p>
        </section>

       
        <section className="grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-rose-500 mb-3"> Connect</h3>
            <p className="text-gray-600">
              Meet people who share your passion for learning and teaching skills.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-rose-500 mb-3"> Learn</h3>
            <p className="text-gray-600">
              Gain new abilities directly from experienced community members.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-rose-500 mb-3"> Share</h3>
            <p className="text-gray-600">
              Share your expertise, host workshops, and inspire others to grow.
            </p>
          </div>
        </section>

        
        <section className="mt-16 text-center">
          <h2 className="text-3xl font-semibold text-rose-500 mb-4">Our Vision</h2>
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
            We believe that learning should never stop. By building a community of
            collaboration and mutual growth, we aim to make knowledge accessible to all —
            empowering people to learn, share, and connect beyond boundaries.
          </p>
        </section>

       
      </div>
    </div>
  );
};

export default About;

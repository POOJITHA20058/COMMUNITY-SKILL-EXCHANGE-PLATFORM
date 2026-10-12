import React from "react";
import Navbar from "../components/Navbar";
import FeaturesSection from "../components/FeatureSection";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const testimonials = [
  { name: "Alex", quote: "I learned web development in just 3 months!" },
  { name: "Sophia", quote: "Taught Spanish and learned guitar in return!" },
  { name: "Jake", quote: "SkillSwap helped me become a full-time designer!" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleJoinBuzz = () => {
    if (!user || !user._id) {
      toast.error("Please login first!");
      return;
    }
    navigate("/explore");
  };

  return (
    <div className="bg-gray-100">
      <Navbar />


      <section id="home" className="bg-white py-20 mt-16 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Learn, Teach & Exchange Skills with a Global Community
        </h1>
        <p className="text-xl mb-8">
          Swap your skills with others, join workshops, and grow together!
        </p>

        <button
          onClick={handleJoinBuzz}
          className="bg-red-500 text-white px-6 py-3 rounded-full text-lg hover:bg-red-600 transition"
        >
          Join the Buzz
        </button>
      </section>

      <FeaturesSection />


      <section id="testimonials" className="bg-white py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">What Our Users Say</h2>
          <div className="flex flex-wrap justify-center">
            {testimonials.map((t, index) => (
              <div key={index} className="w-full md:w-1/3 p-4">
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
                  <p className="italic mb-4">"{t.quote}"</p>
                  <h3 className="text-xl font-semibold">{t.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section id="contact" className="bg-red-500 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Exchange Skills?
        </h2>

        <button
          onClick={() => navigate("/signin")}
          className="bg-white text-red-500 px-6 py-3 rounded-full text-lg hover:bg-gray-200 transition"
        >
          Join Now
        </button>
      </section>
    </div>
  );
};

export default LandingPage;

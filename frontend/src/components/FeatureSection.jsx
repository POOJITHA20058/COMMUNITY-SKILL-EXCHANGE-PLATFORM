import {
  FaCode,
  FaPalette,
  FaUtensils,
  FaCamera,
  FaMusic,
  FaBullhorn,
  FaDumbbell,
  FaLanguage,
  FaPenNib,
  FaChartLine,
} from "react-icons/fa";

const skills = [
  { name: "Programming", icon: <FaCode className="text-4xl text-red-500" /> },
  {
    name: "Graphic Design",
    icon: <FaPalette className="text-4xl text-blue-500" />,
  },
  {
    name: "Cooking",
    icon: <FaUtensils className="text-4xl text-yellow-500" />,
  },
  {
    name: "Photography",
    icon: <FaCamera className="text-4xl text-purple-500" />,
  },
  { name: "Music", icon: <FaMusic className="text-4xl text-green-500" /> },
  {
    name: "Marketing",
    icon: <FaChartLine className="text-4xl text-indigo-500" />,
  },
  {
    name: "Fitness",
    icon: <FaDumbbell className="text-4xl text-orange-500" />,
  },
  {
    name: "Public Speaking",
    icon: <FaBullhorn className="text-4xl text-pink-500" />,
  },
  {
    name: "Languages",
    icon: <FaLanguage className="text-4xl text-teal-500" />,
  },
  { name: "Writing", icon: <FaPenNib className="text-4xl text-gray-700" /> },
];

const FeaturesSection = () => {
  return (
    <section id="skills" className="py-20">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12">
          Swap Skills in Various Categories
        </h2>
        <div className="flex flex-wrap justify-center">
          {skills.map((skill, index) => (
            <div key={index} className="w-1/2 md:w-1/4 lg:w-1/6 p-4">
              <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                {skill.icon}
                <h3 className="text-xl font-semibold mt-2">{skill.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiCode, FiCpu, FiTool } from 'react-icons/fi';
import '../styles/About.css';

const About = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const skills = {
    languages: ['Python', 'JavaScript', 'Java', 'C/C++', 'GDScript', 'TypeScript', 'SQL', 'HTML/CSS'],
    aiml: ['TensorFlow', 'PyTorch', 'Deep Learning', 'Computer Vision', 'NLP', 'scikit-learn', 'Keras', 'OpenCV'],
    tools: ['React.js', 'Node.js', 'FastAPI', 'Git/GitHub', 'Godot Engine', 'Docker', 'Streamlit', 'MongoDB']
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section id="about" className="about" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">About Me</h2>
        </motion.div>

        <div className="about-grid">
          <motion.div
            className="about-text"
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p>
              I'm a passionate developer at VIT, specializing in AI/ML with a unique blend of skills
              spanning from deep learning to game development. My journey is driven by the desire to
              create intelligent solutions that make a real impact.
            </p>
            <p>
              Recently crowned <span className="highlight">champion at IEEE CS VIT Hackbattle 2025</span>,
              competing against 600+ participants, I've proven my ability to deliver innovative solutions
              under pressure.
            </p>
            <p>
              Whether it's training neural networks, developing games in Godot, or building full-stack
              applications, I bring creativity and technical expertise to every project.
            </p>

            <motion.div
              className="stats"
              variants={containerVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              <motion.div className="stat-item" variants={itemVariants}>
                <h3>8.63</h3>
                <p>CGPA</p>
              </motion.div>
              <motion.div className="stat-item" variants={itemVariants}>
                <h3>600+</h3>
                <p>Hackathon Competitors Beat</p>
              </motion.div>
              <motion.div className="stat-item" variants={itemVariants}>
                <h3>5+</h3>
                <p>Major Projects</p>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="skills-section"
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="skill-category">
              <div className="category-header">
                <FiCode className="category-icon" />
                <h3>Languages</h3>
              </div>
              <div className="skill-tags">
                {skills.languages.map((skill, index) => (
                  <motion.span
                    key={skill}
                    className="skill-tag"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="skill-category">
              <div className="category-header">
                <FiCpu className="category-icon" />
                <h3>AI/ML</h3>
              </div>
              <div className="skill-tags">
                {skills.aiml.map((skill, index) => (
                  <motion.span
                    key={skill}
                    className="skill-tag"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="skill-category">
              <div className="category-header">
                <FiTool className="category-icon" />
                <h3>Tools & Frameworks</h3>
              </div>
              <div className="skill-tags">
                {skills.tools.map((skill, index) => (
                  <motion.span
                    key={skill}
                    className="skill-tag"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
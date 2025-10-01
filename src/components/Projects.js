import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiGithub, FiExternalLink, FiFilter } from 'react-icons/fi';
import '../styles/Projects.css';

const Projects = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const [filter, setFilter] = useState('all');

  const projects = [
    {
      id: 1,
      title: "LipReading AI",
      description: "Advanced deep learning model combining 3D CNNs and BiLSTM for lip reading, featuring sophisticated video preprocessing and CTC loss implementation.",
      image: "🧠",
      tags: ["AI/ML", "Deep Learning", "Computer Vision"],
      category: "ai",
      github: "https://github.com/ArnavSinha717",
      featured: true
    },
    {
      id: 2,
      title: "The Blinking Worlds",
      description: "A unique 2D puzzle-platformer where players navigate parallel worlds through blinking, featuring challenging spatial puzzles and innovative mechanics.",
      image: "🎮",
      tags: ["Game Dev", "Godot", "GDScript"],
      category: "game",
      github: "https://github.com/ArnavSinha717/TheBlinkingWorlds",
      featured: true
    },
    {
      id: 3,
      title: "ClauseWise",
      description: "AI-powered legal document assistant with multi-language support, voice capabilities, and intelligent risk assessment for contract analysis.",
      image: "⚖️",
      tags: ["Full Stack", "AI", "NLP"],
      category: "fullstack",
      github: "https://github.com/ArnavSinha717/ClauseWise",
      featured: true
    },
    {
      id: 4,
      title: "Cowwnect",
      description: "Mobile app using computer vision to identify cow breeds for Indian farmers, featuring offline functionality and high accuracy.",
      image: "🐄",
      tags: ["Computer Vision", "Mobile", "TensorFlow"],
      category: "ai",
      github: "https://github.com/5tea1th/cowwnect"
    },
    {
      id: 5,
      title: "Customer Churn Prediction",
      description: "Machine learning model for predicting customer churn using advanced classification algorithms and feature engineering techniques.",
      image: "📊",
      tags: ["ML", "Data Science", "Python"],
      category: "ai",
      github: "https://github.com/ArnavSinha717/churn/blob/main/Customer_Churn.ipynb"
    }
  ];

  const categories = [
    { value: 'all', label: 'All Projects' },
    { value: 'ai', label: 'AI/ML' },
    { value: 'game', label: 'Game Dev' },
    { value: 'fullstack', label: 'Full Stack' }
  ];

  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(p => p.category === filter);

  return (
    <section id="projects" className="projects" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Featured Projects</h2>
        </motion.div>

        <motion.div
          className="filter-container"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          <FiFilter className="filter-icon" />
          {categories.map((cat) => (
            <motion.button
              key={cat.value}
              className={`filter-btn ${filter === cat.value ? 'active' : ''}`}
              onClick={() => setFilter(cat.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.label}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          className="projects-grid"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                className={`project-card ${project.featured ? 'featured' : ''}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  layout: { duration: 0.3 }
                }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.2 }
                }}
              >
                {project.featured && (
                  <div className="featured-badge">Featured</div>
                )}

                <div className="project-header">
                  <div className="project-icon">{project.image}</div>
                  <h3>{project.title}</h3>
                </div>

                <p className="project-description">{project.description}</p>

                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>

                <div className="project-links">
                  <motion.a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiGithub /> Code
                  </motion.a>
                  {project.demo && (
                    <motion.a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiExternalLink /> Demo
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;
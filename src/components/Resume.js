import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiDownload, FiAward, FiBriefcase, FiBook, FiTool } from 'react-icons/fi';
import '../styles/Resume.css';

const Resume = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const projects = [
    {
      title: "LipReading Model",
      tech: "Python • TensorFlow • OpenCV • Deep Learning • Computer Vision",
      points: [
        "Developing end-to-end deep learning pipeline using 3D CNNs and BiLSTM networks for lip reading",
        "Implemented sophisticated video preprocessing with frame normalization and temporal alignment",
        "Built custom CTC loss function for sequence-to-sequence learning with variable length outputs",
        "Achieved robust performance on video-to-text translation tasks"
      ]
    },
    {
      title: "The Blinking Worlds",
      tech: "Godot • GDScript • Game Design • 2D Graphics",
      points: [
        "Developed a 2D puzzle-platformer game with unique blinking mechanics in Godot Engine",
        "Created parallel world navigation system with challenging spatial puzzles",
        "Implemented physics-based gameplay with timing and spatial reasoning elements",
        "Designed multiple levels with progressive difficulty and engaging mechanics"
      ]
    },
    {
      title: "ClauseWise - Legal Document AI Assistant",
      tech: "Python • FastAPI • Streamlit • RAG • Google Gemini • ChromaDB",
      points: [
        "Built full-stack AI-powered legal document analysis platform with multi-language support",
        "Implemented RAG pipeline with ChromaDB vector store and HuggingFace embeddings",
        "Integrated voice services for 13 Indian languages using ElevenLabs TTS/STT",
        "Developed real-time chat interface with source attribution and risk assessment features"
      ]
    },
    {
      title: "Cowwnect",
      tech: "Python • TensorFlow • Transfer Learning • Computer Vision • Mobile",
      points: [
        "Developed cow breed classification system using EfficientNetB3 with transfer learning",
        "Deployed via TensorFlow Lite for offline mobile use on Android devices",
        "Implemented staged fine-tuning and data augmentation for improved performance",
        "Created user-friendly mobile interface for Indian farmers"
      ]
    },
    {
      title: "Customer Churn Prediction",
      tech: "Python • scikit-learn • Pandas • Machine Learning",
      points: [
        "Built end-to-end ML pipeline for customer churn prediction",
        "Engineered features and trained multiple models including XGBoost and Random Forest",
        "Implemented comprehensive evaluation metrics and model comparison",
        "Deployed model with RESTful API for real-time predictions"
      ]
    }
  ];

  const handleDownload = () => {
    // This will download the PDF from the public folder
    const link = document.createElement('a');
    link.href = process.env.PUBLIC_URL + '/Resume.pdf';
    link.download = 'Arnav_Sinha_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="resume" className="resume" ref={ref}>
      <div className="container">
        <motion.div
          className="resume-header"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Resume</h2>
          <motion.button
            className="download-btn"
            onClick={handleDownload}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiDownload /> Download Resume PDF
          </motion.button>
        </motion.div>

        <motion.div
          className="resume-content"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="resume-section">
            <div className="section-header">
              <FiBook className="section-icon" />
              <h3>Education</h3>
            </div>
            <motion.div
              className="timeline-item"
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <h4>B.Tech Computer Science (AI/ML)</h4>
                <p className="institution">Vellore Institute of Technology, Vellore</p>
                <p className="date">2023 - 2027</p>
                <p className="detail">CGPA: 8.63/10.0</p>
                <p className="coursework">Relevant Coursework: Data Structures & Algorithms, Machine Learning, Deep Learning, Computer Networks, Database Management Systems, Operating Systems</p>
              </div>
            </motion.div>
          </div>

          <div className="resume-section">
            <div className="section-header">
              <FiAward className="section-icon" />
              <h3>Achievements</h3>
            </div>
            <motion.div
              className="achievement-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="achievement-badge">🥇</div>
              <div className="achievement-details">
                <h4>IEEE CS VIT Hackbattle 2025 - First Place</h4>
                <p>Won among 600+ participants with an innovative AI-powered solution</p>
              </div>
            </motion.div>
          </div>

          <div className="resume-section">
            <div className="section-header">
              <FiBriefcase className="section-icon" />
              <h3>Key Projects</h3>
            </div>
            <div className="projects-list">
              {projects.map((project, index) => (
                <motion.div
                  key={project.title}
                  className="project-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <h4>{project.title}</h4>
                  <p className="tech-stack">{project.tech}</p>
                  <ul>
                    {project.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="resume-section">
            <div className="section-header">
              <FiTool className="section-icon" />
              <h3>Technical Proficiencies</h3>
            </div>
            <div className="proficiency-grid">
              <motion.div
                className="proficiency-item"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.9 }}
              >
                <strong>Programming Languages:</strong> Python, Java, C/C++, JavaScript, TypeScript, HTML/CSS, SQL, GDScript
              </motion.div>
              <motion.div
                className="proficiency-item"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 1.0 }}
              >
                <strong>AI/ML & Data Science:</strong> TensorFlow, Keras, PyTorch, scikit-learn, OpenCV, NLTK, spaCy, NumPy, Pandas, Matplotlib, Seaborn
              </motion.div>
              <motion.div
                className="proficiency-item"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 1.1 }}
              >
                <strong>Web Development:</strong> React.js, Node.js, FastAPI, Flask, Streamlit, REST APIs, HTML5, CSS3, Responsive Design
              </motion.div>
              <motion.div
                className="proficiency-item"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 1.2 }}
              >
                <strong>Tools & Platforms:</strong> Git/GitHub, Docker, VS Code, Jupyter, Google Colab, Godot Engine, Linux, AWS (basics)
              </motion.div>
              <motion.div
                className="proficiency-item"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 1.3 }}
              >
                <strong>Databases:</strong> MySQL, PostgreSQL, MongoDB, ChromaDB (Vector DB), Firebase
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Resume;
import React from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiAward, FiBriefcase, FiBook, FiTool } from 'react-icons/fi';
import '../styles/ResumePage.css';

function ResumePage() {
  const projects = [
    {
      title: "LipReading Model",
      tech: "Python • TensorFlow • OpenCV • Deep Learning • Computer Vision",
      description: "An AI that watches videos of people speaking and figures out what they're saying just by looking at their lips.",
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
      description: "A puzzle video game where you switch between two parallel worlds by blinking to solve challenges.",
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
      description: "A chatbot that reads legal documents and answers questions about them in plain language, supporting 13 Indian languages.",
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
      description: "A mobile app that identifies cow breeds by taking a photo, designed to help Indian farmers.",
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
      description: "A system that predicts which customers are likely to stop using a service so businesses can retain them.",
      points: [
        "Built end-to-end ML pipeline for customer churn prediction",
        "Engineered features and trained multiple models including XGBoost and Random Forest",
        "Implemented comprehensive evaluation metrics and model comparison",
        "Deployed model with RESTful API for real-time predictions"
      ]
    }
  ];

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = process.env.PUBLIC_URL + '/Resume.pdf';
    link.download = 'Arnav_Sinha_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="resume-page">
      <div className="resume-page-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="resume-page-header">
            <h1>Resume</h1>
            <button onClick={handleDownload} className="download-btn-clean">
              <FiDownload /> Download PDF
            </button>
          </div>

          <div className="resume-page-content">
            {/* Education */}
            <section className="resume-section-clean">
              <div className="section-header-clean">
                <FiBook className="section-icon-clean" />
                <h2>Education</h2>
              </div>
              <div className="timeline-clean">
                <div className="timeline-item-clean">
                  <div className="timeline-marker-clean"></div>
                  <div className="timeline-content-clean">
                    <h3>B.Tech Computer Science (AI/ML)</h3>
                    <p className="institution-clean">Vellore Institute of Technology, Vellore</p>
                    <p className="date-clean">2023 - 2027</p>
                    <p className="detail-clean">CGPA: 8.54/10.0</p>
                    <p className="coursework-clean">Relevant Coursework: Data Structures & Algorithms, Machine Learning, Deep Learning, Computer Networks, Database Management Systems, Operating Systems</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Achievements */}
            <section className="resume-section-clean">
              <div className="section-header-clean">
                <FiAward className="section-icon-clean" />
                <h2>Achievements</h2>
              </div>
              <div className="achievement-clean">
                <span className="achievement-icon-clean">🥇</span>
                <div>
                  <h3>IEEE CS VIT Hackbattle 2025 - First Place</h3>
                  <p>Won among 600+ participants with an innovative AI-powered solution</p>
                </div>
              </div>
            </section>

            {/* Key Projects */}
            <section className="resume-section-clean">
              <div className="section-header-clean">
                <FiBriefcase className="section-icon-clean" />
                <h2>Key Projects</h2>
              </div>
              <div className="projects-list-clean">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.title}
                    className="project-item-clean"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                  >
                    <h3>{project.title}</h3>
                    <p className="tech-clean">{project.tech}</p>
                    <p className="description-clean">{project.description}</p>
                    <ul>
                      {project.points.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Technical Proficiencies */}
            <section className="resume-section-clean">
              <div className="section-header-clean">
                <FiTool className="section-icon-clean" />
                <h2>Technical Proficiencies</h2>
              </div>
              <div className="proficiency-grid-clean">
                <div className="proficiency-item-clean">
                  <strong>Programming Languages:</strong> Python, Java, C/C++, JavaScript, TypeScript, HTML/CSS, SQL, GDScript
                </div>
                <div className="proficiency-item-clean">
                  <strong>AI/ML & Data Science:</strong> TensorFlow, Keras, PyTorch, scikit-learn, OpenCV, NLTK, spaCy, NumPy, Pandas, Matplotlib, Seaborn
                </div>
                <div className="proficiency-item-clean">
                  <strong>Web Development:</strong> React.js, Node.js, FastAPI, Flask, Streamlit, REST APIs, HTML5, CSS3, Responsive Design
                </div>
                <div className="proficiency-item-clean">
                  <strong>Cloud & AWS:</strong> EC2, Lambda, S3, RDS, DynamoDB, API Gateway, CloudFront, VPC, Route 53, IAM, CloudWatch, SageMaker, Cognito, SNS, SQS, ECS, Elastic Beanstalk
                </div>
                <div className="proficiency-item-clean">
                  <strong>Tools & Platforms:</strong> Git/GitHub, Docker, VS Code, Jupyter, Google Colab, Godot Engine, Linux
                </div>
                <div className="proficiency-item-clean">
                  <strong>Databases:</strong> MySQL, PostgreSQL, MongoDB, ChromaDB (Vector DB), Firebase, DynamoDB, RDS
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default ResumePage;

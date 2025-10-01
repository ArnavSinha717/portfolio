import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiMail, FiGithub, FiLinkedin } from 'react-icons/fi';
import '../styles/Contact.css';

const Contact = () => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const socials = [
    {
      name: 'Email',
      icon: <FiMail size={24} />,
      link: 'mailto:arnav.sinha1602@gmail.com',
      label: 'arnav.sinha1602@gmail.com'
    },
    {
      name: 'GitHub',
      icon: <FiGithub size={24} />,
      link: 'https://github.com/ArnavSinha717',
      label: 'ArnavSinha717'
    },
    {
      name: 'LinkedIn',
      icon: <FiLinkedin size={24} />,
      link: 'https://www.linkedin.com/in/arnav-sinha-a353b9308',
      label: 'Arnav Sinha'
    }
  ];

  return (
    <section id="contact" className="contact" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="contact-content"
        >
          <h2 className="section-title">Let's Connect</h2>
          <p className="contact-subtitle">
            I'm always open to discussing new opportunities, collaborations, or just having a chat about technology!
          </p>

          <motion.div
            className="contact-cards"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            {socials.map((social, index) => (
              <motion.a
                key={social.name}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-card"
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="contact-icon">{social.icon}</div>
                <h4>{social.name}</h4>
                <p>{social.label}</p>
              </motion.a>
            ))}
          </motion.div>

        </motion.div>

        <footer className="footer">
          <p>&copy; 2025 Arnav Sinha. Built with React & Framer Motion.</p>
        </footer>
      </div>
    </section>
  );
};

export default Contact;
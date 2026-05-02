import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { 
  Float, 
  Environment,
  MeshDistortMaterial,
  shaderMaterial
} from '@react-three/drei';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import * as THREE from 'three';
import './App.css';

const WaveShaderMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color('#FF69B4'), uColor2: new THREE.Color('#FFB6C1') },
  `
    uniform float uTime;
    varying vec2 vUv;
    varying float vDisplacement;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      float noise = sin(pos.x * 3.0 + uTime) * sin(pos.y * 3.0 + uTime) * 0.3;
      pos += normal * noise;
      vDisplacement = noise;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uColor2;
    varying vec2 vUv;
    varying float vDisplacement;
    
    void main() {
      float mixValue = smoothstep(-0.3, 0.3, vDisplacement);
      vec3 color = mix(uColor, uColor2, mixValue + sin(uTime * 0.5) * 0.2);
      gl_FragColor = vec4(color, 0.9);
    }
  `
);

extend({ WaveShaderMaterial });

function FluidBlob({ position, color, speed = 1 }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15 * speed;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8} position={position}>
      <mesh 
        ref={meshRef}
        scale={hovered ? 1.2 : 1}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1.2, 32, 32]} />
        <MeshDistortMaterial 
          color={color}
          attach="material"
          distort={0.3}
          speed={1.5}
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
}

function GlassTorus({ position, rotation }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.003;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <torusGeometry args={[0.8, 0.25, 16, 32]} />
      <meshStandardMaterial 
        color="#FFB6C1"
        transparent
        opacity={0.4}
        roughness={0.2}
        metalness={0.3}
        wireframe={false}
      />
    </mesh>
  );
}

function FloatingParticles() {
  const count = 50;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, []);

  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#FF69B4" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function Scene() {
  return (
    <div className="scene-container">
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 50 }} 
        style={{ position: 'fixed', top: 0, left: 0 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        shadows
      >
        <color attach="background" args={['#050508']} />
        <fog attach="fog" args={['#050508', 5, 20]} />
        
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#FF69B4" castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#FFB6C1" />
        
        <FluidBlob position={[-3, 1, -2]} color="#FF69B4" speed={1.2} />
        <FluidBlob position={[3, -1, -3]} color="#FFB6C1" speed={0.8} />
        <FluidBlob position={[0, 2, -4]} color="#E6E6FA" speed={1} />
        
        <GlassTorus position={[-2, -2, -5]} rotation={[0.5, 0, 0]} />
        <GlassTorus position={[2, 2, -6]} rotation={[0, 0.5, 0.3]} />
        
        <BackgroundPlane />
        <FloatingParticles />
        
        <Environment preset="night" />
      </Canvas>
    </div>
  );
}

function BackgroundPlane() {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]} scale={[40, 20, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <waveShaderMaterial 
        transparent 
        uColor={new THREE.Color('#1a1a2e')} 
        uColor2={new THREE.Color('#0a0a0f')}
        opacity={0.5}
      />
    </mesh>
  );
}

function Navbar() {
  const [activeSection, setActiveSection] = useState('home');
  const { scrollYProgress } = useScroll();
  
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  const navbarBg = useTransform(
    smoothScroll,
    [0, 0.1],
    ['rgba(10, 10, 15, 0)', 'rgba(10, 10, 15, 0.9)']
  );

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'work', label: 'Work' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Skills' },
    { id: 'contact', label: 'Contact' },
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  return (
    <motion.nav 
      className="navbar"
      style={{ background: navbarBg }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="nav-logo">
        <span className="logo-f">F</span>
        <span className="logo-dot">.</span>
      </div>
      <ul className="nav-links">
        {navItems.map((item, i) => (
          <motion.li 
            key={item.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <button 
              className={activeSection === item.id ? 'active' : ''}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  );
}

function Hero() {
  const { scrollYProgress } = useScroll();
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 1
  });

  const y = useTransform(smoothProgress, [0, 0.5], [0, 200]);
  const opacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(smoothProgress, [0, 0.3], [1, 0.9]);

  return (
    <motion.section 
      id="home" 
      className="section hero-section"
      style={{ y, opacity, scale }}
    >
      <div className="hero-content">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="hero-badge"
        >
          Machine Learning & Automation
        </motion.div>
        
        <motion.h1 
          className="hero-title"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <span className="title-line">
            <span className="title-word">Falak</span>
          </span>
          <span className="title-line">
            <span className="title-word outline">Naeem</span>
          </span>
        </motion.h1>
        
        <motion.p 
          className="hero-description"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Computer Science Student | Building automation solutions & ML applications
        </motion.p>
        
        <motion.div 
          className="hero-cta"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <button className="cta-primary" onClick={() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' })}>
            <span>View Work</span>
            <div className="cta-glow"></div>
          </button>
          <button className="cta-secondary" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
            Let's Talk
          </button>
        </motion.div>
      </div>
      
      <motion.div 
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span>Scroll</span>
        <div className="scroll-line"></div>
      </motion.div>
    </motion.section>
  );
}

function About() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0.1, 0.3], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.2], [0, 1]);

  return (
    <section id="about" className="section about-section">
      <motion.div 
        className="about-container"
        style={{ y, opacity }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="section-header">
          <span className="section-label">01</span>
          <h2 className="section-title">About Me</h2>
        </div>
        
        <div className="about-content">
          <div className="about-text">
            <p>
              I am a Computer Science student at Beaconhouse National University (BNU), 
              expected to graduate in 2027. I am passionate about machine learning, 
              workflow automation, and building practical solutions through code.
            </p>
            <p>
              Currently working as a Machine Learning Intern at Arch Technologies 
              and previously completed an Automation Internship at Avanceon, 
              where I built no-code automation pipelines using N8N.
            </p>
          </div>
          
          <div className="about-cards">
            <motion.div 
              className="about-card"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <span className="card-icon">ML</span>
              <h3>Machine Learning</h3>
              <p>TensorFlow, Keras, Computer Vision</p>
            </motion.div>
            
            <motion.div 
              className="about-card"
              whileHover={{ scale: 1.05, rotate: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <span className="card-icon">AUT</span>
              <h3>Automation</h3>
              <p>N8N, APIs, Workflow Design</p>
            </motion.div>
            
            <motion.div 
              className="about-card"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <span className="card-icon">DEV</span>
              <h3>Development</h3>
              <p>Python, C++, JavaScript, Flutter</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

const projects = [
  { 
    id: 1, 
    title: 'Mentor X', 
    category: 'Product Management',
    description: 'Platform connecting startups with mentors using cash-barter-credits and equity model',
    year: '2025',
    link: 'https://mentor-x.lovable.app'
  },
  { 
    id: 2, 
    title: 'Pneumonia Detection', 
    category: 'Computer Vision',
    description: 'Deep learning model using CNN to detect pneumonia from chest X-ray images',
    year: '2024'
  },
  { 
    id: 3, 
    title: 'Attention Is All You Need', 
    category: 'Machine Learning',
    description: 'Implemented Vision Transformer (ViT) for image classification using Hugging Face',
    year: '2024'
  },
  { 
    id: 4, 
    title: 'Clothing App', 
    category: 'Flutter',
    description: 'Cross-platform mobile app with product listing, filtering, and cart management',
    year: '2024'
  },
  {
    id: 5,
    title: 'Ride Booking System',
    category: 'C++ Project',
    description: 'DSA-based system using Stack, Queue, Linked List for ride flow and history',
    year: '2023'
  },
  {
    id: 6,
    title: 'Spaceship 2D Game',
    category: 'Game Development',
    description: 'Game with MongoDB storage, PHP backend via Phaser framework',
    year: '2023'
  },
];

function Work() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0.3, 0.5], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0.3, 0.4], [0, 1]);

  return (
    <section id="work" className="section work-section">
      <motion.div 
        className="work-container"
        style={{ y, opacity }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="section-header">
          <span className="section-label">02</span>
          <h2 className="section-title">Selected Work</h2>
        </div>
        
        <div className="projects-list">
          {projects.map((project, index) => (
            <motion.div 
              key={project.id}
              className="project-item"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ x: 20 }}
            >
              <div className="project-number">0{index + 1}</div>
              <div className="project-info">
                <span className="project-year">{project.year}</span>
                {project.link ? (
                  <a href={project.link} target="_blank" className="project-title">{project.title}</a>
                ) : (
                  <h3 className="project-title">{project.title}</h3>
                )}
                <span className="project-category">{project.category}</span>
                <p className="project-description">{project.description}</p>
              </div>
              <div className="project-arrow">{project.link ? '↗' : '→'}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

const experiences = [
  {
    company: 'Arch Technologies',
    role: 'Machine Learning Intern',
    period: 'Present',
    description: 'Hands-on training in ML concepts, supervised/unsupervised learning, data preprocessing, and model evaluation'
  },
  {
    company: 'Avanceon',
    role: 'Automation Intern',
    period: 'August 2025',
    description: 'Built automated pipelines using N8N, integrating APIs, databases, and third-party services for workflow automation'
  },
  {
    company: 'Beaconhouse National University',
    role: 'Computer Science Student',
    period: 'Sept 2023 - Sept 2027',
    description: 'Bachelor of Computer Science - Current GPA and relevant coursework in DSA, ML, and software engineering'
  },
];

function Experience() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0.5, 0.7], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0.5, 0.6], [0, 1]);

  return (
    <section id="experience" className="section experience-section">
      <motion.div 
        className="experience-container"
        style={{ y, opacity }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="section-header">
          <span className="section-label">03</span>
          <h2 className="section-title">Experience</h2>
        </div>
        
        <div className="timeline">
          {experiences.map((exp, index) => (
            <motion.div 
              key={index}
              className="timeline-item"
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
            >
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <span className="timeline-period">{exp.period}</span>
                <h3 className="timeline-role">{exp.role}</h3>
                <span className="timeline-company">{exp.company}</span>
                <p className="timeline-description">{exp.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

const skillCategories = [
  {
    name: 'Languages & Frameworks',
    skills: ['C++', 'Python', 'JavaScript', 'HTML', 'CSS', 'PHP', 'Flutter', 'Dart']
  },
  {
    name: 'Libraries & Tools',
    skills: ['MongoDB', 'Phaser', 'p5.js', 'Bootstrap', 'Hugging Face', 'TensorFlow', 'Keras', 'N8N']
  },
  {
    name: 'Domains',
    skills: ['Machine Learning', 'Computer Vision', 'Product Management', 'Workflow Automation', 'DSA']
  },
];

function Skills() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0.55, 0.75], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0.55, 0.65], [0, 1]);

  return (
    <section id="skills" className="section skills-section">
      <motion.div 
        className="skills-container"
        style={{ y, opacity }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="section-header">
          <span className="section-label">04</span>
          <h2 className="section-title">Skills</h2>
        </div>
        
        <div className="skills-grid">
          {skillCategories.map((category, index) => (
            <motion.div 
              key={index}
              className="skills-category"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="category-name">{category.name}</h3>
              <div className="skills-list">
                {category.skills.map((skill, skillIndex) => (
                  <motion.span 
                    key={skillIndex}
                    className="skill-tag"
                    whileHover={{ scale: 1.1 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section contact-section">
      <motion.div 
        className="contact-container"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="section-header">
          <span className="section-label">05</span>
          <h2 className="section-title">Let's Connect</h2>
        </div>
        
        <p className="contact-intro">Have a project in mind? Let's bring your vision to life.</p>
        
        <motion.a 
          href="mailto:imfalaknaeem@gmail.com"
          className="contact-email"
          whileHover={{ scale: 1.05 }}
        >
          imfalaknaeem@gmail.com
        </motion.a>
        
        <div className="social-links">
          <motion.a href="https://github.com/FalakNaeem11" target="_blank" whileHover={{ y: -5 }}>GitHub</motion.a>
          <motion.a href="https://linkedin.com/in/falak-naeem" target="_blank" whileHover={{ y: -5 }}>LinkedIn</motion.a>
          <motion.a href="mailto:imfalaknaeem@gmail.com" whileHover={{ y: -5 }}>Email</motion.a>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>© 2025 Falak Naeem. All rights reserved.</p>
    </footer>
  );
}

function App() {
  return (
    <div className="app">
      <Scene />
      <Navbar />
      <main className="main-content">
        <Hero />
        <About />
        <Work />
        <Experience />
        <Skills />
        <Contact />
        <Footer />
      </main>
    </div>
  );
}

export default App;
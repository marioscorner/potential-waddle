// Default content seeded from existing translations
const defaultContent = {
  hero: {
    es: {
      greeting: "Hola, soy",
      name: 'Mario "marioscorner" Gutiérrez',
      intro: "Convirtiendo las ideas de hoy en las soluciones de mañana.",
      cta: "Aquí encontrarás mis redes y un enlace para descargar mi CV.",
      downloadCV: "Descargar CV",
    },
    en: {
      greeting: "Hi, I'm",
      name: 'Mario "marioscorner" Gutiérrez',
      intro: "Turning today's ideas into the solutions of tomorrow.",
      cta: "Here you'll find my social networks and my CV.",
      downloadCV: "Download CV",
    },
  },

  about: {
    es: {
      title: "Sobre mí",
      paragraph1:
        "Vengo del mundo audiovisual, pero la programación fue ganando terreno hasta convertirse en mi camino profesional.",
      paragraphFullStack:
        "Como desarrollador full stack, trabajo tanto en la totalidad del proceso de desarrollo de software, creando aplicaciones web completas. Esto me permite tener una visión integral de los proyectos y entender cómo cada pieza se conecta para crear soluciones eficientes y escalables. No me especializo en un solo lenguaje o framework, sino que me gusta trabajar con las mejores herramientas para cada proyecto.",
      paragraph2:
        "Más allá del código, me encanta leer, la música, viajar y todo lo que tenga un punto friki.",
    },
    en: {
      title: "About me",
      paragraph1:
        "I come from the audiovisual world, but programming gradually gained ground until it became my professional path.",
      paragraphFullStack:
        "As a full stack developer, I work across the entire software development process, creating complete web applications. This allows me to have a comprehensive view of projects and understand how each piece connects to create efficient and scalable solutions. I don't specialize in a single language or framework, but rather I like to work with the best tools for each project.",
      paragraph2:
        "Beyond code, I love reading, music, traveling and everything that has a geeky touch.",
    },
  },

  status: {
    es: {
      status: "Estado",
      available: "Trabajando",
      statusDetail:
        "Actualmente formo parte del equipo de Eco Combustión.",
    },
    en: {
      status: "Status",
      available: "Working",
      statusDetail:
        "I'm currently part of the Eco Combustión team.",
    },
    indicatorColor: "#22c55e",
  },

  contact: {
    es: {
      title: "¡Vamos a trabajar juntos!",
      email: "hello@marioscorner.com",
      location: "Madrid",
      sendEmail: "Enviar email",
    },
    en: {
      title: "Let's work together!",
      email: "hello@marioscorner.com",
      location: "Madrid",
      sendEmail: "Send email",
    },
  },

  featured: {
    url: "https://github.com/marioscorner",
    es: {
      title: "Proyecto destacado",
      projectTitle: "Taekwondo Mario Gutiérrez",
      description:
        "Este proyecto nace como mi TFM y como respuesta a una necesidad real: mejorar la comunicación entre alumnos y profesores mediante un chat y centralizar toda la gestión del gimnasio de Taekwondo.",
      description2:
        "He implementado un chat en tiempo real entre los alumnos y el profesor, así como un perfil en el que cada alumno puede consultar sus datos y seguir su progreso.",
      cta: "Te invito a descubrirlo.",
      visitWeb: "Visitar web",
      comingSoon: "Próximamente",
    },
    en: {
      title: "Featured project",
      projectTitle: "Taekwondo Mario Gutiérrez",
      description:
        "This project began as my Master's Thesis and addresses a real need: improving communication between students and instructors through chat while centralizing the management of a Taekwondo gym.",
      description2:
        "I implemented real-time chat between students and their instructor, plus a profile where each student can view their details and track their progress.",
      cta: "I invite you to discover it.",
      visitWeb: "Visit website",
      comingSoon: "Coming soon",
    },
  },

  technologies: {
    items: [
      "JavaScript",
      "TypeScript",
      "Node.js",
      "Express",
      "React",
      "Angular",
      "Python",
      "Django",
      "FastAPI",
      "PostgreSQL",
      "MySQL",
      "Docker",
      "Linux",
      "Git",
    ],
  },

  sectionTitles: {
    es: {
      hero: "Presentación",
      technologies: "Tecnologías",
      experience: "Experiencia",
      certifications: "Certificaciones",
      languages: "Idiomas",
    },
    en: {
      hero: "Welcome",
      technologies: "Technologies",
      experience: "Experience",
      certifications: "Certifications",
      languages: "Languages",
    },
  },

  experience: [
    {
      company: "Eco Combustión",
      startDate: "2026-07",
      endDate: "",
      isCurrent: true,
      position: {
        es: "Programador full stack",
        en: "Full stack developer",
      },
      responsibilities: {
        es: ["Desarrollo de un sistema de navegación por voz"],
        en: ["Development of a voice navigation system"],
      },
    },
    {
      company: "Quai Technologies",
      startDate: "2025-11",
      endDate: "2025-12",
      isCurrent: false,
      position: {
        es: "Prácticas de desarrollo full stack",
        en: "Full stack development internship",
      },
      responsibilities: {
        es: [
          "Desarrollo de la aplicación APPUNTO",
          "Implementación de WAHA para poder utilizar Whatsapp en tiempo real desde la aplicación.",
          "Trabajo con BB.DD., tanto diseño como mantenimiento.",
          "Colaboración con el CTO para el diseño de producto, buscando las mejores líneas de desarrollo y evitar problemas futuros.",
        ],
        en: [
          "Development of the app APPUNTO",
          "Implementing real time Whatsapp messaging in the app using WAHA.",
          "Work with Databases, both designing and maintaining them.",
          "Help the CTO in product design, looking to solve problems before we encountered them.",
        ],
      },
    },
  ],

  certifications: [
    {
      name: {
        es: "Certificate in Advanced English (CAE)",
        en: "Certificate in Advanced English (CAE)",
      },
      issuer: {
        es: "Cambridge Assessment English",
        en: "Cambridge Assessment English",
      },
    },
    {
      name: {
        es: "Curso Universitario de Programación con Python",
        en: "University Course in Python Programming",
      },
      issuer: {
        es: "Universidad Europea de Madrid",
        en: "European University of Madrid",
      },
    },
  ],

  languages: [
    {
      name: { es: "Español", en: "Spanish" },
      level: { es: "Nativo", en: "Native" },
    },
    {
      name: { es: "Inglés", en: "English" },
      level: { es: "C1", en: "C1" },
    },
    {
      name: { es: "Alemán", en: "German" },
      level: { es: "A1", en: "A1" },
    },
  ],

  projects: {
    url: "https://github.com/marioscorner",
    es: {
      title: "Proyectos",
      description:
        "En mi GitHub encontrarás proyectos personales y ejemplos de mi trabajo con diferentes tecnologías y frameworks. Siempre estoy con algún proyecto entre manos, así que no dudes en echarle un vistazo de vez en cuando.",
      visitGitHub: "Ver en GitHub",
    },
    en: {
      title: "Projects",
      description:
        "On my GitHub you'll find personal projects and examples of my work with different technologies and frameworks. I'm always working on some project, so feel free to check it out from time to time.",
      visitGitHub: "View on GitHub",
    },
  },

  social: [
    {
      name: "LinkedIn",
      url: "https://linkedin.com/in/marioscorner",
      icon: "FaLinkedin",
    },
  ],

  meta: {
    es: {
      title: "Mario Gutiérrez | Desarrollador Full Stack en Madrid",
      description: "Portfolio de Mario Gutiérrez, desarrollador full stack en Madrid. Proyectos con TypeScript, React, Node.js, Python y PostgreSQL.",
    },
    en: {
      title: "Mario Gutiérrez | Full Stack Developer in Madrid",
      description: "Portfolio of Mario Gutiérrez, a full stack developer in Madrid. Projects built with TypeScript, React, Node.js, Python and PostgreSQL.",
    },
  },

  footer: {
    es: {
      madeWith: "Hecho con",
      by: "por",
      name: "marioscorner",
    },
    en: {
      madeWith: "Made with",
      by: "by",
      name: "marioscorner",
    },
  },
};

export default defaultContent;

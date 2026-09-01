export type Language = "es" | "en";

export const translations = {
  es: {
    // Hero Section
    hero: {
      welcome: "Presentación",
      greeting: "Hola, soy",
      name: 'Mario "marioscorner" Gutiérrez',
      intro: "Convirtiendo las ideas de hoy en las soluciones de mañana.",
      cta: "Aquí encontrarás mis redes y un enlace para descargar mi CV.",
      downloadCV: "Descargar CV",
    },
    // About Card
    about: {
      label: "Sobre mí",
      title: "Sobre mí",
      paragraph1:
        "Vengo del mundo audiovisual, pero la programación fue ganando terreno hasta convertirse en mi camino profesional.",
      paragraphFullStack:
        "Como desarrollador full stack, trabajo tanto en la totalidad del proceso de desarrollo de software, creando aplicaciones web completas. Esto me permite tener una visión integral de los proyectos y entender cómo cada pieza se conecta para crear soluciones eficientes y escalables. No me especializo en un solo lenguaje o framework, sino que me gusta trabajar con las mejores herramientas para cada proyecto.",
      paragraph2:
        "Más allá del código, me encanta leer, la música, viajar y todo lo que tenga un punto friki.",
    },
    // Technologies Card
    technologies: {
      label: "Tecnologías",
      title: "Tecnologías",
      description: "Trabajo habitualmente con:",
    },
    // Contact Card
    contact: {
      label: "Contact",
      title: "¡Vamos a trabajar juntos!",
      contactDetails: "Contact Details",
      sendEmail: "Enviar email",
    },
    // Tech Stack Card (Status/Experience)
    techStack: {
      status: "Status",
      available: "Trabajando",
      statusDetail:
        "Actualmente formo parte del equipo de Eco Combustión.",
      experience: "Experiencia",
    },
    // Featured Project
    featured: {
      label: "Proyecto destacado",
      comingSoon: "Próximamente",
      visitWeb: "Visitar web",
      description:
        "Este proyecto nace como mi TFM y como respuesta a una necesidad real: mejorar la comunicación entre alumnos y profesores mediante un chat y centralizar toda la gestión del gimnasio de Taekwondo.",
      description2:
        "He implementado un chat en tiempo real entre los alumnos y el profesor, así como un perfil en el que cada alumno puede consultar sus datos y seguir su progreso.",
      cta: "Te invito a descubrirlo.",
    },

    // Footer
    footer: {
      madeWith: "Hecho con",
      by: "por",
      name: "marioscorner",
    },
    // Meta
    meta: {
      title: "Mario Gutiérrez | Desarrollador Full Stack en Madrid",
      description:
        "Portfolio de Mario Gutiérrez, desarrollador full stack en Madrid. Proyectos con TypeScript, React, Node.js, Python y PostgreSQL.",
    },
    // CV
    cv: {
      url: "/cv-es.pdf",
    },
    // Certifications
    certifications: {
      title: "Certificaciones",
      empty: "Próximamente",
    },
    // Languages
    languages: {
      title: "Idiomas",
      empty: "Próximamente",
    },
    // Projects
    projects: {
      title: "Proyectos",
      description:
        "En mi GitHub encontrarás proyectos personales y ejemplos de mi trabajo con diferentes tecnologías y frameworks. Siempre estoy con algún proyecto entre manos, así que no dudes en echarle un vistazo de vez en cuando.",
      visitGitHub: "Ver en GitHub",
    },
  },
  en: {
    // Hero Section
    hero: {
      welcome: "Welcome",
      greeting: "Hi, I'm",
      name: 'Mario "marioscorner" Gutiérrez',
      intro: "Turning today's ideas into the solutions of tomorrow.",
      cta: "Here you'll find my social networks and my CV.",
      downloadCV: "Download CV",
    },
    // About Card
    about: {
      label: "About",
      title: "About me",
      paragraph1:
        "I come from the audiovisual world, but programming gradually gained ground until it became my professional path.",
      paragraphFullStack:
        "As a full stack developer, I work across the entire software development process, creating complete web applications. This allows me to have a comprehensive view of projects and understand how each piece connects to create efficient and scalable solutions. I don't specialize in a single language or framework, but rather I like to work with the best tools for each project.",
      paragraph2:
        "Beyond code, I love reading, music, traveling and everything that has a geeky touch.",
    },
    // Technologies Card
    technologies: {
      label: "Tech Stack",
      title: "Technologies",
      description: "I usually work with:",
    },
    // Contact Card
    contact: {
      label: "Contact",
      title: "Let's work together!",
      contactDetails: "Contact Details",
      sendEmail: "Send email",
    },
    // Tech Stack Card (Status/Experience)
    techStack: {
      status: "Status",
      available: "Working",
      statusDetail:
        "I'm currently part of the Eco Combustión team.",
      experience: "Experience",
    },
    // Featured Project
    featured: {
      label: "Featured project",
      comingSoon: "Coming soon",
      visitWeb: "Visit website",
      description:
        "This project began as my Master's Thesis and addresses a real need: improving communication between students and instructors through chat while centralizing the management of a Taekwondo gym.",
      description2:
        "I implemented real-time chat between students and their instructor, plus a profile where each student can view their details and track their progress.",
      cta: "I invite you to discover it.",
    },
    // Footer
    footer: {
      madeWith: "Made with",
      by: "by",
      name: "marioscorner",
    },
    // Meta
    meta: {
      title: "Mario Gutiérrez | Full Stack Developer in Madrid",
      description: "Portfolio of Mario Gutiérrez, a full stack developer in Madrid. Projects built with TypeScript, React, Node.js, Python and PostgreSQL.",
    },
    // CV
    cv: {
      url: "/cv-en.pdf",
    },
    // Certifications
    certifications: {
      title: "Certifications",
      empty: "Coming soon",
    },
    // Languages
    languages: {
      title: "Languages",
      empty: "Coming soon",
    },
    // Projects
    projects: {
      title: "Projects",
      description:
        "On my GitHub you'll find personal projects and examples of my work with different technologies and frameworks. I'm always working on some project, so feel free to check it out from time to time.",
      visitGitHub: "View on GitHub",
    },
  },
} as const;

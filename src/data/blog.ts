export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readTime: string;
  category: string;
  imageIcon: string;
  imageUrl?: string;
  content: {
    type: 'h2' | 'p' | 'ul' | 'link';
    text?: string;
    items?: string[];
    url?: string;
  }[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ley-21180-cero-papel',
    title: 'Ley 21.180: La Transformación Digital del Estado y el Desafío "Cero Papel"',
    date: '28 May 2026',
    excerpt: 'Análisis profundo de la Ley de Transformación Digital en Chile, sus plazos irrevocables y cómo SkardKey impulsa el cumplimiento del estándar "Cero Papel".',
    readTime: '6 min',
    category: 'Legal & Cumplimiento',
    imageIcon: 'FileText',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200',
    content: [
      { type: 'p', text: 'La promulgación de la Ley N° 21.180 de Transformación Digital del Estado, en vigor pleno desde junio de 2022, no es simplemente una actualización administrativa, sino un cambio de paradigma legal. Esta normativa chilena establece la obligatoriedad de la tramitación electrónica en los procedimientos administrativos, con el objetivo de convertir al Estado y a todas sus organizaciones vinculadas en entes eficientes, transparentes y, fundamentalmente, reducir el uso de papel a su mínima expresión.' },
      { type: 'h2', text: 'Los Plazos y el Estado Actual en Chile' },
      { type: 'p', text: 'La implementación total de la ley, que abarca a todos los órganos de la Administración del Estado (incluyendo ministerios, servicios públicos y municipalidades), tiene como fecha límite impostergable el 31 de diciembre de 2027. Según informes recientes (2026) sobre el Índice de Madurez Digital, existen brechas significativas de implementación. Mientras que el gobierno central muestra avances del 80%, sectores como las corporaciones municipales presentan un rezago crítico debido a la falta de presupuesto y escaso talento especializado.' },
      { type: 'h2', text: 'Ejes Obligatorios: El Fin del Formato Físico' },
      { type: 'p', text: 'El concepto de "cero papel" se materializa a través de cuatro pilares legales:' },
      { type: 'ul', items: [
        'Expedientes Electrónicos: Todo procedimiento debe constar en un expediente digital. Las carpetas físicas pierden validez operativa.',
        'Digitalización desde Origen: Cualquier documento que ingrese en papel debe ser digitalizado y validado en el acto.',
        'Interoperabilidad: Los sistemas deben interactuar entre sí mediante estándares abiertos (API), terminando con el aislamiento de datos.',
        'Notificaciones Electrónicas: Toda comunicación hacia ciudadanos u organizaciones (como juntas de vecinos) debe realizarse vía canales digitales oficiales.'
      ]},
      { type: 'h2', text: 'El Aporte de SkardKey a la Brecha Tecnológica' },
      { type: 'p', text: 'Ante el desafío inminente del plazo legal de 2027, SkardKey se posiciona como una herramienta estratégica inmediata. Al digitalizar la identidad corporativa y social, SkardKey elimina por completo la necesidad de emitir plásticos y certificados en papel.' },
      { type: 'p', text: 'Adoptar SkardKey no es solo modernizar la estética de una organización; es resolver el problema de interoperabilidad exigido por la ley. Nuestras credenciales digitales y firmas electrónicas aseguran procesos trazables, reduciendo la huella de carbono y garantizando que incluso la corporación municipal más pequeña o junta de vecinos pueda cumplir con el estándar estatal sin requerir desarrollos millonarios.' },
      { type: 'link', text: 'Leer texto oficial de la Ley 21.180 (BCN)', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1138402' },
      { type: 'link', text: 'Guía de Transformación Digital (Gob.cl)', url: 'https://digital.gob.cl/' }
    ]
  },
  {
    slug: 'tecnologia-blockchain-e-identidad-digital',
    title: 'Tecnología Blockchain: El Eslabón Clave en la Identidad Digital',
    date: '25 May 2026',
    excerpt: 'Descubre cómo Blockchain aporta la Verdad Matemática a la seguridad de los datos corporativos y por qué es el futuro de la gestión de identidades y credenciales.',
    readTime: '7 min',
    category: 'Tecnología',
    imageIcon: 'ShieldCheck',
    imageUrl: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=1200',
    content: [
      { type: 'p', text: 'Durante los últimos años, la tecnología Blockchain ha trascendido su origen en las criptomonedas (como Bitcoin y Ethereum) para convertirse en la infraestructura de seguridad más robusta del mundo empresarial e institucional. Pero, ¿qué es exactamente y cómo está revolucionando la identidad digital global?' },
      { type: 'h2', text: 'De la Confianza Centralizada a la Verdad Matemática' },
      { type: 'p', text: 'Blockchain, o cadena de bloques, es un registro distribuido e inmutable. A diferencia de las bases de datos tradicionales, donde la información (como quién es socio de una entidad o qué permisos tiene) puede ser alterada subrepticiamente por un administrador de sistemas, en Blockchain cada transacción queda criptográficamente sellada mediante funciones "hash". Si alguien intenta modificar un permiso o emitir un certificado falso en el pasado, la red entera lo detecta y lo rechaza al instante.' },
      { type: 'h2', text: 'Casos Reales y Contribución a la Identidad' },
      { type: 'p', text: 'El robo de identidad cuesta a la economía mundial miles de millones de dólares anuales. La Unión Europea, a través del marco eIDAS, ya está implementando carteras de identidad digital basadas en tecnología de contabilidad distribuida (DLT/Blockchain). Esto permite la creación de Identificadores Descentralizados (DIDs) y Credenciales Verificables (VCs).' },
      { type: 'p', text: 'Esto significa que un ciudadano o trabajador puede poseer una credencial en su dispositivo que nadie puede falsificar. Al leerla (por ejemplo, con un código QR temporal), la verificación no depende de llamar por teléfono a un emisor, sino que se comprueba su firma criptográfica en milisegundos.' },
      { type: 'h2', text: 'La Arquitectura y Visión de SkardKey' },
      { type: 'p', text: 'En SkardKey, entendemos que la confianza es el pilar de cualquier organización seria. Por eso, nuestra plataforma y Audit Log están diseñados bajo los principios técnicos inspirados en Blockchain:' },
      { type: 'ul', items: [
        'Trazabilidad Inmutable: Nuestro Registro de Actividad graba cada emisión, revocación y modificación de credenciales, creando un historial de auditoría a prueba de alteraciones.',
        'Verificación Criptográfica Dinámica: Las tarjetas generadas en SkardKey utilizan tokens de validación rotativos (tecnología anti-pantallazos) y firmas seguras que emulan la inmutabilidad de la cadena de bloques.',
        'Privacidad por Diseño: La descentralización de los beneficios permite que la información sensible solo sea accesible por las partes involucradas, cumpliendo estrictamente con la normativa de datos.'
      ]},
      { type: 'link', text: '¿Qué son los Identificadores Descentralizados (W3C)?', url: 'https://www.w3.org/TR/did-core/' },
      { type: 'link', text: 'Identidad Digital y Blockchain en Europa (EU)', url: 'https://digital-strategy.ec.europa.eu/es/policies/eidas-regulation' }
    ]
  },
  {
    slug: 'transformacion-digital-en-la-actualidad',
    title: 'La Transformación Digital en la Actualidad: Agilidad Organizacional',
    date: '20 May 2026',
    excerpt: 'Análisis sobre cómo la modernización tecnológica dejó de ser un lujo de Sillicon Valley para convertirse en el único estándar de supervivencia para corporaciones y gremios.',
    readTime: '5 min',
    category: 'Innovación',
    imageIcon: 'Rocket',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
    content: [
      { type: 'p', text: 'Históricamente, la transformación digital se entendía como la simple digitalización de documentos. Hoy, esa visión es obsoleta. La transformación digital moderna no se trata de tecnología, sino de un rediseño cultural y estratégico de cómo las organizaciones interactúan con sus usuarios, socios y ciudadanos.' },
      { type: 'h2', text: 'El Nuevo Estándar Post-Pandemia' },
      { type: 'p', text: 'La crisis sanitaria global de 2020 aceleró la adopción tecnológica en al menos una década. Actualmente, la exigencia principal es la "Fricción Cero". Los procesos de acreditación manuales, las filas interminables para obtener certificados de residencia y los carnets que demoran semanas en ser entregados por un sindicato o municipio ya no son tolerados por una sociedad hiperconectada.' },
      { type: 'p', text: 'Según datos internacionales, el 70% de las iniciativas de transformación digital fracasan. La causa principal no es la falta de presupuesto, sino la "Resistencia al Cambio" interna y la adopción de sistemas monolíticos imposibles de usar por usuarios no técnicos.' },
      { type: 'h2', text: 'SkardKey: Demokratizando el Acceso a la Eficiencia' },
      { type: 'p', text: 'SkardKey actúa como el catalizador perfecto para organizaciones de todos los tamaños, porque elimina la principal barrera de la transformación digital: la complejidad de implementación.' },
      { type: 'ul', items: [
        'Adopción Inmediata (Plug & Play): Proveemos herramientas de nivel empresarial (enterprise) adaptadas para ser usadas desde el día 1 por juntas vecinales, comités y sindicatos, sin requerir ingenieros internos.',
        'Eliminación de la Fricción: Los usuarios acceden a sus credenciales en su Apple Wallet o Google Wallet, donde ya guardan sus tarjetas de crédito y pases de abordar.',
        'Gobierno de Datos: Entregamos dashboards financieros y de asistencia que transforman la intuición en "Decisiones Basadas en Datos" precisas y en tiempo real.'
      ]},
      { type: 'p', text: 'Al implementar SkardKey, líderes comunitarios y ejecutivos empresariales envían un mensaje claro: su entidad no solo sobrevive a la era digital, sino que la lidera para mejorar la calidad de vida de sus miembros.' },
      { type: 'link', text: 'Estudio: Por qué fracasa la transformación digital (HBR)', url: 'https://hbr.org/2019/03/digital-transformation-is-not-about-technology' },
      { type: 'link', text: 'Estado actual de la modernización corporativa', url: 'https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/the-new-digital-edge-rethinking-strategy-for-the-postpandemic-era' }
    ]
  }
];

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readTime: string;
  category: string;
  imageIcon: string; // A lucide icon name we will map in the UI
  content: {
    type: 'h2' | 'p' | 'ul';
    text?: string;
    items?: string[];
  }[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ley-21180-cero-papel',
    title: 'Ley 21.180: La Transformación Digital del Estado y el Desafío "Cero Papel"',
    date: '28 May 2026',
    excerpt: 'Análisis de la Ley de Transformación Digital y cómo SkardKey impulsa el cumplimiento del estándar "Cero Papel" mediante credenciales inteligentes.',
    readTime: '4 min',
    category: 'Legal & Cumplimiento',
    imageIcon: 'FileText',
    content: [
      { type: 'p', text: 'La promulgación de la Ley 21.180 sobre Transformación Digital del Estado marcó un antes y un después en la forma en que las instituciones públicas y los organismos colaboradores deben gestionar su información. El principal objetivo de esta normativa es optimizar los recursos, asegurar la interoperabilidad de los datos y, fundamentalmente, avanzar hacia un ecosistema "Cero Papel".' },
      { type: 'h2', text: '¿Qué implica realmente la Ley 21.180?' },
      { type: 'p', text: 'En términos prácticos, la ley obliga a las entidades a soportar todos sus procedimientos administrativos en plataformas electrónicas. Esto significa que la emisión de certificados, el enrolamiento de ciudadanos o socios, y la gestión de beneficios deben transicionar desde formatos físicos e ineficientes hacia soluciones digitales centralizadas y seguras.' },
      { type: 'h2', text: 'El Aporte de SkardKey a la Iniciativa Cero Papel' },
      { type: 'p', text: 'En este escenario regulatorio, SkardKey se posiciona como una herramienta estratégica para las organizaciones. Al digitalizar la identidad corporativa y social, SkardKey elimina por completo la necesidad de emitir plásticos y credenciales de papel.' },
      { type: 'ul', items: [
        'Emisión Instantánea: Las credenciales se generan y envían digitalmente, reduciendo los tiempos de espera a cero.',
        'Sostenibilidad: Eliminación de residuos plásticos y reducción de la huella de carbono asociada a la logística de tarjetas físicas.',
        'Cumplimiento Normativo: Registro inmutable de actividades que facilita las auditorías y cumple con los estándares de trazabilidad exigidos por las nuevas regulaciones.'
      ]},
      { type: 'p', text: 'Adoptar SkardKey no es solo modernizar la estética de una organización; es dar un paso firme hacia el cumplimiento de la Transformación Digital, asegurando procesos más transparentes, ecológicos y alineados con el marco jurídico actual.' }
    ]
  },
  {
    slug: 'tecnologia-blockchain-e-identidad-digital',
    title: 'Tecnología Blockchain: El Eslabón Clave en la Identidad Digital',
    date: '25 May 2026',
    excerpt: 'Descubre qué es Blockchain, cómo contribuye a la seguridad de los datos y por qué es el futuro de la gestión de identidades y credenciales.',
    readTime: '5 min',
    category: 'Tecnología',
    imageIcon: 'ShieldCheck',
    content: [
      { type: 'p', text: 'Durante los últimos años, la tecnología Blockchain ha trascendido su origen en las criptomonedas para convertirse en una de las infraestructuras de seguridad más robustas del mundo. Pero, ¿qué es exactamente y cómo se relaciona con la identidad digital?' },
      { type: 'h2', text: '¿Qué es Blockchain?' },
      { type: 'p', text: 'Blockchain, o cadena de bloques, es un registro descentralizado e inmutable de información. A diferencia de las bases de datos tradicionales, donde la información puede ser alterada por un administrador central, en Blockchain cada transacción o dato ingresado queda criptográficamente sellado. Si alguien intenta modificar un dato en el pasado, la red entera lo detecta y lo rechaza.' },
      { type: 'h2', text: 'Su Contribución a la Identidad Digital' },
      { type: 'p', text: 'El robo de identidad y la falsificación de credenciales son problemas millonarios a nivel global. Blockchain soluciona esto proporcionando "Verdad Matemática". Cuando una credencial se emite utilizando principios de registro distribuido, su autenticidad puede ser verificada por cualquier actor sin necesidad de contactar al emisor original.' },
      { type: 'h2', text: 'La Visión de SkardKey' },
      { type: 'p', text: 'En SkardKey, entendemos que la confianza es el pilar de cualquier organización. Nuestra arquitectura está diseñada bajo los principios de inmutabilidad y transparencia inspirados en Blockchain.' },
      { type: 'ul', items: [
        'Trazabilidad Absoluta: Nuestro Audit Log registra cada emisión, modificación y uso de credenciales, creando un historial que no puede ser manipulado.',
        'Verificación QR Segura: Cada lectura de una tarjeta SkardKey valida criptográficamente su estado en tiempo real, imposibilitando la falsificación.',
        'Protección de Datos: La descentralización de los beneficios y el control granular de accesos aseguran que la información sensible solo sea visible para quien corresponde.'
      ]},
      { type: 'p', text: 'La integración de estas tecnologías de vanguardia permite a SkardKey ofrecer una plataforma donde la identidad digital no solo es conveniente, sino que es fundamentalmente más segura que cualquier documento físico.' }
    ]
  },
  {
    slug: 'transformacion-digital-en-la-actualidad',
    title: 'La Transformación Digital en la Actualidad: Agilidad Organizacional',
    date: '20 May 2026',
    excerpt: 'Cómo la modernización tecnológica dejó de ser un lujo para convertirse en una necesidad operativa para corporaciones, sindicatos y juntas de vecinos.',
    readTime: '3 min',
    category: 'Innovación',
    imageIcon: 'Rocket',
    content: [
      { type: 'p', text: 'La transformación digital ya no es un término reservado para las grandes empresas tecnológicas de Silicon Valley. Hoy en día, es una realidad ineludible que afecta a todas las capas de la sociedad, desde corporaciones multinacionales hasta las juntas de vecinos locales y sindicatos.' },
      { type: 'h2', text: 'El Nuevo Estándar Operativo' },
      { type: 'p', text: 'La digitalización actual se enfoca en la agilidad. Los usuarios esperan que sus interacciones con cualquier entidad sean instantáneas y accesibles desde sus teléfonos móviles. Los procesos de acreditación manuales, las filas para obtener certificados de residencia y los carnets que demoran semanas en imprimirse son percibidos como ineficiencias críticas.' },
      { type: 'h2', text: 'El Aporte Integral de SkardKey' },
      { type: 'p', text: 'SkardKey actúa como el puente que facilita esta transición para organizaciones de cualquier tamaño. Entendemos que la transformación digital no se trata solo de comprar software, sino de cambiar la cultura organizacional hacia la eficiencia.' },
      { type: 'ul', items: [
        'Democratización de la Tecnología: SkardKey provee herramientas de nivel empresarial (enterprise) adaptadas y accesibles para juntas vecinales y pequeños sindicatos.',
        'Centralización de Beneficios: Unificamos la identidad del usuario con sus beneficios, eliminando la necesidad de múltiples sistemas desconectados.',
        'Decisiones Basadas en Datos: Los reportes de asistencia a asambleas y métricas de uso permiten a los líderes tomar decisiones informadas en tiempo real.'
      ]},
      { type: 'p', text: 'Al implementar SkardKey, las organizaciones no solo resuelven el problema de la identificación, sino que envían un mensaje claro a sus miembros: somos una entidad moderna, ágil y preparada para los desafíos del mañana.' }
    ]
  }
];

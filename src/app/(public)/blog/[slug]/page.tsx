import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/data/blog';
import { ArrowLeft, Calendar, Clock, Share2, FileText, ShieldCheck, Rocket } from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
}

export function generateMetadata({ params }: Props): Metadata {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  
  if (!post) {
    return {
      title: 'Artículo no encontrado | SkardKey',
    };
  }

  return {
    title: `${post.title} | Blog SkardKey`,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

const iconMap: Record<string, React.ElementType> = {
  FileText,
  ShieldCheck,
  Rocket
};

export default function BlogPostPage({ params }: Props) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  const IconComponent = iconMap[post.imageIcon] || FileText;

  return (
    <div className="min-h-screen bg-surface-950 pt-24 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb / Back button */}
        <div className="mb-10 animate-fade-in">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-brand-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Blog
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {post.category}
            </span>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {post.date}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime}
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter mb-8 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between py-6 border-y border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-900 border border-white/10 flex items-center justify-center p-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-purple-500/20" />
                <img src="/images/skardkey-icon.png" alt="SkardKey" className="w-full h-full object-contain relative z-10 drop-shadow-md" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Equipo SkardKey</p>
                <p className="text-xs text-slate-400">Innovación y Tecnología</p>
              </div>
            </div>
            
            <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-brand-500 transition-colors" title="Compartir">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Featured Image Abstract */}
        <div className="w-full aspect-[21/9] rounded-3xl bg-gradient-to-br from-surface-900 to-surface-950 border border-white/10 mb-12 flex items-center justify-center overflow-hidden relative shadow-2xl shadow-black/50 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 to-transparent" />
          <IconComponent className="w-32 h-32 text-brand-500/30 relative z-10 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
        </div>

        {/* Article Body */}
        <article className="prose prose-invert prose-brand max-w-none prose-p:text-slate-300 prose-p:leading-relaxed prose-h2:text-2xl prose-h2:font-bold prose-h2:text-white prose-h2:mt-12 prose-h2:mb-6 prose-li:text-slate-300 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {post.content.map((block, index) => {
            if (block.type === 'h2') {
              return <h2 key={index}>{block.text}</h2>;
            }
            if (block.type === 'p') {
              return <p key={index} className="text-lg">{block.text}</p>;
            }
            if (block.type === 'ul' && block.items) {
              return (
                <ul key={index} className="space-y-4 my-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5 list-none">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2.5 flex-shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      <span className="text-slate-300 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            if (block.type === 'link' && block.url) {
              return (
                <div key={index} className="my-8">
                  <a 
                    href={block.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 hover:text-brand-300 font-medium transition-colors border border-brand-500/20"
                  >
                    {block.text}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              );
            }
            return null;
          })}
        </article>

        {/* CTA Footer */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-brand-900/40 to-purple-900/20 border border-brand-500/20 text-center relative overflow-hidden animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="absolute inset-0 bg-brand-500/5 backdrop-blur-3xl" />
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-4">Lleva tu organización al siguiente nivel</h3>
            <p className="text-slate-300 mb-6 max-w-lg mx-auto">
              Únete a las instituciones que ya están aprovechando la identidad digital inteligente de SkardKey.
            </p>
            <Link 
              href="/contacto"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-brand-950 font-bold hover:scale-105 transition-transform shadow-xl shadow-white/10"
            >
              Comenzar Ahora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

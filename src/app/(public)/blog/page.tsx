import { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/data/blog';
import { FileText, ShieldCheck, Rocket, ChevronRight, Clock, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog y Novedades | SkardKey',
  description: 'Descubre las últimas novedades sobre Transformación Digital, Blockchain y gestión de identidad inteligente.',
};

const iconMap: Record<string, React.ElementType> = {
  FileText,
  ShieldCheck,
  Rocket
};

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-surface-950 pt-24 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Insights & Noticias
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-6">
            El Futuro de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">Identidad Digital</span>
          </h1>
          <p className="text-lg text-slate-400">
            Artículos y guías sobre transformación digital, cumplimiento normativo y tecnología aplicada a organizaciones sociales y empresariales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post, index) => {
            const IconComponent = iconMap[post.imageIcon] || FileText;
            
            return (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`}
                className="group glass-card p-6 rounded-2xl flex flex-col hover:border-brand-500/30 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-300">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-white/5 text-slate-400 border border-white/10 group-hover:border-brand-500/20 group-hover:text-brand-300 transition-colors">
                    {post.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-slate-400 text-sm mb-6 flex-1 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
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
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

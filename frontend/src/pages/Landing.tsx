import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faBolt, faGlobe, faSliders, faCode, faArrowRight, faWaveSquare } from '@fortawesome/free-solid-svg-icons';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [typedText, setTypedText] = useState('');
    const [currentPhrase, setCurrentPhrase] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const phrases = [
        '让文字拥有声音',
        'AI 驱动的语音合成',
        '自然的表达，无限的可能'
    ];

    // 打字机效果
    useEffect(() => {
        const phrase = phrases[currentPhrase];
        let index = 0;
        let isDeleting = false;
        let timeout: NodeJS.Timeout;

        const type = () => {
            if (!isDeleting && index <= phrase.length) {
                setTypedText(phrase.slice(0, index));
                index++;
                timeout = setTimeout(type, 100);
            } else if (!isDeleting) {
                isDeleting = true;
                timeout = setTimeout(type, 2000); // 停顿
            } else if (isDeleting && index >= 0) {
                setTypedText(phrase.slice(0, index));
                index--;
                timeout = setTimeout(type, 50);
            } else {
                isDeleting = false;
                setCurrentPhrase((prev) => (prev + 1) % phrases.length);
                timeout = setTimeout(type, 500);
            }
        };

        type();
        return () => clearTimeout(timeout);
    }, [currentPhrase]);

    // 鼠标位置追踪（用于光效）
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleGetStarted = () => {
        navigate('/');
    };

    const features = [
        {
            icon: faMicrophone,
            title: '自然语音',
            description: 'AI 驱动的语音合成技术，生成自然流畅的语音输出'
        },
        {
            icon: faBolt,
            title: '实时生成',
            description: '快速响应，实时将您的文本转换为高质量音频'
        },
        {
            icon: faGlobe,
            title: '多语言支持',
            description: '支持多种语言和方言，满足全球用户的语音需求'
        },
        {
            icon: faSliders,
            title: '参数可调',
            description: '精细控制语速、语调等参数，打造个性化语音效果'
        },
        {
            icon: faCode,
            title: 'SSML 支持',
            description: '支持 SSML 标记语言，实现更丰富的语音表达效果'
        },
        {
            icon: faWaveSquare,
            title: 'API 集成',
            description: '提供完善的 API 接口，轻松集成到您的应用中'
        }
    ];

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary-foreground"
        >
            {/* 动态光效 */}
            <div
                className="fixed w-[600px] h-[600px] rounded-full pointer-events-none opacity-10 dark:opacity-20 transition-all duration-100 ease-out mix-blend-screen"
                style={{
                    background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
                    left: mousePosition.x - 300,
                    top: mousePosition.y - 300,
                }}
            />

            {/* 网格背景 */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            {/* 导航栏 */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">TTS Studio</span>
                    </div>

                    {/* 右侧按钮 */}
                    <Button onClick={handleGetStarted} className="rounded-full px-6 shadow-lg shadow-primary/20">
                        开始使用
                    </Button>
                </div>
            </nav>

            {/* Hero 区域 */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20">
                <div className="max-w-5xl mx-auto text-center">
                    {/* 小标签 */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm text-primary font-medium">AI 文本转语音服务</span>
                    </div>

                    {/* 主标题 */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight tracking-tight">
                        <span className="block text-foreground mb-2">让文字</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-500 animate-gradient">
                            拥有声音
                        </span>
                    </h1>

                    {/* 打字机效果副标题 */}
                    <div className="h-8 mb-12">
                        <p className="text-xl md:text-2xl text-muted-foreground font-light">
                            {typedText}
                            <span className="inline-block w-0.5 h-6 bg-primary ml-1 animate-pulse" />
                        </p>
                    </div>

                    {/* CTA 按钮组 */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Button
                            size="lg"
                            onClick={handleGetStarted}
                            className="text-lg px-8 py-6 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            立即开始
                            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="text-lg px-8 py-6 rounded-2xl hover:bg-muted"
                        >
                            了解更多
                        </Button>
                    </div>

                    {/* 装饰数据 */}
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-muted-foreground">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-foreground mb-1">600+</div>
                            <div className="text-sm">语音类型</div>
                        </div>
                        <div className="w-px h-12 bg-border hidden md:block" />
                        <div className="text-center">
                            <div className="text-3xl font-bold text-foreground mb-1">80+</div>
                            <div className="text-sm">语言支持</div>
                        </div>
                        <div className="w-px h-12 bg-border hidden md:block" />
                        <div className="text-center">
                            <div className="text-3xl font-bold text-foreground mb-1">SSML</div>
                            <div className="text-sm">标准支持</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 功能特点区域 */}
            <section id="features" className="relative z-10 py-32 px-6 bg-muted/30">
                <div className="max-w-7xl mx-auto">
                    {/* 区域标题 */}
                    <div className="text-center mb-20">
                        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4">
                            功能特点
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                            强大的功能
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            专业级语音合成能力，满足您的各种语音需求
                        </p>
                    </div>

                    {/* 功能卡片网格 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative p-8 rounded-3xl border border-border bg-card hover:border-primary/50 transition-all duration-500 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="relative z-10">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-primary/10 text-primary">
                                        <FontAwesomeIcon icon={feature.icon} className="text-2xl" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA 区域 */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-3xl p-12 md:p-16 overflow-hidden bg-primary text-primary-foreground shadow-2xl">
                        {/* 装饰圆 */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        {/* 内容 */}
                        <div className="relative z-10 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                准备好开始了吗？
                            </h2>
                            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                                立即体验 AI 语音合成技术，让您的文字获得生命
                            </p>
                            <Button
                                onClick={handleGetStarted}
                                variant="secondary"
                                size="lg"
                                className="px-8 py-6 rounded-xl text-lg font-semibold shadow-lg hover:scale-105 transition-transform"
                            >
                                免费开始使用
                                <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 页脚 */}
            <footer className="relative z-10 py-12 px-6 border-t border-border bg-background">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <span className="font-semibold text-foreground">TTS Studio</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        © {new Date().getFullYear()} TTS Studio. All rights reserved.
                    </p>
                </div>
            </footer>

            <style>{`
                @keyframes gradient {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient {
                    background-size: 200% auto;
                    animation: gradient 3s ease infinite;
                }
            `}</style>
        </div>
    );
};

export default Landing;

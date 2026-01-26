import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================
// 设计理念: "声波的诗意" - 将文字转化为声音的魔法
// ============================================
// 美学方向: 深邃灰 + 活力绿 + 温暖橙
// 统一应用 Home 页面的设计语言
// ============================================

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
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            ),
            title: '自然语音',
            description: 'AI 驱动的语音合成技术，生成自然流畅的语音输出'
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
            ),
            title: '实时生成',
            description: '快速响应，实时将您的文本转换为高质量音频'
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S13.257 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.757 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.424-3.113 1.167-4.418" />
                </svg>
            ),
            title: '多语言支持',
            description: '支持多种语言和方言，满足全球用户的语音需求'
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
            ),
            title: '参数可调',
            description: '精细控制语速、语调等参数，打造个性化语音效果'
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
            ),
            title: 'SSML 支持',
            description: '支持 SSML 标记语言，实现更丰富的语音表达效果'
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
            ),
            title: 'API 集成',
            description: '提供完善的 API 接口，轻松集成到您的应用中'
        }
    ];

    // 声波动画组件 - 改为绿色/橙色主题
    const SoundWave: React.FC<{ delay: number; color: string }> = ({ delay, color }) => (
        <div
            className="absolute rounded-full"
            style={{
                width: '300px',
                height: '300px',
                border: `1px solid ${color}`,
                opacity: 0.3,
                animation: `soundwave 3s ease-out infinite`,
                animationDelay: `${delay}ms`,
            }}
        />
    );

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen overflow-hidden bg-gray-950 text-white font-sans selection:bg-green-500/30 selection:text-white"
        >
            {/* 背景渐变 - 简化为与Home一致 */}
            <div className="fixed inset-0 bg-gray-950" />

            {/* 动态光效 - 改为绿色 */}
            <div
                className="fixed w-[600px] h-[600px] rounded-full pointer-events-none opacity-20 transition-all duration-100 ease-out"
                style={{
                    background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)',
                    left: mousePosition.x - 300,
                    top: mousePosition.y - 300,
                }}
            />

            {/* 装饰性声波 - 改为绿色系 */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <SoundWave delay={0} color="#22c55e" />
                <SoundWave delay={500} color="#10b981" />
                <SoundWave delay={1000} color="#14b8a6" />
            </div>

            {/* 网格背景 - 与Home完全一致 */}
            <div className="fixed inset-0 opacity-10">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage: `
                            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            {/* 导航栏 */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight">TTS Studio</span>
                    </div>

                    {/* 右侧按钮 */}
                    <button
                        onClick={handleGetStarted}
                        className="group relative px-6 py-2.5 rounded-full font-medium text-sm overflow-hidden transition-all duration-300 hover:scale-105"
                        style={{
                            background: 'linear-gradient(135deg, #22c55e 0%, #059669 100%)',
                            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
                        }}
                    >
                        <span className="relative z-10 text-white">开始使用</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </button>
                </div>
            </nav>

            {/* Hero 区域 */}
            <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
                <div className="max-w-5xl mx-auto text-center">
                    {/* 小标签 */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/5 mb-8">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-green-400">AI 文本转语音服务</span>
                    </div>

                    {/* 主标题 */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
                        <span className="block text-white mb-2">让文字</span>
                        <span className="block bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent animate-gradient">
                            拥有声音
                        </span>
                    </h1>

                    {/* 打字机效果副标题 */}
                    <div className="h-8 mb-12">
                        <p className="text-xl md:text-2xl text-gray-400 font-light">
                            {typedText}
                            <span className="inline-block w-0.5 h-6 bg-green-500 ml-1 animate-pulse" />
                        </p>
                    </div>

                    {/* CTA 按钮组 */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <button
                            onClick={handleGetStarted}
                            className="group relative px-8 py-4 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                            style={{
                                background: 'linear-gradient(135deg, #22c55e 0%, #059669 100%)',
                                boxShadow: '0 8px 30px rgba(34, 197, 94, 0.3)',
                            }}
                        >
                            <span className="relative z-10 text-white flex items-center gap-2">
                                立即开始
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </span>
                        </button>

                        <button
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 rounded-2xl font-semibold text-lg border border-gray-700 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-300 flex items-center gap-2"
                        >
                            了解更多
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                            </svg>
                        </button>
                    </div>

                    {/* 装饰数据 */}
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-gray-500">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">600+</div>
                            <div className="text-sm">语音类型</div>
                        </div>
                        <div className="w-px h-12 bg-gray-700 hidden md:block" />
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">80+</div>
                            <div className="text-sm">语言支持</div>
                        </div>
                        <div className="w-px h-12 bg-gray-700 hidden md:block" />
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">SSML</div>
                            <div className="text-sm">标准支持</div>
                        </div>
                    </div>
                </div>

                {/* 滚动提示 */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                    </svg>
                </div>
            </section>

            {/* 功能特点区域 */}
            <section id="features" className="relative z-10 py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* 区域标题 */}
                    <div className="text-center mb-20">
                        <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20 mb-4">
                            功能特点
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            强大的功能
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            专业级语音合成能力，满足您的各种语音需求
                        </p>
                    </div>

                    {/* 功能卡片网格 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group relative p-8 rounded-3xl border border-gray-800 bg-gray-900/50 hover:border-green-500/30 transition-all duration-500 hover:scale-[1.02]"
                                style={{
                                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                                }}
                            >
                                {/* 背景光效 */}
                                <div
                                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(34, 197, 94, 0.1) 0%, transparent 50%)',
                                    }}
                                />

                                {/* 内容 */}
                                <div className="relative z-10">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                        }}
                                    >
                                        <div className="text-green-500">{feature.icon}</div>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA 区域 */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <div
                        className="relative rounded-3xl p-12 md:p-16 overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                        }}
                    >
                        {/* 装饰光效 */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />

                        {/* 内容 */}
                        <div className="relative z-10 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                准备好开始了吗？
                            </h2>
                            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                                立即体验 AI 语音合成技术，让您的文字获得生命
                            </p>
                            <button
                                onClick={handleGetStarted}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
                                style={{
                                    background: 'linear-gradient(135deg, #22c55e 0%, #059669 100%)',
                                    boxShadow: '0 8px 30px rgba(34, 197, 94, 0.3)',
                                }}
                            >
                                <span className="text-white">免费开始使用</span>
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 页脚 */}
            <footer className="relative z-10 py-12 px-6 border-t border-gray-800">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <span className="font-semibold">TTS Studio</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © 2025 TTS Studio. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* 自定义动画样式 */}
            <style>{`
                @keyframes soundwave {
                    0% {
                        transform: scale(0.8);
                        opacity: 0.6;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes gradient {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }

                .animate-gradient {
                    background-size: 200% auto;
                    animation: gradient 3s ease infinite;
                }

                /* 滚动条样式 */
                ::-webkit-scrollbar {
                    width: 8px;
                }

                ::-webkit-scrollbar-track {
                    background: #030712; /* gray-950 */
                }

                ::-webkit-scrollbar-thumb {
                    background: #1f2937; /* gray-800 */
                    border-radius: 4px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: #22c55e; /* green-500 */
                }
            `}</style>
        </div>
    );
};

export default Landing;

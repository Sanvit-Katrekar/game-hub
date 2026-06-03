'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainRodThumbnail } from './thumbail'
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function GameCard({
  title,
  subtitle,
  thumbnail,
  onClick
}: {
  title: string;
  subtitle: string;
  thumbnail: React.ReactNode;
  onClick: () => void;
}) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setRotation({ x: -dy * 12, y: dx * 12 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setHovered(false);
  };

  return (
    <div
      style={{ perspective: 600 }}
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className="cursor-pointer rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          transformStyle: 'preserve-3d',
          boxShadow: hovered
            ? '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,200,66,0.3)'
            : '0 8px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Thumbnail area */}
        <div
          className="relative flex items-center justify-center"
          style={{
            background: 'var(--surface2)',
            height: 160,
            borderBottom: '1px solid var(--border)',
          }}
        >
          {/* Glow behind thumbnail */}
          {hovered && (
            <div
              className="absolute inset-0 opacity-20 rounded-t-2xl"
              style={{ background: 'radial-gradient(ellipse at center, var(--accent), transparent 70%)' }}
            />
          )}
          <div style={{ transform: 'translateZ(16px)' }}>
            {thumbnail}
          </div>
          {/* Play badge */}
          {hovered && (
            <div
              className="absolute top-3 right-3 text-xs font-display font-700 px-2 py-1 rounded-lg uppercase tracking-widest"
              style={{ background: 'var(--accent)', color: '#0e0e12' }}
            >
              Play
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="px-4 py-3 flex flex-col justify-center items-center">
          <h3 className="font-display font-700 text-base mb-0.5" style={{ color: 'var(--text)' }}>
            {title}
          </h3>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Hub() {
  const router = useRouter();
  return (
    <div className="px-5" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <motion.header
        className="flex items-center justify-center px-8 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {['#3a7fc1','#2d8a4e','#e8c019','#c0306a'].map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-sm" style={{ background: c }} />
            ))}
          </div>
          <span className="font-display font-700 text-lg tracking-widest uppercase" style={{ color: 'var(--text)' }}>
            Game Hub
          </span>
        </div>
      </motion.header>

      <main className="py-10 mx-10 lg:mx-20 flex flex-col justify-center items-center gap-4">
        <div
          className="mb-8"
        >
          <h2 className="font-display font-800 text-3xl mb-1" style={{ color: 'var(--text)' }}>
            Welcome 👋
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Pick a game and start playing
          </p>
        </div>

        {/* Section label */}
        <p
          style={{ color: 'var(--muted)' }}
        >
          Puzzle Games
        </p>

        <div className="flex flex-wrap gap-4 justify-center w-full">
          <div className="w-[250px]">
            <GameCard
              title="BrainRod"
              subtitle="Tile-fitting puzzle · Multi-round"
              thumbnail={<BrainRodThumbnail size={96} />}
              onClick={() => router.push('/brainrod')}
            />
          </div>
        </div>

        <p
          style={{ color: 'var(--muted)' }}
        >
          Card Games
        </p>

        <div className="flex flex-wrap gap-4 justify-center w-full">
          <div className="w-[250px]">
            <GameCard
              title="Cardverse Online"
              subtitle="Repository of Card Games"
              thumbnail={
                <Image
                  src="/cardverse-online-icon.png"
                  alt="cardverse-online-icon"
                  width={96}
                  height={96}
                  priority
                />}
              onClick={
                () => window.open('https://cardverse-online.sanhs.dpdns.org', '_blank', 'noopener,noreferrer')
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}

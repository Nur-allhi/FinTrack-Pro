import { motion } from 'motion/react';

export default function LoadingScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={fullScreen ? 'min-h-screen flex items-center justify-center bg-canvas' : 'w-full flex items-center justify-center min-h-[300px]'}>
      <div className="relative w-32 h-1.5 bg-surface-soft rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-primary rounded-full"
          initial={{ x: '-100%' }}
          animate={{ x: '400%' }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

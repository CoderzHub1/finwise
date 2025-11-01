import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/GamifiedPieChart.module.css';

export default function GamifiedPieChart({ totalIncome, totalExpense, animationTrigger }) {
  const canvasRef = useRef(null);
  const [balls, setBalls] = useState([]);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [rotation, setRotation] = useState(0);

  const percentage = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    let animationFrame;
    let currentPercentage = 0;
    const targetPercentage = normalizedPercentage;

    const animate = () => {
      // Smooth transition to target percentage
      if (Math.abs(currentPercentage - targetPercentage) > 0.5) {
        currentPercentage += (targetPercentage - currentPercentage) * 0.1;
      } else {
        currentPercentage = targetPercentage;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate angles
      const startAngle = rotation;
      const endAngle = startAngle + (currentPercentage / 100) * 2 * Math.PI;
      const mouthAngle = 0.3 * Math.sin(mouthOpen);

      // Draw the filled part (remaining income)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        startAngle + mouthAngle,
        endAngle - mouthAngle,
        false
      );
      ctx.closePath();
      
      // Black filled part with subtle gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, '#262626');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw the eaten part (expenses)
      if (currentPercentage < 100) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(
          centerX,
          centerY,
          radius,
          endAngle,
          startAngle + 2 * Math.PI,
          false
        );
        ctx.closePath();
        ctx.fillStyle = '#f5f5f5';
        ctx.fill();
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw eye
      ctx.beginPath();
      ctx.arc(centerX + 40, centerY - 30, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Update mouth animation
      setMouthOpen(prev => prev + 0.15);

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [normalizedPercentage, mouthOpen, rotation]);

  // Trigger ball eating animation when income is added
  useEffect(() => {
    if (animationTrigger && animationTrigger.type === 'income') {
      const newBalls = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        x: 400,
        y: 150,
        delay: i * 0.1
      }));
      setBalls(newBalls);

      // Rotate pie chart to "eat" balls
      setRotation(prev => prev + 0.3);

      // Remove balls after animation
      setTimeout(() => {
        setBalls([]);
      }, 2000);
    }
  }, [animationTrigger]);

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={300}
          className={styles.canvas}
        />
        
        <AnimatePresence>
          {balls.map((ball) => (
            <motion.div
              key={ball.id}
              className={styles.ball}
              initial={{ x: ball.x, y: ball.y, scale: 1, opacity: 1 }}
              animate={{ 
                x: 200, 
                y: 150, 
                scale: 0,
                opacity: 0
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: ball.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Income</span>
          <span className={styles.statValue}>
            ${totalIncome.toFixed(2)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Expenses</span>
          <span className={styles.statValue}>
            ${totalExpense.toFixed(2)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Remaining</span>
          <span className={styles.statValue}>
            ${(totalIncome - totalExpense).toFixed(2)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Completion</span>
          <span className={styles.statValue}>
            {normalizedPercentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

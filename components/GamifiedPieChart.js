import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/GamifiedPieChart.module.css';

export default function PacManBudgetTracker({ totalIncome = 0, totalExpense = 0, animationTrigger = null }) {
  const canvasRef = useRef(null);
  const [balls, setBalls] = useState([]);
  const [particles, setParticles] = useState([]);
  const [isEating, setIsEating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef(null);
  const currentPercentageRef = useRef(0);
  const currentRadiusRef = useRef(100);
  const targetPercentageRef = useRef(0);
  const targetRadiusForAnimationRef = useRef(100);
  const initializedRef = useRef(false);
  const lastTriggerRef = useRef(null);

  // Calculate the base radius based on total income
  const getBaseRadius = (income) => {
    if (income === 0) return 100;
    return Math.min(Math.max(80, income / 10), 150);
  };

  // Calculate what percentage of the circle is filled (not eaten)
  const remaining = totalIncome - totalExpense;
  const percentage = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0;
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));
  const targetRadius = getBaseRadius(totalIncome);

  // Initialize refs when data is first loaded
  useEffect(() => {
    if (!initializedRef.current && totalIncome > 0) {
      currentPercentageRef.current = normalizedPercentage;
      currentRadiusRef.current = targetRadius;
      targetPercentageRef.current = normalizedPercentage;
      targetRadiusForAnimationRef.current = targetRadius;
      initializedRef.current = true;
    }
  }, [totalIncome, normalizedPercentage, targetRadius]);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let mouthPhase = 0;

    const animate = () => {
      // Only animate towards target when isAnimating is true
      if (isAnimating) {
        const percentageDiff = targetPercentageRef.current - currentPercentageRef.current;
        const radiusDiff = targetRadiusForAnimationRef.current - currentRadiusRef.current;

        if (Math.abs(percentageDiff) > 0.5) {
          currentPercentageRef.current += percentageDiff * 0.1;
        } else {
          currentPercentageRef.current = targetPercentageRef.current;
        }

        if (Math.abs(radiusDiff) > 0.5) {
          currentRadiusRef.current += radiusDiff * 0.1;
        } else {
          currentRadiusRef.current = targetRadiusForAnimationRef.current;
        }

        // Check if animation is complete
        if (Math.abs(percentageDiff) <= 0.5 && Math.abs(radiusDiff) <= 0.5) {
          setIsAnimating(false);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const radius = currentRadiusRef.current;
      const filledAngle = (currentPercentageRef.current / 100) * 2 * Math.PI;
      
      // Only animate mouth when eating
      const mouthAngle = isEating ? (0.4 + Math.sin(mouthPhase) * 0.15) : 0.3;

      // Draw the filled part (remaining budget) - the Pac-Man body
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        mouthAngle,
        mouthAngle + filledAngle,
        false
      );
      ctx.closePath();

      const gradient = ctx.createRadialGradient(centerX - radius/3, centerY - radius/3, 0, centerX, centerY, radius);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(1, '#FFA500');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw the eaten part (expenses) - the missing sector
      if (currentPercentageRef.current < 100) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(
          centerX,
          centerY,
          radius,
          mouthAngle + filledAngle,
          mouthAngle + 2 * Math.PI,
          false
        );
        ctx.closePath();
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw lines to show the "bite"
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + radius * Math.cos(mouthAngle + filledAngle),
          centerY + radius * Math.sin(mouthAngle + filledAngle)
        );
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + radius * Math.cos(mouthAngle),
          centerY + radius * Math.sin(mouthAngle)
        );
        ctx.stroke();
      }

      // Draw eye
      const eyeX = centerX + radius * 0.3 * Math.cos(Math.PI / 4);
      const eyeY = centerY + radius * 0.3 * Math.sin(Math.PI / 4);
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, radius * 0.08, 0, 2 * Math.PI);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Only update mouth animation when eating
      if (isEating) {
        mouthPhase += 0.2;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, isEating]);

  // Trigger animations when animationTrigger changes
  useEffect(() => {
    if (!initializedRef.current) return;
    if (!animationTrigger) return;
    
    // Prevent duplicate triggers
    const triggerKey = `${animationTrigger.type}-${animationTrigger.timestamp || Date.now()}`;
    if (lastTriggerRef.current === triggerKey) return;
    lastTriggerRef.current = triggerKey;

    if (animationTrigger.type === 'income') {
      const amount = animationTrigger.amount;
      
      // Start eating animation
      setIsEating(true);

      // Trigger ball animation
      const ballCount = Math.min(Math.ceil(amount / 50), 8);
      const newBalls = Array.from({ length: ballCount }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        delay: i * 0.1
      }));
      setBalls(newBalls);

      // Create particles when balls reach Pac-Man
      const particleTimers = newBalls.map((ball, i) => {
        return setTimeout(() => {
          const newParticles = Array.from({ length: 8 }, (_, j) => ({
            id: `${ball.id}-particle-${j}`,
            angle: (j * 45),
            speed: 2 + Math.random() * 2,
          }));
          setParticles(prev => [...prev, ...newParticles]);

          // Remove these particles after animation
          setTimeout(() => {
            setParticles(prev => prev.filter(p => !p.id.startsWith(`${ball.id}-particle`)));
          }, 600);
        }, (ball.delay + 0.8) * 1000);
      });

      // Update values and animate after balls are eaten
      const updateTimer = setTimeout(() => {
        const newRemaining = totalIncome - totalExpense;
        const newPercentage = totalIncome > 0 ? (newRemaining / totalIncome) * 100 : 0;
        const newNormalizedPercentage = Math.max(0, Math.min(100, newPercentage));
        const newRadius = getBaseRadius(totalIncome);
        
        targetPercentageRef.current = newNormalizedPercentage;
        targetRadiusForAnimationRef.current = newRadius;
        setIsAnimating(true);
        
        setBalls([]);
        setIsEating(false);
      }, 1200);

      return () => {
        clearTimeout(updateTimer);
        particleTimers.forEach(timer => clearTimeout(timer));
      };
    } else if (animationTrigger.type === 'expense') {
      setIsEating(true);
      
      const newRemaining = totalIncome - totalExpense;
      const newPercentage = totalIncome > 0 ? (newRemaining / totalIncome) * 100 : 0;
      const newNormalizedPercentage = Math.max(0, Math.min(100, newPercentage));
      
      targetPercentageRef.current = newNormalizedPercentage;
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsEating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [animationTrigger, totalIncome, totalExpense]);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Pac-Man Budget Tracker
        </h2>
        <p className={styles.subtitle}>
          Watch Pac-Man eat your expenses and grow with your income!
        </p>
      </div>

      <div className={styles.chartWrapper}>
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className={styles.canvas}
        />

        {/* Animated balls */}
        {balls.map((ball) => (
          <div
            key={ball.id}
            className={styles.ball}
            style={{
              animationDelay: `${ball.delay}s`,
            }}
          />
        ))}

        {/* Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={styles.particle}
            style={{
              '--angle': `${particle.angle}deg`,
              '--speed': particle.speed,
            }}
          />
        ))}
      </div>

      {/* Stats Grid */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Total Income</div>
          <div className={styles.statValue}>${totalIncome.toFixed(2)}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Total Expenses</div>
          <div className={styles.statValue}>${totalExpense.toFixed(2)}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Remaining</div>
          <div className={styles.statValue}>${remaining.toFixed(2)}</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statLabel}>Remaining %</div>
          <div className={styles.statValue}>{normalizedPercentage.toFixed(1)}%</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes eatBall {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-250px, 80px) scale(0);
            opacity: 0;
          }
        }

        @keyframes explodeParticle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(cos(var(--angle)) * var(--speed) * 50px),
              calc(sin(var(--angle)) * var(--speed) * 50px)
            ) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}


import { useEffect, useRef, useState, useCallback } from 'react';
import styles from '@/styles/PacManBudget.module.css';

export default function PacManBudgetTracker() {
  const canvasRef = useRef(null);
  const [totalIncome, setTotalIncome] = useState(1000);
  const [totalExpense, setTotalExpense] = useState(300);
  const [balls, setBalls] = useState([]);
  const [particles, setParticles] = useState([]);
  const [isEating, setIsEating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef(null);
  const currentPercentageRef = useRef(70);
  const currentRadiusRef = useRef(100);
  const targetPercentageRef = useRef(70);
  const targetRadiusForAnimationRef = useRef(100);
  const lastTriggerRef = useRef(null);
  
  const [incomeInput, setIncomeInput] = useState('');
  const [expenseInput, setExpenseInput] = useState('');

  // Calculate the base radius based on total income
  const getBaseRadius = useCallback((income) => {
    return Math.min(Math.max(80, income / 10), 150);
  }, []);

  // Calculate what percentage of the circle is filled (not eaten)
  const remaining = totalIncome - totalExpense;
  const percentage = totalIncome > 0 ? (remaining / totalIncome) * 100 : 0;
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let mouthPhase = 0;

    const animate = () => {
      // Smooth transitions when animating
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
      
      // Animate mouth when eating
      const mouthAngle = isEating ? (0.4 + Math.sin(mouthPhase) * 0.15) : 0.3;

      // Draw the filled part (Pac-Man body)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, mouthAngle, mouthAngle + filledAngle, false);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        centerX - radius/3, 
        centerY - radius/3, 
        0, 
        centerX, 
        centerY, 
        radius
      );
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(1, '#FFA500');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw the eaten part (expenses)
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
        ctx.fillStyle = '#f5f5f5';
        ctx.fill();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw mouth lines
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

      // Update mouth animation
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

  // Handle income addition with animation
  const handleAddIncome = useCallback((amount) => {
    const triggerKey = `income-${Date.now()}`;
    if (lastTriggerRef.current === triggerKey) return;
    lastTriggerRef.current = triggerKey;

    // Start eating animation
    setIsEating(true);

    // Create balls
    const ballCount = Math.min(Math.ceil(amount / 50), 10);
    const newBalls = Array.from({ length: ballCount }, (_, i) => ({
      id: `ball-${Date.now()}-${i}`,
      delay: i * 0.08
    }));
    setBalls(newBalls);

    // Create particle explosion for each ball
    newBalls.forEach((ball, i) => {
      setTimeout(() => {
        const newParticles = Array.from({ length: 12 }, (_, j) => ({
          id: `${ball.id}-particle-${j}`,
          angle: (j * 30),
          speed: 1.5 + Math.random() * 1.5,
        }));
        setParticles(prev => [...prev, ...newParticles]);

        setTimeout(() => {
          setParticles(prev => prev.filter(p => !p.id.startsWith(`${ball.id}-particle`)));
        }, 800);
      }, (ball.delay + 0.75) * 1000);
    });

    // Update income and animate
    setTimeout(() => {
      setTotalIncome(prev => {
        const newIncome = prev + amount;
        const newRemaining = newIncome - totalExpense;
        const newPercentage = (newRemaining / newIncome) * 100;
        const newNormalizedPercentage = Math.max(0, Math.min(100, newPercentage));
        const newRadius = getBaseRadius(newIncome);
        
        targetPercentageRef.current = newNormalizedPercentage;
        targetRadiusForAnimationRef.current = newRadius;
        setIsAnimating(true);
        
        return newIncome;
      });
      
      setBalls([]);
      setIsEating(false);
    }, 1000);
  }, [totalExpense, getBaseRadius]);

  const addIncome = () => {
    const amount = parseFloat(incomeInput);
    if (isNaN(amount) || amount <= 0) return;
    handleAddIncome(amount);
    setIncomeInput('');
  };

  const addExpense = () => {
    const amount = parseFloat(expenseInput);
    if (isNaN(amount) || amount <= 0) return;

    setIsEating(true);
    
    const newExpense = Math.min(totalExpense + amount, totalIncome);
    setTotalExpense(newExpense);
    
    const newRemaining = totalIncome - newExpense;
    const newPercentage = (newRemaining / totalIncome) * 100;
    const newNormalizedPercentage = Math.max(0, Math.min(100, newPercentage));
    
    targetPercentageRef.current = newNormalizedPercentage;
    setIsAnimating(true);

    setTimeout(() => setIsEating(false), 400);
    setExpenseInput('');
  };

  const reset = () => {
    setTotalIncome(1000);
    setTotalExpense(300);
    setBalls([]);
    setParticles([]);
    setIsEating(false);
    setIsAnimating(false);
    
    const newPercentage = 70;
    currentPercentageRef.current = newPercentage;
    currentRadiusRef.current = 100;
    targetPercentageRef.current = newPercentage;
    targetRadiusForAnimationRef.current = 100;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.icon}>🎮</div>
          <h1 className={styles.title}>
            Pac-Man Budget Tracker
          </h1>
          <p className={styles.subtitle}>
            Watch Pac-Man devour your expenses and grow bigger with your income! 
            A fun way to visualize your budget.
          </p>
        </div>

        {/* Main Chart Container */}
        <div className={styles.chartContainer}>
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
              <div className={styles.statLabel}>
                💰 Total Income
              </div>
              <div className={styles.statValue}>
                ${totalIncome.toFixed(2)}
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statLabel}>
                💸 Total Expenses
              </div>
              <div className={styles.statValue}>
                ${totalExpense.toFixed(2)}
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statLabel}>
                💵 Remaining
              </div>
              <div className={styles.statValue}>
                ${remaining.toFixed(2)}
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statLabel}>
                📊 Budget Health
              </div>
              <div className={styles.statValue}>
                {normalizedPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlCard}>
            <h2 className={styles.controlTitle}>
              <span className={styles.controlIcon}>💰</span>
              Add Income
            </h2>
            <div className={styles.controlGroup}>
              <input
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                placeholder="Enter amount..."
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && addIncome()}
              />
              <button
                onClick={addIncome}
                className={styles.buttonIncome}
              >
                Add
              </button>
            </div>
          </div>

          <div className={styles.controlCard}>
            <h2 className={styles.controlTitle}>
              <span className={styles.controlIcon}>💸</span>
              Add Expense
            </h2>
            <div className={styles.controlGroup}>
              <input
                type="number"
                value={expenseInput}
                onChange={(e) => setExpenseInput(e.target.value)}
                placeholder="Enter amount..."
                className={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && addExpense()}
              />
              <button
                onClick={addExpense}
                className={styles.buttonExpense}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className={styles.resetContainer}>
          <button
            onClick={reset}
            className={styles.buttonReset}
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
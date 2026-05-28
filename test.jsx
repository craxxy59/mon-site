import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Crosshair, Zap, Clock } from 'lucide-react';

const ChronoShiftFPS = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [timeEnergy, setTimeEnergy] = useState(100);
  const [kills, setKills] = useState(0);
  const [activeAbility, setActiveAbility] = useState(null);
  
  const gameRef = useRef({
    player: {
      x: 0, y: 0, z: 0,
      angle: 0, pitch: 0,
      vx: 0, vz: 0,
      health: 100
    },
    enemies: [],
    bullets: [],
    particles: [],
    timeSlowActive: false,
    teleportCooldown: 0,
    wallhackActive: false,
    mouseX: 0,
    mouseY: 0,
    keys: {},
    frameCount: 0,
    lastEnemySpawn: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const createEnemy = () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 10;
      return {
        x: Math.cos(angle) * distance,
        z: Math.sin(angle) * distance,
        y: 0,
        health: 100,
        speed: 0.02 + Math.random() * 0.03,
        lastShot: 0,
        type: Math.random() > 0.7 ? 'tank' : 'normal',
        color: Math.random() > 0.7 ? '#ff0000' : '#ff6600'
      };
    };

    const createParticle = (x, y, z, color) => {
      return {
        x, y, z,
        vx: (Math.random() - 0.5) * 0.2,
        vy: Math.random() * 0.2,
        vz: (Math.random() - 0.5) * 0.2,
        life: 1,
        color
      };
    };

    const createBullet = (x, y, z, angle, pitch, fromPlayer = true) => {
      const speed = 0.5;
      return {
        x, y, z,
        vx: Math.sin(angle) * Math.cos(pitch) * speed,
        vy: -Math.sin(pitch) * speed,
        vz: Math.cos(angle) * Math.cos(pitch) * speed,
        fromPlayer,
        life: 100
      };
    };

    const gameLoop = () => {
      if (gameState !== 'playing') return;
      
      const game = gameRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      game.frameCount++;
      
      // Time slow mechanic
      const timeMultiplier = game.timeSlowActive ? 0.3 : 1;
      
      if (game.timeSlowActive && timeEnergy > 0) {
        setTimeEnergy(e => Math.max(0, e - 0.5));
      } else if (!game.timeSlowActive && timeEnergy < 100) {
        setTimeEnergy(e => Math.min(100, e + 0.2));
      }
      
      if (timeEnergy <= 0) game.timeSlowActive = false;
      
      if (game.teleportCooldown > 0) game.teleportCooldown--;
      if (game.wallhackActive) game.wallhackActive--;

      // Player movement
      const moveSpeed = 0.1;
      if (game.keys['w'] || game.keys['W']) {
        game.player.vx += Math.sin(game.player.angle) * moveSpeed;
        game.player.vz += Math.cos(game.player.angle) * moveSpeed;
      }
      if (game.keys['s'] || game.keys['S']) {
        game.player.vx -= Math.sin(game.player.angle) * moveSpeed;
        game.player.vz -= Math.cos(game.player.angle) * moveSpeed;
      }
      if (game.keys['a'] || game.keys['A']) {
        game.player.vx += Math.cos(game.player.angle) * moveSpeed;
        game.player.vz -= Math.sin(game.player.angle) * moveSpeed;
      }
      if (game.keys['d'] || game.keys['D']) {
        game.player.vx -= Math.cos(game.player.angle) * moveSpeed;
        game.player.vz += Math.sin(game.player.angle) * moveSpeed;
      }
      
      game.player.x += game.player.vx;
      game.player.z += game.player.vz;
      game.player.vx *= 0.85;
      game.player.vz *= 0.85;

      // Spawn enemies
      if (game.frameCount - game.lastEnemySpawn > 120 && game.enemies.length < 10) {
        game.enemies.push(createEnemy());
        game.lastEnemySpawn = game.frameCount;
      }

      // Update enemies
      game.enemies = game.enemies.filter(enemy => {
        const dx = game.player.x - enemy.x;
        const dz = game.player.z - enemy.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        // AI movement
        if (dist > 2) {
          enemy.x += (dx / dist) * enemy.speed * timeMultiplier;
          enemy.z += (dz / dist) * enemy.speed * timeMultiplier;
        }
        
        // Enemy shooting
        if (game.frameCount - enemy.lastShot > 100 / timeMultiplier && dist < 15) {
          const angle = Math.atan2(dx, dz);
          game.bullets.push(createBullet(enemy.x, 0.5, enemy.z, angle, 0, false));
          enemy.lastShot = game.frameCount;
        }
        
        return enemy.health > 0;
      });

      // Update bullets
      game.bullets = game.bullets.filter(bullet => {
        bullet.x += bullet.vx * timeMultiplier;
        bullet.y += bullet.vy * timeMultiplier;
        bullet.z += bullet.vz * timeMultiplier;
        bullet.life--;
        
        if (bullet.fromPlayer) {
          // Check enemy hits
          for (let enemy of game.enemies) {
            const dx = bullet.x - enemy.x;
            const dz = bullet.z - enemy.z;
            if (Math.sqrt(dx * dx + dz * dz) < 0.5) {
              enemy.health -= 50;
              if (enemy.health <= 0) {
                setKills(k => k + 1);
                setScore(s => s + (enemy.type === 'tank' ? 200 : 100));
                for (let i = 0; i < 10; i++) {
                  game.particles.push(createParticle(enemy.x, 0.5, enemy.z, enemy.color));
                }
              }
              return false;
            }
          }
        } else {
          // Check player hits
          const dx = bullet.x - game.player.x;
          const dz = bullet.z - game.player.z;
          if (Math.sqrt(dx * dx + dz * dz) < 0.5) {
            game.player.health -= 10;
            setHealth(h => Math.max(0, h - 10));
            if (game.player.health <= 0) {
              setGameState('gameover');
            }
            return false;
          }
        }
        
        return bullet.life > 0;
      });

      // Update particles
      game.particles = game.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy -= 0.01;
        p.life -= 0.02;
        return p.life > 0;
      });

      // Render
      drawScene(ctx, canvas, game);
      
      animationId = requestAnimationFrame(gameLoop);
    };

    const drawScene = (ctx, canvas, game) => {
      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, game.timeSlowActive ? '#1a0033' : '#000033');
      skyGrad.addColorStop(1, game.timeSlowActive ? '#330066' : '#000066');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground
      ctx.fillStyle = '#001a00';
      ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
      
      // Grid
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
      ctx.lineWidth = 1;
      for (let i = -10; i <= 10; i++) {
        const z1 = i * 2;
        const z2 = i * 2;
        const screenPos1 = worldToScreen(game, canvas, -20, 0, z1);
        const screenPos2 = worldToScreen(game, canvas, 20, 0, z2);
        if (screenPos1 && screenPos2) {
          ctx.beginPath();
          ctx.moveTo(screenPos1.x, screenPos1.y);
          ctx.lineTo(screenPos2.x, screenPos2.y);
          ctx.stroke();
        }
      }

      // Enemies
      game.enemies.sort((a, b) => {
        const distA = Math.sqrt((a.x - game.player.x) ** 2 + (a.z - game.player.z) ** 2);
        const distB = Math.sqrt((b.x - game.player.x) ** 2 + (b.z - game.player.z) ** 2);
        return distB - distA;
      }).forEach(enemy => {
        const pos = worldToScreen(game, canvas, enemy.x, enemy.y, enemy.z);
        if (pos && pos.scale > 0) {
          const size = 40 * pos.scale;
          
          // Wallhack effect
          const behindWall = false;
          const alpha = behindWall && game.wallhackActive ? 0.3 : 1;
          
          // Enemy body
          ctx.globalAlpha = alpha;
          ctx.fillStyle = enemy.color;
          ctx.fillRect(pos.x - size/2, pos.y - size, size, size);
          
          // Head
          ctx.fillStyle = enemy.type === 'tank' ? '#880000' : '#ff8800';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y - size * 1.3, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          
          // Health bar
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.fillRect(pos.x - size/2, pos.y - size * 1.6, size, 3);
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(pos.x - size/2, pos.y - size * 1.6, size * (enemy.health / 100), 3);
          
          ctx.globalAlpha = 1;
        }
      });

      // Bullets
      game.bullets.forEach(bullet => {
        const pos = worldToScreen(game, canvas, bullet.x, bullet.y, bullet.z);
        if (pos && pos.scale > 0) {
          ctx.fillStyle = bullet.fromPlayer ? '#00ffff' : '#ff0000';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3 * pos.scale, 0, Math.PI * 2);
          ctx.fill();
          
          // Tracer
          ctx.strokeStyle = bullet.fromPlayer ? 'rgba(0, 255, 255, 0.3)' : 'rgba(255, 0, 0, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x - bullet.vx * 20, pos.y - bullet.vy * 20);
          ctx.stroke();
        }
      });

      // Particles
      game.particles.forEach(p => {
        const pos = worldToScreen(game, canvas, p.x, p.y, p.z);
        if (pos && pos.scale > 0) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2 * pos.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      // Crosshair
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - 10, centerY);
      ctx.lineTo(centerX - 3, centerY);
      ctx.moveTo(centerX + 3, centerY);
      ctx.lineTo(centerX + 10, centerY);
      ctx.moveTo(centerX, centerY - 10);
      ctx.lineTo(centerX, centerY - 3);
      ctx.moveTo(centerX, centerY + 3);
      ctx.lineTo(centerX, centerY + 10);
      ctx.stroke();
      
      ctx.strokeStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.stroke();

      // Time slow effect
      if (game.timeSlowActive) {
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.3)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, 50 + i * 30 + (game.frameCount % 30), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const worldToScreen = (game, canvas, wx, wy, wz) => {
      const rx = wx - game.player.x;
      const ry = wy - game.player.y;
      const rz = wz - game.player.z;
      
      const cos = Math.cos(-game.player.angle);
      const sin = Math.sin(-game.player.angle);
      const x = rx * cos - rz * sin;
      const z = rx * sin + rz * cos;
      
      if (z < 0.1) return null;
      
      const fov = 400;
      const scale = fov / z;
      const screenX = canvas.width / 2 + x * scale;
      const screenY = canvas.height / 2 - (ry - game.player.pitch) * scale;
      
      return { x: screenX, y: screenY, scale };
    };

    const handleMouseMove = (e) => {
      if (gameState !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const deltaX = e.clientX - rect.width / 2 - rect.left;
      const deltaY = e.clientY - rect.height / 2 - rect.top;
      
      gameRef.current.player.angle += deltaX * 0.003;
      gameRef.current.player.pitch = Math.max(-1, Math.min(1, gameRef.current.player.pitch + deltaY * 0.002));
    };

    const handleClick = (e) => {
      if (gameState === 'playing') {
        const game = gameRef.current;
        game.bullets.push(createBullet(
          game.player.x,
          game.player.y,
          game.player.z,
          game.player.angle,
          game.player.pitch,
          true
        ));
      }
    };

    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key] = true;
      
      if (gameState === 'playing') {
        // Time slow (SHIFT)
        if (e.key === 'Shift' && timeEnergy > 20) {
          gameRef.current.timeSlowActive = true;
          setActiveAbility('timeslow');
        }
        
        // Teleport (E)
        if ((e.key === 'e' || e.key === 'E') && gameRef.current.teleportCooldown <= 0) {
          const game = gameRef.current;
          game.player.x += Math.sin(game.player.angle) * 5;
          game.player.z += Math.cos(game.player.angle) * 5;
          game.teleportCooldown = 180;
          setActiveAbility('teleport');
          setTimeout(() => setActiveAbility(null), 500);
          
          for (let i = 0; i < 20; i++) {
            game.particles.push(createParticle(game.player.x, 0, game.player.z, '#00ffff'));
          }
        }
        
        // Wallhack (Q)
        if ((e.key === 'q' || e.key === 'Q')) {
          gameRef.current.wallhackActive = 180;
          setActiveAbility('wallhack');
          setTimeout(() => setActiveAbility(null), 500);
        }
      }
    };

    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false;
      if (e.key === 'Shift') {
        gameRef.current.timeSlowActive = false;
        setActiveAbility(null);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    if (gameState === 'playing') {
      canvas.requestPointerLock();
      gameLoop();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationId) cancelAnimationFrame(animationId);
      document.exitPointerLock();
    };
  }, [gameState, timeEnergy, health]);

  const startGame = () => {
    gameRef.current = {
      player: { x: 0, y: 0, z: 0, angle: 0, pitch: 0, vx: 0, vz: 0, health: 100 },
      enemies: [],
      bullets: [],
      particles: [],
      timeSlowActive: false,
      teleportCooldown: 0,
      wallhackActive: false,
      keys: {},
      frameCount: 0,
      lastEnemySpawn: 0
    };
    setScore(0);
    setHealth(100);
    setTimeEnergy(100);
    setKills(0);
    setGameState('playing');
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full cursor-none"
      />
      
      {gameState !== 'playing' && (
        <div className="relative z-10 text-center text-white p-8 bg-black bg-opacity-80 rounded-3xl border-2 border-cyan-500 shadow-2xl max-w-2xl">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            CHRONOSHIFT FPS
          </h1>
          <p className="text-xl mb-6 text-cyan-300">
            {gameState === 'menu' ? 'FPS avec manipulation du temps' : 'Partie terminée !'}
          </p>
          
          {gameState === 'gameover' && (
            <div className="mb-6 space-y-2">
              <p className="text-3xl font-bold text-yellow-400">Score: {score}</p>
              <p className="text-xl text-cyan-300">Éliminations: {kills}</p>
            </div>
          )}
          
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-4 px-12 rounded-full text-xl transition-all transform hover:scale-110 shadow-lg flex items-center gap-3 mx-auto mb-6"
          >
            <Play size={24} />
            {gameState === 'menu' ? 'JOUER' : 'REJOUER'}
          </button>
          
          <div className="text-left text-sm text-cyan-300 space-y-2 bg-black bg-opacity-40 p-4 rounded-lg">
            <p className="text-lg font-bold text-cyan-400 mb-2">🎮 MÉCANIQUES UNIQUES :</p>
            <p>⏱️ <span className="text-white font-bold">SHIFT</span> - Ralentissement du temps (drainage d'énergie)</p>
            <p>⚡ <span className="text-white font-bold">E</span> - Téléportation instantanée (cooldown)</p>
            <p>👁️ <span className="text-white font-bold">Q</span> - Vision à travers les murs</p>
            <p className="mt-3 text-cyan-400">🎯 <span className="text-white font-bold">WASD</span> - Déplacement | <span className="text-white font-bold">SOURIS</span> - Viser | <span className="text-white font-bold">CLIC</span> - Tirer</p>
          </div>
        </div>
      )}
      
      {gameState === 'playing' && (
        <>
          <div className="absolute top-4 left-4 z-10 space-y-2">
            <div className="bg-black bg-opacity-70 px-4 py-2 rounded-lg border border-cyan-500">
              <p className="text-cyan-400 text-sm">Score: <span className="text-white font-bold text-lg">{score}</span></p>
            </div>
            <div className="bg-black bg-opacity-70 px-4 py-2 rounded-lg border border-green-500">
              <p className="text-green-400 text-sm">Kills: <span className="text-white font-bold text-lg">{kills}</span></p>
            </div>
            <div className="bg-black bg-opacity-70 px-4 py-2 rounded-lg border border-red-500">
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-sm">HP</span>
                <div className="w-32 h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all"
                    style={{ width: `${health}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="bg-black bg-opacity-70 px-4 py-2 rounded-lg border border-purple-500">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-purple-400" />
                <div className="w-32 h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 transition-all"
                    style={{ width: `${timeEnergy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-4 right-4 z-10 space-y-2">
            <div className={`bg-black bg-opacity-70 px-4 py-2 rounded-lg border ${activeAbility === 'timeslow' ? 'border-purple-500 shadow-lg shadow-purple-500' : 'border-gray-600'}`}>
              <p className="text-purple-400 text-xs">SHIFT - Time Slow</p>
            </div>
            <div className={`bg-black bg-opacity-70 px-4 py-2 rounded-lg border ${activeAbility === 'teleport' ? 'border-cyan-500 shadow-lg shadow-cyan-500' : 'border-gray-600'}`}>
              <p className="text-cyan-400 text-xs">E - Teleport</p>
            </div>
            <div className={`bg-black bg-opacity-70 px-4 py-2 rounded-lg border ${activeAbility === 'wallhack' ? 'border-yellow-500 shadow-lg shadow-yellow-500' : 'border-gray-600'}`}>
              <p className="text-yellow-400 text-xs">Q - Wallhack</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChronoShiftFPS;
alert("as with all of my projects, i would like to remind you that God loves you, and He sent his son to die for you so that you could spend eternity with him! ❤️");
    alert("you can find me on Sololearn at https://www.sololearn.com/en/profile/20511470");
    alert("ps made with HTML, CSS, JS; repository is on GitHub, website hosted by Netlify; licensed under the MIT License");
	alert("IF THE SPACESHIP FREEZES ON THE SIDE OF THE SCREEN, PRESS THE BUTTON FOR THAT SIDE AND THEN THE OTHER");
	const canvas = document.getElementById('gameCanvas');
	const ctx = canvas.getContext('2d');
	const scoreEl = document.getElementById('score');
	const livesEl = document.getElementById('lives');
	const bestEl = document.getElementById('best');
	const restartBtn = document.getElementById('restartBtn');

	let audioCtx = null;
	function playTinkle() {
	  try {
		if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(880, audioCtx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.3);
		gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.start();
		osc.stop(audioCtx.currentTime + 0.3);
	  } catch (e) {}
	}

	const game = {
	  state: 'ready',
	  score: 0,
	  best: Number(localStorage.getItem('starDodgeBest') || 0),
	  lives: 3,
	  lastTime: 0,
	  spawnTimer: 0,
	  starTimer: 0,
	  allStarTimer: 0,
	  has100Animation: 0,
	  shieldTime: 0,
	  player: null,
	  projectiles: [],
	  stars: [],
	  allStars: [],
	  particles: []
	};

	const keys = { left: false, right: false };

	function updateHUD() {
	  scoreEl.textContent = String(game.score);
	  livesEl.textContent = String(game.lives);
	  bestEl.textContent = String(game.best);
	}

	function resetGame() {
	  game.score = 0;
	  game.lives = 3;
	  game.spawnTimer = 0;
	  game.starTimer = 0;
	  game.allStarTimer = 5.0;
	  game.has100Animation = 0;
	  game.shieldTime = 0;
	  game.projectiles = [];
	  game.stars = [];
	  game.allStars = [];
	  game.particles = [];
	  game.player = {
		x: canvas.width / 2,
		y: canvas.height - 52,
		width: 32,
		height: 36,
		speed: 420,
		color: '#7cf3ff'
	  };
	  updateHUD();
	  restartBtn.textContent = 'START';
	}

	function startGame() {
	  resetGame();
	  game.state = 'playing';
	  requestAnimationFrame(loop);
	}

	function endGame() {
	  game.state = 'gameover';
	  if (game.score > game.best) {
		game.best = game.score;
		localStorage.setItem('starDodgeBest', String(game.best));
	  }
	  updateHUD();
	  restartBtn.textContent = 'Play Again';
	}

	function spawnMeteor() {
  const radius = 10 + Math.random() * 18;
  const x = radius + Math.random() * (canvas.width - radius * 2);
  
  // This stops the speed multiplier from going past 1.8 (80% faster)
  const speedMultiplier = Math.min(1.5, 1 + (game.score * 0.005));
  const speed = (140 + Math.random() * 180) * speedMultiplier;
  
  game.projectiles.push({
	x,
	y: -radius,
	radius,
	speed,
	drift: (Math.random() - 0.5) * 90,
	rotation: Math.random() * Math.PI * 2
  });
}

	function spawnStar() {
	  const radius = 8 + Math.random() * 6;
	  const x = radius + Math.random() * (canvas.width - radius * 2);
	  const speed = 140 + Math.random() * 100;
	  game.stars.push({
		x,
		y: -radius,
		radius,
		speed,
		pulse: Math.random() * Math.PI * 2
	  });
	}

	function spawnAllStar() {
	  const radius = 14;
	  const x = radius + Math.random() * (canvas.width - radius * 2);
	  game.allStars.push({
		x,
		y: -radius,
		radius,
		speed: 160,
		pulse: 0
	  });
	}

	function createBurst(x, y, color, amount = 12) {
	  for (let i = 0; i < amount; i++) {
		const angle = Math.random() * Math.PI * 2;
		const velocity = 40 + Math.random() * 120;
		game.particles.push({
		  x, y,
		  radius: 2 + Math.random() * 3,
		  dx: Math.cos(angle) * velocity,
		  dy: Math.sin(angle) * velocity,
		  life: 0.8 + Math.random() * 0.6,
		  color
		});
	  }
	}

	function handleInput(dt) {
	  if (!game.player) return;
	  if (keys.left) game.player.x -= game.player.speed * dt;
	  if (keys.right) game.player.x += game.player.speed * dt;
	  game.player.x = Math.max(22, Math.min(canvas.width - 22, game.player.x));
	}

	function updateObstacles(dt) {
	  const player = game.player;
	  if (!player) return;

	  if (game.shieldTime > 0) game.shieldTime -= dt;

	  game.spawnTimer -= dt;
	  if (game.spawnTimer <= 0) {
		spawnMeteor();
		game.spawnTimer = Math.max(0.2, 1.05 - game.score * 0.015);
	  }

	  game.starTimer -= dt;
	  if (game.starTimer <= 0) {
		spawnStar();
		game.starTimer = 1.4 + Math.random() * 1.3;
	  }

	  game.allStarTimer -= dt;
	  if (game.allStarTimer <= 0) {
		spawnAllStar();
		game.allStarTimer = 8 + Math.random() * 6;
	  }

	  if (game.has100Animation > 0) {
		game.has100Animation -= dt;
	  }

	  // Meteors collision
	  for (let i = game.projectiles.length - 1; i >= 0; i--) {
		const m = game.projectiles[i];
		m.y += m.speed * dt;
		m.x += m.drift * dt;
		m.rotation += dt * 2.3;

		if (m.y - m.radius > canvas.height) {
		  game.projectiles.splice(i, 1);
		  continue;
		}

		const dist = Math.hypot(m.x - player.x, m.y - (player.y + player.height * 0.5));
		if (dist < m.radius + 18) {
		  game.projectiles.splice(i, 1);
		  if (game.shieldTime <= 0) {
			game.lives -= 1;
			createBurst(m.x, m.y, '#ff6b7d', 20);
			if (game.lives <= 0) {
			  endGame();
			  return;
			}
		  } else {
			createBurst(m.x, m.y, '#7cf3ff', 15);
		  }
		  updateHUD();
		}
	  }

	  // Normal stars collision
	  for (let i = game.stars.length - 1; i >= 0; i--) {
		const s = game.stars[i];
		s.y += s.speed * dt;
		s.pulse += dt * 6;

		const dist = Math.hypot(s.x - player.x, s.y - (player.y + player.height * 0.5));
		if (dist < s.radius + 18) {
		  const oldScore = game.score;
		  game.stars.splice(i, 1);
		  game.score += 10;
		  createBurst(s.x, s.y, '#7dffb4', 14);

		  // Check if crossed 100
		  if (oldScore < 100 && game.score >= 100) {
			playTinkle();
			game.has100Animation = 2.0;
		  }

		  if (game.score > game.best) {
			game.best = game.score;
			localStorage.setItem('starDodgeBest', String(game.best));
		  }
		  updateHUD();
		} else if (s.y - s.radius > canvas.height) {
		  game.stars.splice(i, 1);
		}
	  }

	  // All-star powerup collision
	  for (let i = game.allStars.length - 1; i >= 0; i--) {
		const as = game.allStars[i];
		as.y += as.speed * dt;
		as.pulse += dt * 8;

		const dist = Math.hypot(as.x - player.x, as.y - (player.y + player.height * 0.5));
		if (dist < as.radius + 18) {
		  game.allStars.splice(i, 1);
		  game.score += 50;
		  game.shieldTime = 5.0; // 5 seconds shield
		  playTinkle();
		  createBurst(as.x, as.y, '#ffb454', 25);
		  if (game.score > game.best) {
			game.best = game.score;
			localStorage.setItem('starDodgeBest', String(game.best));
		  }
		  updateHUD();
		} else if (as.y - as.radius > canvas.height) {
		  game.allStars.splice(i, 1);
		}
	  }

	  // Particles
	  for (let i = game.particles.length - 1; i >= 0; i--) {
		const p = game.particles[i];
		p.x += p.dx * dt;
		p.y += p.dy * dt;
		p.life -= dt;
		if (p.life <= 0) game.particles.splice(i, 1);
	  }
	}

	function drawBackground() {
	  ctx.clearRect(0, 0, canvas.width, canvas.height);
	  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
	  sky.addColorStop(0, '#152852');
	  sky.addColorStop(1, '#070c18');
	  ctx.fillStyle = sky;
	  ctx.fillRect(0, 0, canvas.width, canvas.height);

	  for (let i = 0; i < 80; i++) {
		const x = ((i * 137.11) % canvas.width);
		const y = ((i * 79.37) % (canvas.height + 40)) - 20;
		const radius = 1 + (i % 3);
		ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + (i % 5) * 0.1).toFixed(2) + ')';
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fill();
	  }
	}

	function drawPlayer() {
	  const p = game.player;
	  if (!p) return;

	  ctx.save();
	  ctx.translate(p.x, p.y);

	  if (game.shieldTime > 0) {
		ctx.strokeStyle = '#ffb454';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.arc(0, 0, p.width, 0, Math.PI * 2);
		ctx.stroke();
	  }

	  ctx.fillStyle = p.color;
	  ctx.beginPath();
	  ctx.moveTo(0, -p.height / 2);
	  ctx.lineTo(p.width / 2, p.height / 2);
	  ctx.lineTo(0, p.height / 4);
	  ctx.lineTo(-p.width / 2, p.height / 2);
	  ctx.closePath();
	  ctx.fill();

	  ctx.fillStyle = '#fff';
	  ctx.fillRect(-4, -8, 8, 14);
	  ctx.restore();
	}

	function drawMeteor(m) {
	  ctx.save();
	  ctx.translate(m.x, m.y);
	  ctx.rotate(m.rotation);
	  ctx.fillStyle = '#b5bfd5';
	  ctx.beginPath();
	  ctx.moveTo(-m.radius, 0);
	  ctx.lineTo(-m.radius * 0.5, -m.radius * 1.1);
	  ctx.lineTo(m.radius * 0.4, -m.radius * 0.9);
	  ctx.lineTo(m.radius, -m.radius * 0.2);
	  ctx.lineTo(m.radius * 0.9, m.radius * 0.9);
	  ctx.lineTo(0, m.radius * 1.1);
	  ctx.lineTo(-m.radius * 0.9, m.radius * 0.7);
	  ctx.closePath();
	  ctx.fill();
	  ctx.restore();
	}

	function drawStar(s, isAllStar = false) {
	  const points = 5;
	  const outer = s.radius;
	  const inner = s.radius * 0.45;
	  ctx.save();
	  ctx.translate(s.x, s.y);
	  ctx.rotate(s.pulse * 0.4);
	  ctx.fillStyle = isAllStar ? '#4DFF97' : '#ffd76a';
	  ctx.beginPath();
	  for (let i = 0; i < points * 2; i++) {
		const angle = (Math.PI / points) * i - Math.PI / 2;
		const radius = i % 2 === 0 ? outer : inner;
		const px = Math.cos(angle) * radius;
		const py = Math.sin(angle) * radius;
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	  }
	  ctx.closePath();
	  ctx.fill();
	  ctx.restore();
	}

	function drawParticles() {
	  for (const p of game.particles) {
		ctx.fillStyle = p.color + 'dd';
		ctx.beginPath();
		ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
		ctx.fill();
	  }
	}

	function drawAnimations() {
	  if (game.has350Animation > 0) {
		ctx.save();
		ctx.font = '700 36px Arial';
		ctx.fillStyle = '#7dffb4';
		ctx.textAlign = 'center';
		ctx.shadowColor = '#7dffb4';
		ctx.shadowBlur = 15;
		ctx.fillText('⭐ 350 POINTSSSS! AWESOME! ⭐', canvas.width / 2, 120);
		ctx.restore();
	  }
	}

	function drawGameOver() {
	  ctx.fillStyle = 'rgba(4, 8, 18, 0.63)';
	  ctx.fillRect(0, 0, canvas.width, canvas.height);

	  ctx.fillStyle = '#FF4D4D';
	  ctx.textAlign = 'center';
	  ctx.font = '700 50px Helvetica';
	  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
	  ctx.font = '600 22px Arial';
	  ctx.fillStyle = '#b6caef';
	  ctx.fillText('Final Score: ' + game.score, canvas.width / 2, canvas.height / 2 + 30);
	}

	function update(dt) {
	  if (game.state !== 'playing') return;
	  handleInput(dt);
	  updateObstacles(dt);
	}

	function render() {
	  drawBackground();
	  if (game.player) drawPlayer();
	  for (const m of game.projectiles) drawMeteor(m);
	  for (const s of game.stars) drawStar(s);
	  for (const as of game.allStars) drawStar(as, true);
	  drawParticles();
	  drawAnimations();
	  if (game.state === 'gameover') drawGameOver();
	}

	function loop(timestamp) {
	  const dt = Math.min(0.035, (timestamp - game.lastTime) / 1000 || 0.016);
	  game.lastTime = timestamp;

	  update(dt);
	  render();

	  if (game.state === 'playing') {
		requestAnimationFrame(loop);
	  }
	}

	function handleKeyChange(event, isPressed) {
	  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keys.left = isPressed;
	  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keys.right = isPressed;
	}

	document.addEventListener('keydown', (event) => {
	  if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) {
		event.preventDefault();
	  }
	  handleKeyChange(event, true);
	  if (event.key === ' ' && game.state !== 'playing') {
		event.preventDefault();
		startGame();
	  }
	});

	document.addEventListener('keyup', (event) => {
	  handleKeyChange(event, false);
	});

	restartBtn.addEventListener('click', () => {
	  startGame();
	});

   
	bestEl.textContent = String(game.best);
	resetGame();
	const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

rightBtn.addEventListener('pointerdown', () => keys.right = true);
rightBtn.addEventListener('pointerup', () => keys.right = false);
rightBtn.addEventListener('pointerleave', () => keys.right = false);
rightBtn.addEventListener('pointercancel', () => keys.right = false); // Add this

leftBtn.addEventListener('pointerdown', () => keys.left = true);
leftBtn.addEventListener('pointerup', () => keys.left = false);
leftBtn.addEventListener('pointerleave', () => keys.left = false);
leftBtn.addEventListener('pointercancel', () => keys.left = false); // Add this
	render();

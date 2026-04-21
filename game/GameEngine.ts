export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vector2;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  kills: number;
  reloading: boolean;
  reloadTimer: number;
  shootCooldown: number;
  speed: number;
  damage: number;
  armor: number;
  stealth: boolean;
  grenades: number;
  jetpack: boolean;
  berserker: boolean;
}

export interface Enemy {
  id: string;
  pos: Vector2;
  health: number;
  maxHealth: number;
  type: 'normal' | 'boss';
  state: 'patrol' | 'alert' | 'chase' | 'shoot';
  target: Vector2 | null;
  lastShot: number;
  speed: number;
  damage: number;
  patrolPoints: Vector2[];
  currentPatrolIndex: number;
}

export interface Bullet {
  id: string;
  pos: Vector2;
  dir: Vector2;
  owner: 'player' | 'enemy';
  damage: number;
  life: number;
}

export interface Particle {
  id: string;
  pos: Vector2;
  vel: Vector2;
  life: number;
  color: string;
  size: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  score: number;
  timeLeft: number;
  gameActive: boolean;
  missionComplete: boolean;
  missionFailed: boolean;
  bossSpawned: boolean;
  wave: number;
  killsForBoss: number;
  mapWidth: number;
  mapHeight: number;
  walls: Vector2[];
  mapType: string;
}

export class GameEngine {
  state: GameState;
  keys: Set<string> = new Set();
  mousePos: Vector2 = { x: 0, y: 0 };
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  animationId: number | null = null;
  onGameEnd: ((result: { victory: boolean; kills: number; score: number }) => void) | null = null;

  constructor(canvas: HTMLCanvasElement, mapType: string, onGameEnd: (result: any) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onGameEnd = onGameEnd;

    this.state = {
      player: {
        pos: { x: canvas.width / 2, y: canvas.height / 2 },
        health: 100,
        maxHealth: 100,
        ammo: 30,
        maxAmmo: 30,
        kills: 0,
        reloading: false,
        reloadTimer: 0,
        shootCooldown: 0,
        speed: 5,
        damage: 25,
        armor: 0,
        stealth: false,
        grenades: 0,
        jetpack: false,
        berserker: false,
      },
      enemies: [],
      bullets: [],
      particles: [],
      score: 0,
      timeLeft: 120,
      gameActive: true,
      missionComplete: false,
      missionFailed: false,
      bossSpawned: false,
      wave: 1,
      killsForBoss: 10,
      mapWidth: canvas.width,
      mapHeight: canvas.height,
      walls: this.generateWalls(mapType),
      mapType: mapType,
    };

    this.initEnemies();
    this.initControls();
    this.gameLoop = this.gameLoop.bind(this);
  }

  generateWalls(mapType: string): Vector2[] {
    const walls: Vector2[] = [];
    for (let i = 0; i < this.state.mapWidth; i += 50) {
      walls.push({ x: i, y: 0 });
      walls.push({ x: i, y: this.state.mapHeight - 50 });
    }
    for (let i = 0; i < this.state.mapHeight; i += 50) {
      walls.push({ x: 0, y: i });
      walls.push({ x: this.state.mapWidth - 50, y: i });
    }
    const obstacleCount = { industrial: 15, neon_city: 20, nexus_hq: 12, warzone: 25 }[mapType] || 10;
    for (let i = 0; i < obstacleCount; i++) {
      walls.push({
        x: 100 + Math.random() * (this.state.mapWidth - 200),
        y: 100 + Math.random() * (this.state.mapHeight - 200),
      });
    }
    return walls;
  }

  initEnemies() {
    const enemyCount = 5 + this.state.wave;
    for (let i = 0; i < enemyCount; i++) {
      this.spawnEnemy();
    }
  }

  spawnEnemy() {
    let pos: Vector2;
    do {
      pos = {
        x: 50 + Math.random() * (this.state.mapWidth - 100),
        y: 50 + Math.random() * (this.state.mapHeight - 100),
      };
    } while (Math.hypot(pos.x - this.state.player.pos.x, pos.y - this.state.player.pos.y) < 100);

    this.state.enemies.push({
      id: Math.random().toString(36).substr(2, 9),
      pos: pos,
      health: 50,
      maxHealth: 50,
      type: 'normal',
      state: 'patrol',
      target: null,
      lastShot: 0,
      speed: 2,
      damage: 10,
      patrolPoints: [
        { x: pos.x + (Math.random() - 0.5) * 200, y: pos.y + (Math.random() - 0.5) * 200 },
        { x: pos.x + (Math.random() - 0.5) * 200, y: pos.y + (Math.random() - 0.5) * 200 },
      ],
      currentPatrolIndex: 0,
    });
  }

  initControls() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'r') this.reload();
      if (e.key === 'g' && this.state.player.grenades > 0) this.throwGrenade();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mousePos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    });
    this.canvas.addEventListener('click', () => this.shoot());
  }

  reload() {
    if (!this.state.player.reloading && this.state.player.ammo < this.state.player.maxAmmo) {
      this.state.player.reloading = true;
      this.state.player.reloadTimer = 60;
    }
  }

  shoot() {
    if (!this.state.gameActive) return;
    if (this.state.player.reloading) return;
    if (this.state.player.shootCooldown > 0) return;
    if (this.state.player.ammo <= 0) {
      this.reload();
      return;
    }

    const dir = {
      x: this.mousePos.x - this.state.player.pos.x,
      y: this.mousePos.y - this.state.player.pos.y,
    };
    const len = Math.hypot(dir.x, dir.y);
    if (len === 0) return;
    dir.x /= len;
    dir.y /= len;

    this.state.bullets.push({
      id: Math.random().toString(36).substr(2, 9),
      pos: { x: this.state.player.pos.x, y: this.state.player.pos.y },
      dir: dir,
      owner: 'player',
      damage: this.state.player.damage,
      life: 100,
    });

    this.state.player.ammo--;
    this.state.player.shootCooldown = 10;
    this.addParticle(this.state.player.pos, '#ffaa00', 5);
  }

  throwGrenade() {
    this.state.player.grenades--;
    const dir = {
      x: this.mousePos.x - this.state.player.pos.x,
      y: this.mousePos.y - this.state.player.pos.y,
    };
    const len = Math.hypot(dir.x, dir.y);
    if (len === 0) return;
    dir.x /= len;
    dir.y /= len;

    setTimeout(() => {
      const explosionPos = {
        x: this.state.player.pos.x + dir.x * 100,
        y: this.state.player.pos.y + dir.y * 100,
      };
      this.state.enemies = this.state.enemies.filter(enemy => {
        const dist = Math.hypot(enemy.pos.x - explosionPos.x, enemy.pos.y - explosionPos.y);
        if (dist < 80) {
          this.addParticle(explosionPos, '#ff6600', 20);
          return false;
        }
        return true;
      });
      this.addParticle(explosionPos, '#ff4400', 30);
    }, 1000);
  }

  addParticle(pos: Vector2, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.state.particles.push({
        id: Math.random().toString(36).substr(2, 9),
        pos: { x: pos.x, y: pos.y },
        vel: { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 },
        life: 20,
        color: color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  updateMovement() {
    let moveX = 0, moveY = 0;
    if (this.keys.has('w')) moveY -= 1;
    if (this.keys.has('s')) moveY += 1;
    if (this.keys.has('a')) moveX -= 1;
    if (this.keys.has('d')) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;
    }

    let speed = this.state.player.speed;
    if (this.state.player.jetpack && this.keys.has('shift')) speed *= 2;

    const newX = this.state.player.pos.x + moveX * speed;
    const newY = this.state.player.pos.y + moveY * speed;

    let collides = false;
    for (const wall of this.state.walls) {
      if (Math.abs(newX - wall.x) < 30 && Math.abs(newY - wall.y) < 30) {
        collides = true;
        break;
      }
    }

    if (!collides) {
      this.state.player.pos.x = Math.min(Math.max(newX, 30), this.state.mapWidth - 30);
      this.state.player.pos.y = Math.min(Math.max(newY, 30), this.state.mapHeight - 30);
    }
  }

  updateEnemies() {
    for (const enemy of this.state.enemies) {
      const distToPlayer = Math.hypot(enemy.pos.x - this.state.player.pos.x, enemy.pos.y - this.state.player.pos.y);
      const detectionRange = this.state.player.stealth ? 200 : 300;

      if (distToPlayer < detectionRange) {
        enemy.state = 'chase';
        enemy.target = { x: this.state.player.pos.x, y: this.state.player.pos.y };
      } else if (enemy.state === 'chase') {
        enemy.state = 'patrol';
      }

      if (enemy.state === 'chase' && enemy.target) {
        const dx = enemy.target.x - enemy.pos.x;
        const dy = enemy.target.y - enemy.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          enemy.pos.x += (dx / dist) * enemy.speed;
          enemy.pos.y += (dy / dist) * enemy.speed;
        }

        if (distToPlayer < 200 && Date.now() - enemy.lastShot > 1000) {
          const dir = {
            x: this.state.player.pos.x - enemy.pos.x,
            y: this.state.player.pos.y - enemy.pos.y,
          };
          const len = Math.hypot(dir.x, dir.y);
          if (len > 0) {
            dir.x /= len;
            dir.y /= len;
            this.state.bullets.push({
              id: Math.random().toString(36).substr(2, 9),
              pos: { x: enemy.pos.x, y: enemy.pos.y },
              dir: dir,
              owner: 'enemy',
              damage: enemy.damage,
              life: 100,
            });
            enemy.lastShot = Date.now();
          }
        }
      } else if (enemy.state === 'patrol') {
        const target = enemy.patrolPoints[enemy.currentPatrolIndex];
        const dx = target.x - enemy.pos.x;
        const dy = target.y - enemy.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 10) {
          enemy.currentPatrolIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPoints.length;
        } else {
          enemy.pos.x += (dx / dist) * enemy.speed * 0.5;
          enemy.pos.y += (dy / dist) * enemy.speed * 0.5;
        }
      }
    }
  }

  updateBullets() {
    for (let i = 0; i < this.state.bullets.length; i++) {
      const bullet = this.state.bullets[i];
      bullet.pos.x += bullet.dir.x * 15;
      bullet.pos.y += bullet.dir.y * 15;
      bullet.life--;

      if (bullet.life <= 0 || bullet.pos.x < 0 || bullet.pos.x > this.state.mapWidth || bullet.pos.y < 0 || bullet.pos.y > this.state.mapHeight) {
        this.state.bullets.splice(i, 1);
        i--;
        continue;
      }

      if (bullet.owner === 'player') {
        for (let j = 0; j < this.state.enemies.length; j++) {
          const enemy = this.state.enemies[j];
          if (Math.hypot(bullet.pos.x - enemy.pos.x, bullet.pos.y - enemy.pos.y) < 25) {
            enemy.health -= bullet.damage;
            this.addParticle(bullet.pos, '#ff0000', 5);
            if (enemy.health <= 0) {
              this.state.enemies.splice(j, 1);
              this.state.player.kills++;
              this.state.score += enemy.type === 'boss' ? 100 : 10;
              this.addParticle(enemy.pos, '#ff6600', 15);
              j--;

              if (this.state.player.kills >= this.state.killsForBoss && !this.state.bossSpawned) {
                this.spawnBoss();
                this.state.bossSpawned = true;
              }
            }
            this.state.bullets.splice(i, 1);
            i--;
            break;
          }
        }
      } else {
        if (Math.hypot(bullet.pos.x - this.state.player.pos.x, bullet.pos.y - this.state.player.pos.y) < 25) {
          const damage = Math.max(1, bullet.damage - this.state.player.armor);
          this.state.player.health -= damage;
          this.addParticle(bullet.pos, '#ffffff', 8);
          this.state.bullets.splice(i, 1);
          i--;

          if (this.state.player.health <= 0) {
            this.state.gameActive = false;
            this.state.missionFailed = true;
            this.onGameEnd?.({ victory: false, kills: this.state.player.kills, score: this.state.score });
          }
        }
      }
    }
  }

  spawnBoss() {
    const boss: Enemy = {
      id: Math.random().toString(36).substr(2, 9),
      pos: { x: this.state.mapWidth / 2, y: this.state.mapHeight / 2 },
      health: 200,
      maxHealth: 200,
      type: 'boss',
      state: 'chase',
      target: null,
      lastShot: 0,
      speed: 1.5,
      damage: 20,
      patrolPoints: [],
      currentPatrolIndex: 0,
    };
    this.state.enemies.push(boss);
  }

  updateParticles() {
    for (let i = 0; i < this.state.particles.length; i++) {
      this.state.particles[i].pos.x += this.state.particles[i].vel.x;
      this.state.particles[i].pos.y += this.state.particles[i].vel.y;
      this.state.particles[i].life--;
      if (this.state.particles[i].life <= 0) {
        this.state.particles.splice(i, 1);
        i--;
      }
    }
  }

  updateCooldowns() {
    if (this.state.player.shootCooldown > 0) this.state.player.shootCooldown--;
    if (this.state.player.reloading) {
      this.state.player.reloadTimer--;
      if (this.state.player.reloadTimer <= 0) {
        this.state.player.reloading = false;
        this.state.player.ammo = this.state.player.maxAmmo;
      }
    }
  }

  updateTime() {
    if (this.state.gameActive && this.state.timeLeft > 0) {
      this.state.timeLeft -= 1 / 60;
      if (this.state.timeLeft <= 0) {
        this.state.gameActive = false;
        this.state.missionComplete = true;
        this.onGameEnd?.({ victory: true, kills: this.state.player.kills, score: this.state.score });
      }
    }
  }

  drawMap() {
    const gradients: Record<string, CanvasGradient> = {
      industrial: this.ctx.createLinearGradient(0, 0, this.state.mapWidth, this.state.mapHeight),
      neon_city: this.ctx.createLinearGradient(0, 0, this.state.mapWidth, this.state.mapHeight),
      nexus_hq: this.ctx.createLinearGradient(0, 0, this.state.mapWidth, this.state.mapHeight),
      warzone: this.ctx.createLinearGradient(0, 0, this.state.mapWidth, this.state.mapHeight),
    };
    gradients.industrial.addColorStop(0, '#1a1a2e'); gradients.industrial.addColorStop(1, '#16213e');
    gradients.neon_city.addColorStop(0, '#0f0c29'); gradients.neon_city.addColorStop(1, '#302b63');
    gradients.nexus_hq.addColorStop(0, '#0a0a0f'); gradients.nexus_hq.addColorStop(1, '#1f1f2a');
    gradients.warzone.addColorStop(0, '#2c1810'); gradients.warzone.addColorStop(1, '#3d2b1f');

    this.ctx.fillStyle = gradients[this.state.mapType] || gradients.industrial;
    this.ctx.fillRect(0, 0, this.state.mapWidth, this.state.mapHeight);

    for (const wall of this.state.walls) {
      this.ctx.fillStyle = 'rgba(80, 80, 100, 0.7)';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#000';
      this.ctx.fillRect(wall.x, wall.y, 50, 50);
    }
    this.ctx.shadowBlur = 0;
  }

  drawPlayer() {
    this.ctx.save();
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#ff4444';
    this.ctx.fillStyle = '#33ccff';
    this.ctx.beginPath();
    this.ctx.arc(this.state.player.pos.x, this.state.player.pos.y, 20, 0, Math.PI * 2);
    this.ctx.fill();

    const angle = Math.atan2(this.mousePos.y - this.state.player.pos.y, this.mousePos.x - this.state.player.pos.x);
    const tipX = this.state.player.pos.x + Math.cos(angle) * 25;
    const tipY = this.state.player.pos.y + Math.sin(angle) * 25;
    this.ctx.beginPath();
    this.ctx.moveTo(tipX, tipY);
    this.ctx.lineTo(tipX - 8, tipY - 5);
    this.ctx.lineTo(tipX - 8, tipY + 5);
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.fill();

    const healthPercent = this.state.player.health / this.state.player.maxHealth;
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(this.state.player.pos.x - 30, this.state.player.pos.y - 30, 60, 8);
    this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
    this.ctx.fillRect(this.state.player.pos.x - 30, this.state.player.pos.y - 30, 60 * healthPercent, 8);
    this.ctx.restore();
  }

  drawEnemies() {
    for (const enemy of this.state.enemies) {
      this.ctx.save();
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#ff0000';
      const color = enemy.type === 'boss' ? '#ff4444' : '#cc3333';
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(enemy.pos.x, enemy.pos.y, 18, 0, Math.PI * 2);
      this.ctx.fill();

      const healthPercent = enemy.health / enemy.maxHealth;
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(enemy.pos.x - 25, enemy.pos.y - 25, 50, 6);
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fillRect(enemy.pos.x - 25, enemy.pos.y - 25, 50 * healthPercent, 6);

      if (enemy.type === 'boss') {
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText('BOSS', enemy.pos.x - 15, enemy.pos.y - 30);
      }
      this.ctx.restore();
    }
  }

  drawBullets() {
    for (const bullet of this.state.bullets) {
      this.ctx.fillStyle = bullet.owner === 'player' ? '#ffff00' : '#ff6600';
      this.ctx.beginPath();
      this.ctx.arc(bullet.pos.x, bullet.pos.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawParticles() {
    for (const particle of this.state.particles) {
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.pos.x, particle.pos.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawHUD() {
    this.ctx.font = 'bold 18px monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(`❤️ ${this.state.player.health}`, 20, 40);
    this.ctx.fillText(`🔫 ${this.state.player.ammo}/${this.state.player.maxAmmo}`, 20, 70);
    this.ctx.fillText(`💀 ${this.state.player.kills}`, 20, 100);
    this.ctx.fillText(`⭐ ${this.state.score}`, 20, 130);
    this.ctx.fillText(`⏱️ ${Math.floor(this.state.timeLeft)}`, 20, 160);

    if (this.state.player.reloading) {
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.fillText('RELOADING...', this.state.mapWidth - 150, 40);
    }
  }

  drawMinimap() {
    const size = 150;
    const x = this.state.mapWidth - size - 10;
    const y = 10;
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(x, y, size, size);
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(x, y, size, size);

    const scale = size / this.state.mapWidth;
    this.ctx.fillStyle = '#33ccff';
    this.ctx.beginPath();
    this.ctx.arc(x + this.state.player.pos.x * scale, y + this.state.player.pos.y * scale, 4, 0, Math.PI*2);
    this.ctx.fill();

    for (const enemy of this.state.enemies) {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.arc(x + enemy.pos.x * scale, y + enemy.pos.y * scale, 3, 0, Math.PI*2);
      this.ctx.fill();
    }
  }

  gameLoop() {
    if (!this.state.gameActive && (this.state.missionComplete || this.state.missionFailed)) return;
    this.updateMovement();
    this.updateEnemies();
    this.updateBullets();
    this.updateParticles();
    this.updateCooldowns();
    this.updateTime();
    this.drawMap();
    this.drawEnemies();
    this.drawBullets();
    this.drawParticles();
    this.drawPlayer();
    this.drawHUD();
    this.drawMinimap();
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  start() {
    this.gameLoop();
  }

  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  applySkills(skills: any[]) {
    for (const skill of skills) {
      switch(skill.name) {
        case 'Rapid Fire': this.state.player.shootCooldown = 5; break;
        case 'Armor': this.state.player.armor = 15; break;
        case 'Stealth': this.state.player.stealth = true; break;
        case 'Grenades': this.state.player.grenades = 3; break;
        case 'Medkit': this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + 50); break;
        case 'Jetpack': this.state.player.jetpack = true; break;
        case 'Sniper': this.state.player.damage = 50; break;
        case 'Berserker': this.state.player.damage = 40; this.state.player.speed = 6; break;
      }
    }
  }
}

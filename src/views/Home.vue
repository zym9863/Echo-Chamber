<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">回音室</h1>
        <p class="hero-subtitle">让时间沉淀情感，让心声找到归宿</p>
        <p class="hero-description">
          在这个忙碌的世界里，我们常常忘记倾听内心的声音。<br>
          回音室为你提供一个安全的空间，记录心情，寄给未来的自己。
        </p>
      </div>
    </div>

    <div class="features-section">
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon size="48">
              <Message />
            </el-icon>
          </div>
          <h2>时光慢递</h2>
          <p>将当下的心情、想对未来说的话封存起来，设定一个特定的日期才能开启。让时间来沉淀和疗愈你的情绪。</p>
          <el-button type="primary" @click="$router.push('/timemail')" size="large">
            开始写信
          </el-button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <el-icon size="48">
              <PieChart />
            </el-icon>
          </div>
          <h2>情绪拼图</h2>
          <p>通过颜色、意象卡片记录每天的情绪，系统会将这些碎片拼接成独特的情绪图谱，帮你更好地了解自己。</p>
          <el-button type="primary" @click="$router.push('/mood')" size="large">
            记录情绪
          </el-button>
        </div>
      </div>
    </div>

    <div class="stats-section" v-if="stats">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ stats.totalMails }}</div>
          <div class="stat-label">时光慢递</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.totalMoods }}</div>
          <div class="stat-label">情绪记录</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ stats.openableMails }}</div>
          <div class="stat-label">可开启信件</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Message, PieChart } from '@element-plus/icons-vue'
import { TimeMailService, MoodService } from '@/services/database'

interface Stats {
  totalMails: number
  totalMoods: number
  openableMails: number
}

const stats = ref<Stats | null>(null)

const loadStats = async () => {
  try {
    const [timeMails, moodRecords, openableMails] = await Promise.all([
      TimeMailService.getAllTimeMails(),
      MoodService.getAllMoodRecords(),
      TimeMailService.getOpenableTimeMails()
    ])

    stats.value = {
      totalMails: timeMails.length,
      totalMoods: moodRecords.length,
      openableMails: openableMails.length
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero-section {
  text-align: center;
  padding: 6rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 4rem;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.hero-content {
  max-width: 700px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1.5rem;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.75rem;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 2rem;
  font-weight: 300;
  letter-spacing: 0.01em;
}

.hero-description {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
  max-width: 500px;
  margin: 0 auto;
}

.features-section {
  margin-bottom: 5rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 3rem;
  margin-top: 3rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 3.5rem 2.5rem;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  color: #667eea;
  margin-bottom: 2rem;
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-icon {
  transform: scale(1.1);
}

.feature-card h2 {
  font-size: 2rem;
  color: #1a202c;
  margin-bottom: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.feature-card p {
  color: #4a5568;
  line-height: 1.8;
  margin-bottom: 2.5rem;
  font-size: 1.1rem;
  font-weight: 400;
}

.stats-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem 2rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem;
  text-align: center;
}

.stat-item {
  color: white;
  padding: 1.5rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #ffffff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.4rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .feature-card {
    padding: 2rem 1.5rem;
  }
}
</style>
<template>
  <div class="mood-container">
    <div class="header-section">
      <h1>情绪拼图</h1>
      <p>用颜色和意象记录心情，拼凑出属于你的情绪图谱</p>
    </div>

    <div class="content-section">
      <el-tabs v-model="activeTab" class="mood-tabs">
        <el-tab-pane label="今日情绪" name="today">
          <div class="today-mood">
            <div class="mood-record-card">
              <h2>记录今天的心情</h2>
              <p class="date-display">{{ formatDate(today) }}</p>
              
              <div v-if="todayMood" class="existing-mood">
                <div class="mood-display">
                  <div class="color-circle" :style="{ backgroundColor: todayMood.color }"></div>
                  <div class="mood-info">
                    <h3>{{ todayMood.emotion }}</h3>
                    <p>情绪强度: {{ todayMood.intensity }}/10</p>
                    <p v-if="todayMood.note">备注: {{ todayMood.note }}</p>
                  </div>
                </div>
                <el-button @click="editTodayMood" type="primary">修改今日情绪</el-button>
              </div>
              
              <div v-else class="mood-form">
                <el-form :model="moodForm" label-width="100px">
                  <el-form-item label="选择颜色">
                    <div class="color-palette">
                      <div v-for="color in moodColors" :key="color.id" 
                           class="color-option" 
                           :class="{ active: moodForm.color === color.color }"
                           :style="{ backgroundColor: color.color }"
                           @click="selectColor(color)"
                           :title="color.name">
                      </div>
                    </div>
                  </el-form-item>
                  
                  <el-form-item label="情绪卡片">
                    <div class="emotion-cards">
                      <div v-for="card in emotionCards" :key="card.id"
                           class="emotion-card"
                           :class="{ active: moodForm.imageCard === card.id }"
                           @click="selectEmotionCard(card)">
                        <div class="card-icon">{{ card.imageUrl }}</div>
                        <div class="card-name">{{ card.name }}</div>
                      </div>
                    </div>
                  </el-form-item>
                  
                  <el-form-item label="情绪强度">
                    <el-slider v-model="moodForm.intensity" :min="1" :max="10" 
                             show-stops :marks="intensityMarks" />
                  </el-form-item>
                  
                  <el-form-item label="心情备注">
                    <el-input v-model="moodForm.note" type="textarea" 
                             placeholder="今天发生了什么特别的事情吗？" 
                             :rows="3" />
                  </el-form-item>
                  
                  <el-form-item>
                    <el-button type="primary" @click="saveMood" :loading="saving">
                      保存今日情绪
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="情绪历史" name="history">
          <div class="mood-history">
            <div class="history-controls">
              <el-date-picker v-model="dateRange" type="monthrange" 
                             placeholder="选择月份范围" 
                             @change="loadMoodHistory" />
            </div>
            
            <div class="mood-calendar">
              <div v-if="moodHistory.length === 0" class="empty-state">
                <el-empty description="选择日期范围查看情绪记录" />
              </div>
              <div v-else class="history-grid">
                <div v-for="record in moodHistory" :key="record.id" 
                     class="history-item">
                  <div class="history-date">{{ formatShortDate(record.date) }}</div>
                  <div class="history-mood">
                    <div class="color-circle small" :style="{ backgroundColor: record.color }"></div>
                    <span class="emotion-name">{{ record.emotion }}</span>
                    <div class="intensity-bar">
                      <div class="intensity-fill" 
                           :style="{ width: (record.intensity / 10) * 100 + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="情绪拼图" name="jigsaw">
          <div class="mood-jigsaw">
            <div class="jigsaw-controls">
              <el-select v-model="jigsawPeriod" @change="generateJigsaw" placeholder="选择时间段">
                <el-option label="最近7天" value="7" />
                <el-option label="最近30天" value="30" />
                <el-option label="最近90天" value="90" />
              </el-select>
            </div>
            
            <div class="jigsaw-canvas">
              <div v-if="jigsawData.length === 0" class="empty-state">
                <el-empty description="暂无足够数据生成情绪拼图" />
              </div>
              <div v-else class="jigsaw-grid">
                <!-- 简单的网格拼图展示 -->
                <div v-for="(piece, index) in jigsawData" :key="index" 
                     class="jigsaw-piece" 
                     :style="{ backgroundColor: piece.color }"
                     :title="`${piece.date}: ${piece.emotion}`">
                </div>
              </div>
            </div>
            
            <div v-if="statistics" class="statistics-panel">
              <h3>情绪统计</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-label">记录天数</div>
                  <div class="stat-value">{{ statistics.totalRecords }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">平均情绪强度</div>
                  <div class="stat-value">{{ statistics.avgIntensity }}/10</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">主要情绪</div>
                  <div class="stat-value">{{ getMostFrequentEmotion() }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { MoodService, ConfigService } from '@/services/database'
import type { MoodRecord, MoodColor, EmotionCard } from '@/db'
import dayjs from 'dayjs'

const activeTab = ref('today')
const today = dayjs().format('YYYY-MM-DD')
const saving = ref(false)

// 今日情绪相关
const todayMood = ref<MoodRecord | null>(null)
const moodColors = ref<MoodColor[]>([])
const emotionCards = ref<EmotionCard[]>([])

const moodForm = ref({
  color: '',
  emotion: '',
  imageCard: '',
  intensity: 5,
  note: ''
})

const intensityMarks = {
  1: '😢',
  3: '😔',
  5: '😐',
  7: '🙂',
  10: '😄'
}

// 历史记录相关
const dateRange = ref<[Date, Date] | null>(null)
const moodHistory = ref<MoodRecord[]>([])

// 拼图相关
const jigsawPeriod = ref('30')
const jigsawData = ref<MoodRecord[]>([])
const statistics = ref<any>(null)

const loadTodayMood = async () => {
  try {
    todayMood.value = await MoodService.getMoodRecordByDate(today) || null
  } catch (error) {
    console.error('加载今日情绪失败:', error)
  }
}

const loadMoodData = async () => {
  try {
    const [colors, cards] = await Promise.all([
      ConfigService.getAllMoodColors(),
      ConfigService.getAllEmotionCards()
    ])
    moodColors.value = colors
    emotionCards.value = cards
  } catch (error) {
    console.error('加载情绪数据失败:', error)
  }
}

const selectColor = (color: MoodColor) => {
  moodForm.value.color = color.color
  
  // 根据颜色类别自动推荐情绪
  const emotionMap: Record<string, string> = {
    happy: '开心',
    calm: '平静',
    sad: '难过',
    angry: '愤怒',
    excited: '兴奋',
    neutral: '平淡'
  }
  moodForm.value.emotion = emotionMap[color.category] || '未知'
}

const selectEmotionCard = (card: EmotionCard) => {
  moodForm.value.imageCard = card.id
  if (!moodForm.value.emotion) {
    moodForm.value.emotion = card.name
  }
}

const saveMood = async () => {
  if (!moodForm.value.color) {
    ElMessage.warning('请选择一个颜色')
    return
  }
  
  try {
    saving.value = true
    
    const moodData = {
      date: today,
      color: moodForm.value.color,
      emotion: moodForm.value.emotion || '未知',
      imageCard: moodForm.value.imageCard,
      intensity: moodForm.value.intensity,
      note: moodForm.value.note
    }
    
    if (todayMood.value) {
      await MoodService.updateMoodRecord(todayMood.value.id!, moodData)
    } else {
      await MoodService.addMoodRecord(moodData)
    }
    
    ElMessage.success('情绪记录保存成功！')
    await loadTodayMood()
    resetForm()
  } catch (error) {
    console.error('保存情绪失败:', error)
    ElMessage.error('保存情绪失败')
  } finally {
    saving.value = false
  }
}

const editTodayMood = () => {
  if (todayMood.value) {
    moodForm.value = {
      color: todayMood.value.color,
      emotion: todayMood.value.emotion,
      imageCard: todayMood.value.imageCard || '',
      intensity: todayMood.value.intensity,
      note: todayMood.value.note || ''
    }
    todayMood.value = null
  }
}

const resetForm = () => {
  moodForm.value = {
    color: '',
    emotion: '',
    imageCard: '',
    intensity: 5,
    note: ''
  }
}

const loadMoodHistory = async () => {
  if (!dateRange.value) return
  
  try {
    const startDate = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
    const endDate = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    moodHistory.value = await MoodService.getMoodRecordsByDateRange(startDate, endDate)
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

const generateJigsaw = async () => {
  try {
    const days = parseInt(jigsawPeriod.value)
    const stats = await MoodService.getMoodStatistics(days)
    statistics.value = stats
    jigsawData.value = stats.records
  } catch (error) {
    console.error('生成拼图失败:', error)
  }
}

const getMostFrequentEmotion = () => {
  if (!statistics.value?.emotionStats) return '无'
  
  const emotions = Object.entries(statistics.value.emotionStats)
  if (emotions.length === 0) return '无'
  
  const mostFrequent = emotions.reduce((a, b) => 
    (a[1] as number) > (b[1] as number) ? a : b
  )
  return mostFrequent[0]
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY年MM月DD日')
}

const formatShortDate = (date: string) => {
  return dayjs(date).format('MM/DD')
}

onMounted(async () => {
  await loadTodayMood()
  await loadMoodData()
  
  // 默认加载最近一个月的历史
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 1)
  dateRange.value = [startDate, endDate]
  await loadMoodHistory()
  
  // 生成默认拼图
  await generateJigsaw()
})
</script>

<style scoped>
.mood-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header-section {
  text-align: center;
  margin-bottom: 4rem;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-section h1 {
  font-size: 3rem;
  color: white;
  margin-bottom: 1rem;
  font-weight: 800;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #ffffff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-section p {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.content-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.mood-record-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.mood-record-card h2 {
  color: #1a202c;
  margin-bottom: 1rem;
  font-size: 1.8rem;
  font-weight: 700;
}

.date-display {
  color: #718096;
  margin-bottom: 2.5rem;
  font-size: 1.2rem;
  font-weight: 500;
}

.existing-mood {
  text-align: center;
}

.mood-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}

.color-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.color-circle.small {
  width: 35px;
  height: 35px;
  border: 3px solid white;
}

.mood-info h3 {
  margin: 0 0 0.75rem 0;
  color: #1a202c;
  font-size: 1.3rem;
  font-weight: 700;
}

.mood-info p {
  margin: 0.5rem 0;
  color: #4a5568;
  font-weight: 500;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(55px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
  justify-content: center;
}

.color-option {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  cursor: pointer;
  border: 4px solid transparent;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
}

.color-option:hover {
  transform: scale(1.15);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.color-option.active {
  border-color: #667eea;
  transform: scale(1.25);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.emotion-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 1.5rem;
}

.emotion-card {
  text-align: center;
  padding: 1.5rem 1rem;
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  border: 2px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.emotion-card:hover {
  background: linear-gradient(135deg, #edf2f7, #e2e8f0);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.emotion-card.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #5a67d8;
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.card-icon {
  font-size: 2.2rem;
  margin-bottom: 0.75rem;
  transition: transform 0.3s ease;
}

.emotion-card:hover .card-icon {
  transform: scale(1.1);
}

.card-name {
  font-size: 0.95rem;
  color: #4a5568;
  font-weight: 500;
  transition: color 0.3s ease;
}

.emotion-card.active .card-name {
  color: white;
}

.history-controls {
  margin-bottom: 2rem;
  text-align: center;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.history-item {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.history-date {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.history-mood {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.emotion-name {
  flex: 1;
  color: #4a5568;
}

.intensity-bar {
  width: 60px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.intensity-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #68d391);
  transition: width 0.3s ease;
}

.jigsaw-controls {
  margin-bottom: 2rem;
  text-align: center;
}

.jigsaw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(25px, 1fr));
  gap: 3px;
  max-width: 500px;
  margin: 0 auto;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.jigsaw-piece {
  aspect-ratio: 1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.jigsaw-piece:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 10;
  position: relative;
}

.statistics-panel {
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  border-radius: 20px;
  padding: 2.5rem;
  margin-top: 3rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.statistics-panel h3 {
  text-align: center;
  color: #1a202c;
  margin-bottom: 2rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.stat-label {
  color: #718096;
  font-size: 1rem;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.stat-value {
  color: #1a202c;
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: #718096;
}

.mood-history {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
}

.history-item {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.intensity-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.intensity-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .mood-container {
    padding: 1rem;
  }
  
  .header-section {
    padding: 2rem 1rem;
  }
  
  .header-section h1 {
    font-size: 2.2rem;
  }
  
  .content-section {
    padding: 1.5rem;
  }
  
  .mood-record-card {
    padding: 2rem;
  }
  
  .color-palette {
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
  }
  
  .emotion-cards {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  
  .color-option {
    width: 45px;
    height: 45px;
  }
  
  .emotion-card {
    padding: 1rem 0.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
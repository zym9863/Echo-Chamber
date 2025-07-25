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
  padding: 0 2rem;
}

.header-section {
  text-align: center;
  padding: 2rem 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  margin-bottom: 2rem;
  color: white;
}

.header-section h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.header-section p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.content-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.mood-record-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.mood-record-card h2 {
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.date-display {
  color: #718096;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.existing-mood {
  text-align: center;
}

.mood-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 10px;
}

.color-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-circle.small {
  width: 30px;
  height: 30px;
}

.mood-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
}

.mood-info p {
  margin: 0.25rem 0;
  color: #4a5568;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.color-option {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s ease;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.color-option.active {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.emotion-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
}

.emotion-card {
  text-align: center;
  padding: 1rem 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.emotion-card:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.emotion-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.card-name {
  font-size: 0.9rem;
  color: #4a5568;
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
  grid-template-columns: repeat(auto-fill, minmax(20px, 1fr));
  gap: 2px;
  max-width: 600px;
  margin: 0 auto;
}

.jigsaw-piece {
  aspect-ratio: 1;
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.jigsaw-piece:hover {
  transform: scale(1.1);
}

.statistics-panel {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 10px;
}

.statistics-panel h3 {
  text-align: center;
  color: #2d3748;
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  text-align: center;
}

.stat-item {
  padding: 1rem;
  background: white;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
}

@media (max-width: 768px) {
  .header-section h1 {
    font-size: 2rem;
  }
  
  .content-section {
    padding: 1rem;
  }
  
  .mood-record-card {
    padding: 1.5rem;
  }
  
  .color-palette {
    grid-template-columns: repeat(5, 1fr);
  }
  
  .emotion-cards {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
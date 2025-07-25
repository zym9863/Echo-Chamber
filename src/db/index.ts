import Dexie, { type Table } from 'dexie'

export interface TimeMail {
  id?: number
  title: string
  content: string
  type: 'text' | 'voice' | 'image'
  audioBlob?: Blob
  imageBlob?: Blob
  createdAt: Date
  openAt: Date
  isOpened: boolean
  tags?: string[]
}

export interface MoodRecord {
  id?: number
  date: string
  color: string
  emotion: string
  imageCard?: string
  musicFragment?: string
  note?: string
  intensity: number // 1-10 情绪强度
}

export interface MoodColor {
  id: string
  name: string
  color: string
  category: 'happy' | 'sad' | 'angry' | 'calm' | 'excited' | 'neutral'
}

export interface EmotionCard {
  id: string
  name: string
  imageUrl: string
  category: string
  description: string
}

export class EchoChamberDB extends Dexie {
  timeMails!: Table<TimeMail>
  moodRecords!: Table<MoodRecord>
  moodColors!: Table<MoodColor>
  emotionCards!: Table<EmotionCard>

  constructor() {
    super('EchoChamberDB')
    
    this.version(1).stores({
      timeMails: '++id, title, type, createdAt, openAt, isOpened',
      moodRecords: '++id, date, emotion, intensity',
      moodColors: 'id, name, category',
      emotionCards: 'id, name, category'
    })

    this.on('ready', () => {
      return this.initializeDefaults()
    })
  }

  private async initializeDefaults() {
    // 初始化默认颜色
    const colorCount = await this.moodColors.count()
    if (colorCount === 0) {
      await this.moodColors.bulkAdd([
        { id: 'happy1', name: '阳光黄', color: '#FFD700', category: 'happy' },
        { id: 'happy2', name: '活力橙', color: '#FF8C00', category: 'happy' },
        { id: 'happy3', name: '粉色温暖', color: '#FFB6C1', category: 'happy' },
        { id: 'calm1', name: '宁静蓝', color: '#87CEEB', category: 'calm' },
        { id: 'calm2', name: '薄荷绿', color: '#98FB98', category: 'calm' },
        { id: 'calm3', name: '淡紫色', color: '#DDA0DD', category: 'calm' },
        { id: 'sad1', name: '忧郁蓝', color: '#4682B4', category: 'sad' },
        { id: 'sad2', name: '雨天灰', color: '#708090', category: 'sad' },
        { id: 'sad3', name: '深海蓝', color: '#191970', category: 'sad' },
        { id: 'angry1', name: '火焰红', color: '#DC143C', category: 'angry' },
        { id: 'angry2', name: '激情橙', color: '#FF4500', category: 'angry' },
        { id: 'excited1', name: '霓虹粉', color: '#FF1493', category: 'excited' },
        { id: 'excited2', name: '电光紫', color: '#8A2BE2', category: 'excited' },
        { id: 'neutral1', name: '米白色', color: '#F5F5DC', category: 'neutral' },
        { id: 'neutral2', name: '浅灰色', color: '#D3D3D3', category: 'neutral' }
      ])
    }

    // 初始化默认情绪卡片
    const cardCount = await this.emotionCards.count()
    if (cardCount === 0) {
      await this.emotionCards.bulkAdd([
        { id: 'sun', name: '阳光', imageUrl: '☀️', category: 'happy', description: '温暖明亮的感觉' },
        { id: 'cloud', name: '云朵', imageUrl: '☁️', category: 'calm', description: '轻盈飘逸的心境' },
        { id: 'rain', name: '雨滴', imageUrl: '🌧️', category: 'sad', description: '淅淅沥沥的情绪' },
        { id: 'fire', name: '火焰', imageUrl: '🔥', category: 'angry', description: '热烈燃烧的感情' },
        { id: 'star', name: '星星', imageUrl: '⭐', category: 'excited', description: '闪闪发光的兴奋' },
        { id: 'moon', name: '月亮', imageUrl: '🌙', category: 'calm', description: '宁静如水的夜晚' },
        { id: 'flower', name: '花朵', imageUrl: '🌸', category: 'happy', description: '绽放的美好心情' },
        { id: 'tree', name: '大树', imageUrl: '🌳', category: 'neutral', description: '稳定成长的状态' },
        { id: 'wave', name: '海浪', imageUrl: '🌊', category: 'excited', description: '起伏不定的情感' },
        { id: 'mountain', name: '山峰', imageUrl: '⛰️', category: 'neutral', description: '坚定不移的意志' }
      ])
    }
  }
}

export const db = new EchoChamberDB()
import { db, type TimeMail, type MoodRecord, type MoodColor, type EmotionCard } from '../db'
import dayjs from 'dayjs'

export class TimeMailService {
  // 添加时光慢递
  static async addTimeMail(mail: Omit<TimeMail, 'id' | 'createdAt' | 'isOpened'>) {
    const newMail: Omit<TimeMail, 'id'> = {
      ...mail,
      createdAt: new Date(),
      isOpened: false
    }
    return await db.timeMails.add(newMail)
  }

  // 获取所有时光慢递
  static async getAllTimeMails(): Promise<TimeMail[]> {
    return await db.timeMails.orderBy('createdAt').reverse().toArray()
  }

  // 获取可开启的时光慢递
  static async getOpenableTimeMails(): Promise<TimeMail[]> {
    const now = new Date()
    return await db.timeMails
      .where('isOpened').equals(0)
      .and(mail => dayjs(mail.openAt).isBefore(now))
      .toArray()
  }

  // 开启时光慢递
  static async openTimeMail(id: number) {
    return await db.timeMails.update(id, { isOpened: true })
  }

  // 删除时光慢递
  static async deleteTimeMail(id: number) {
    return await db.timeMails.delete(id)
  }

  // 根据日期范围获取时光慢递
  static async getTimeMailsByDateRange(startDate: Date, endDate: Date): Promise<TimeMail[]> {
    return await db.timeMails
      .where('createdAt')
      .between(startDate, endDate)
      .toArray()
  }
}

export class MoodService {
  // 添加情绪记录
  static async addMoodRecord(record: Omit<MoodRecord, 'id'>) {
    return await db.moodRecords.add(record)
  }

  // 获取所有情绪记录
  static async getAllMoodRecords(): Promise<MoodRecord[]> {
    return await db.moodRecords.orderBy('date').reverse().toArray()
  }

  // 根据日期获取情绪记录
  static async getMoodRecordByDate(date: string): Promise<MoodRecord | undefined> {
    return await db.moodRecords.where('date').equals(date).first()
  }

  // 根据日期范围获取情绪记录
  static async getMoodRecordsByDateRange(startDate: string, endDate: string): Promise<MoodRecord[]> {
    return await db.moodRecords
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray()
  }

  // 更新情绪记录
  static async updateMoodRecord(id: number, updates: Partial<MoodRecord>) {
    return await db.moodRecords.update(id, updates)
  }

  // 删除情绪记录
  static async deleteMoodRecord(id: number) {
    return await db.moodRecords.delete(id)
  }

  // 获取情绪统计
  static async getMoodStatistics(days: number = 30) {
    const endDate = dayjs().format('YYYY-MM-DD')
    const startDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD')
    
    const records = await this.getMoodRecordsByDateRange(startDate, endDate)
    
    // 按情绪分类统计
    const emotionStats = records.reduce((acc, record) => {
      acc[record.emotion] = (acc[record.emotion] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 按颜色分类统计
    const colorStats = records.reduce((acc, record) => {
      acc[record.color] = (acc[record.color] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 平均情绪强度
    const avgIntensity = records.length > 0 
      ? records.reduce((sum, record) => sum + record.intensity, 0) / records.length 
      : 0

    return {
      totalRecords: records.length,
      emotionStats,
      colorStats,
      avgIntensity: Math.round(avgIntensity * 100) / 100,
      records
    }
  }
}

export class ConfigService {
  // 获取所有情绪颜色
  static async getAllMoodColors(): Promise<MoodColor[]> {
    return await db.moodColors.toArray()
  }

  // 根据分类获取情绪颜色
  static async getMoodColorsByCategory(category: MoodColor['category']): Promise<MoodColor[]> {
    return await db.moodColors.where('category').equals(category).toArray()
  }

  // 获取所有情绪卡片
  static async getAllEmotionCards(): Promise<EmotionCard[]> {
    return await db.emotionCards.toArray()
  }

  // 根据分类获取情绪卡片
  static async getEmotionCardsByCategory(category: string): Promise<EmotionCard[]> {
    return await db.emotionCards.where('category').equals(category).toArray()
  }
}
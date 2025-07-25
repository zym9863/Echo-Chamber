import { defineStore } from 'pinia'
import { ref } from 'vue'
import dayjs from 'dayjs'

export interface TimeMail {
  id: string
  title: string
  content: string
  type: 'text' | 'voice' | 'image'
  audioUrl?: string
  imageUrl?: string
  createdAt: Date
  openAt: Date
  isOpened: boolean
}

export interface MoodRecord {
  id: string
  date: string
  color: string
  emotion: string
  imageCard?: string
  musicFragment?: string
  note?: string
}

export const useMainStore = defineStore('main', () => {
  // 时光慢递相关状态
  const timeMails = ref<TimeMail[]>([])
  
  // 情绪拼图相关状态
  const moodRecords = ref<MoodRecord[]>([])
  
  // 时光慢递操作
  const addTimeMail = (mail: Omit<TimeMail, 'id' | 'createdAt' | 'isOpened'>) => {
    const newMail: TimeMail = {
      ...mail,
      id: Date.now().toString(),
      createdAt: new Date(),
      isOpened: false
    }
    timeMails.value.push(newMail)
  }
  
  const openTimeMail = (id: string) => {
    const mail = timeMails.value.find(m => m.id === id)
    if (mail && dayjs().isAfter(mail.openAt)) {
      mail.isOpened = true
    }
  }
  
  const getOpenableTimeMails = () => {
    return timeMails.value.filter(mail => 
      !mail.isOpened && dayjs().isAfter(mail.openAt)
    )
  }
  
  // 情绪拼图操作
  const addMoodRecord = (record: Omit<MoodRecord, 'id'>) => {
    const newRecord: MoodRecord = {
      ...record,
      id: Date.now().toString()
    }
    moodRecords.value.push(newRecord)
  }
  
  const getMoodRecordsByDateRange = (startDate: string, endDate: string) => {
    return moodRecords.value.filter(record => 
      dayjs(record.date).isAfter(startDate) && dayjs(record.date).isBefore(endDate)
    )
  }
  
  return {
    timeMails,
    moodRecords,
    addTimeMail,
    openTimeMail,
    getOpenableTimeMails,
    addMoodRecord,
    getMoodRecordsByDateRange
  }
})
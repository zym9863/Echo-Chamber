<template>
  <div class="timemail-container">
    <div class="header-section">
      <h1>时光慢递</h1>
      <p>将心情封存在时间里，等待未来的开启</p>
      <el-button type="primary" size="large" @click="showCreateDialog = true">
        <el-icon><Edit /></el-icon>
        写一封信
      </el-button>
    </div>

    <div class="content-section">
      <el-tabs v-model="activeTab" class="mail-tabs">
        <el-tab-pane label="所有信件" name="all">
          <div class="mail-list">
            <div v-if="timeMails.length === 0" class="empty-state">
              <el-empty description="还没有任何信件，开始写第一封吧！" />
            </div>
            <div v-else class="mail-grid">
              <div v-for="mail in timeMails" :key="mail.id" class="mail-card" 
                   :class="{ 'openable': isOpenable(mail), 'opened': mail.isOpened }">
                <div class="mail-header">
                  <h3>{{ mail.title }}</h3>
                  <el-tag :type="getMailStatus(mail).type" size="small">
                    {{ getMailStatus(mail).text }}
                  </el-tag>
                </div>
                <div class="mail-meta">
                  <div class="mail-date">
                    <span>创建时间：{{ formatDate(mail.createdAt) }}</span>
                  </div>
                  <div class="mail-open-date">
                    <span>开启时间：{{ formatDate(mail.openAt) }}</span>
                  </div>
                </div>
                <div class="mail-preview">
                  <p v-if="mail.isOpened || isOpenable(mail)">{{ getPreview(mail.content) }}</p>
                  <p v-else class="sealed">这封信还在时间的封印中...</p>
                </div>
                <div class="mail-actions">
                  <el-button v-if="isOpenable(mail) && !mail.isOpened" 
                           type="primary" @click="openMail(mail)">
                    开启信件
                  </el-button>
                  <el-button v-if="mail.isOpened" @click="viewMail(mail)">
                    查看详情
                  </el-button>
                  <el-popconfirm title="确定要删除这封信吗？删除后无法恢复。" 
                               @confirm="deleteMail(mail.id!)">
                    <template #reference>
                      <el-button type="danger" text>删除</el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="可开启" name="openable">
          <div class="mail-list">
            <div v-if="openableMails.length === 0" class="empty-state">
              <el-empty description="暂时没有可以开启的信件" />
            </div>
            <div v-else class="mail-grid">
              <div v-for="mail in openableMails" :key="mail.id" class="mail-card openable">
                <div class="mail-header">
                  <h3>{{ mail.title }}</h3>
                  <el-tag type="success" size="small">可开启</el-tag>
                </div>
                <div class="mail-meta">
                  <div class="mail-date">
                    <span>创建时间：{{ formatDate(mail.createdAt) }}</span>
                  </div>
                </div>
                <div class="mail-actions">
                  <el-button type="primary" @click="openMail(mail)">
                    开启信件
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 创建信件对话框 -->
    <el-dialog v-model="showCreateDialog" title="写一封给未来的信" width="600px" @close="resetForm">
      <el-form :model="newMail" label-width="80px" :rules="formRules" ref="formRef">
        <el-form-item label="信件标题" prop="title">
          <el-input v-model="newMail.title" placeholder="给这封信起个标题..." />
        </el-form-item>
        
        <el-form-item label="内容类型" prop="type">
          <el-radio-group v-model="newMail.type">
            <el-radio label="text">文字</el-radio>
            <el-radio label="voice" disabled>语音（开发中）</el-radio>
            <el-radio label="image" disabled>图片（开发中）</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="信件内容" prop="content">
          <el-input v-model="newMail.content" type="textarea" 
                   :rows="8" placeholder="写下你想对未来说的话..." />
        </el-form-item>
        
        <el-form-item label="开启日期" prop="openAt">
          <el-date-picker v-model="newMail.openAt" type="datetime" 
                         placeholder="选择开启时间" 
                         :disabled-date="disabledDate" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          封存信件
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看信件对话框 -->
    <el-dialog v-model="showViewDialog" :title="currentMail?.title" width="600px">
      <div v-if="currentMail" class="mail-detail">
        <div class="mail-info">
          <p><strong>创建时间：</strong>{{ formatDate(currentMail.createdAt) }}</p>
          <p><strong>开启时间：</strong>{{ formatDate(currentMail.openAt) }}</p>
          <p><strong>内容类型：</strong>{{ getTypeText(currentMail.type) }}</p>
        </div>
        <div class="mail-content">
          <h4>信件内容：</h4>
          <div class="content-text">{{ currentMail.content }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { TimeMailService } from '@/services/database'
import type { TimeMail } from '@/db'
import dayjs from 'dayjs'

const activeTab = ref('all')
const timeMails = ref<TimeMail[]>([])
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const currentMail = ref<TimeMail | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const newMail = ref({
  title: '',
  content: '',
  type: 'text' as 'text' | 'voice' | 'image',
  openAt: null as Date | null
})

const formRules = {
  title: [{ required: true, message: '请输入信件标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入信件内容', trigger: 'blur' }],
  openAt: [{ required: true, message: '请选择开启时间', trigger: 'change' }]
}

const openableMails = computed(() => {
  return timeMails.value.filter(mail => isOpenable(mail) && !mail.isOpened)
})

const loadTimeMails = async () => {
  try {
    timeMails.value = await TimeMailService.getAllTimeMails()
  } catch (error) {
    console.error('加载信件失败:', error)
    ElMessage.error('加载信件失败')
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    await TimeMailService.addTimeMail({
      title: newMail.value.title,
      content: newMail.value.content,
      type: newMail.value.type,
      openAt: newMail.value.openAt!
    })
    
    ElMessage.success('信件封存成功！')
    showCreateDialog.value = false
    resetForm()
    await loadTimeMails()
  } catch (error) {
    console.error('创建信件失败:', error)
    ElMessage.error('创建信件失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  newMail.value = {
    title: '',
    content: '',
    type: 'text',
    openAt: null
  }
  formRef.value?.resetFields()
}

const isOpenable = (mail: TimeMail) => {
  return dayjs().isAfter(dayjs(mail.openAt))
}

const openMail = async (mail: TimeMail) => {
  try {
    await TimeMailService.openTimeMail(mail.id!)
    mail.isOpened = true
    ElMessage.success('信件已开启！')
    viewMail(mail)
  } catch (error) {
    console.error('开启信件失败:', error)
    ElMessage.error('开启信件失败')
  }
}

const viewMail = (mail: TimeMail) => {
  currentMail.value = mail
  showViewDialog.value = true
}

const deleteMail = async (id: number) => {
  try {
    await TimeMailService.deleteTimeMail(id)
    ElMessage.success('信件已删除')
    await loadTimeMails()
  } catch (error) {
    console.error('删除信件失败:', error)
    ElMessage.error('删除信件失败')
  }
}

const getMailStatus = (mail: TimeMail) => {
  if (mail.isOpened) {
    return { type: 'info', text: '已开启' }
  } else if (isOpenable(mail)) {
    return { type: 'success', text: '可开启' }
  } else {
    return { type: 'warning', text: '封存中' }
  }
}

const getPreview = (content: string) => {
  return content.length > 50 ? content.substring(0, 50) + '...' : content
}

const getTypeText = (type: string) => {
  const typeMap = {
    text: '文字',
    voice: '语音',
    image: '图片'
  }
  return typeMap[type as keyof typeof typeMap] || '未知'
}

const formatDate = (date: Date) => {
  return dayjs(date).format('YYYY年MM月DD日 HH:mm')
}

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now()
}

onMounted(() => {
  loadTimeMails()
})
</script>

<style scoped>
.timemail-container {
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
  margin-bottom: 2rem;
  opacity: 0.9;
}

.content-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.mail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.mail-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.mail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.mail-card.openable {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%);
}

.mail-card.opened {
  border-color: #409eff;
  background: linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%);
}

.mail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.mail-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
}

.mail-meta {
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #718096;
}

.mail-meta div {
  margin-bottom: 0.25rem;
}

.mail-preview {
  margin-bottom: 1.5rem;
  min-height: 3rem;
}

.mail-preview p {
  color: #4a5568;
  line-height: 1.5;
  margin: 0;
}

.mail-preview .sealed {
  color: #a0aec0;
  font-style: italic;
}

.mail-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
}

.mail-detail {
  padding: 1rem 0;
}

.mail-info {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.mail-info p {
  margin: 0.5rem 0;
  color: #4a5568;
}

.mail-content h4 {
  color: #2d3748;
  margin-bottom: 1rem;
}

.content-text {
  background: #f7fafc;
  padding: 1.5rem;
  border-radius: 8px;
  line-height: 1.6;
  color: #4a5568;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .header-section h1 {
    font-size: 2rem;
  }
  
  .mail-grid {
    grid-template-columns: 1fr;
  }
  
  .content-section {
    padding: 1rem;
  }
}
</style>
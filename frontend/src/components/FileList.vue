<template>
  <div class="file-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-icon><Files /></el-icon>
          <span>Загруженные файлы</span>
          <el-button @click="refreshList" type="primary" plain size="small">
            <el-icon><Refresh /></el-icon>
            Обновить
          </el-button>
        </div>
      </template>

      <el-table :data="files" stripe v-loading="loading">
        <el-table-column prop="name" label="Имя файла" width="300">
          <template #default="scope">
            <div class="file-name-cell">
              <el-icon>
                <Document />
              </el-icon>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="size" label="Размер" width="120">
          <template #default="scope">
            {{ formatSize(scope.row.size) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="is_c" label="Тип" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.is_c ? 'success' : 'info'" size="small">
              {{ scope.row.is_c ? 'C/C++' : 'Другой' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="modified" label="Загружен" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.modified) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Действия" width="200">
          <template #default="scope">
            <el-button-group>
              <el-button 
                type="primary" 
                size="small"
                @click="analyzeFile(scope.row.id)"
              >
                Анализ
              </el-button>
              <el-button 
                type="danger" 
                size="small"
                @click="deleteFile(scope.row.id)"
              >
                Удалить
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && files.length === 0" class="empty-state">
        <el-icon size="64"><FolderOpened /></el-icon>
        <h3>Нет загруженных файлов</h3>
        <p>Загрузите файлы для анализа</p>
        <el-button type="primary" @click="$router.push('/')">
          <el-icon><Upload /></el-icon>
          Загрузить файлы
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Files,
  Refresh,
  Document,
  FolderOpened,
  Upload
} from '@element-plus/icons-vue'

const router = useRouter()
const files = ref([])
const loading = ref(true)

const loadFiles = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/files')
    
    if (response.data.success) {
      files.value = response.data.files
    } else {
      ElMessage.error('Ошибка при загрузке файлов')
    }
 
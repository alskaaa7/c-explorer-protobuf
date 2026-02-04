<template>
  <div class="file-upload-container">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <el-icon><UploadFilled /></el-icon>
          <span>Загрузка файла для анализа</span>
        </div>
      </template>

      <div
        class="upload-area"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop="handleDrop"
        :class="{ 'drag-over': isDragging }"
      >
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          style="display: none"
        />

        <div v-if="!selectedFile" class="upload-placeholder">
          <el-icon size="48"><FolderOpened /></el-icon>
          <p>Перетащите файл сюда или</p>
          <el-button type="primary" @click="triggerFileInput">
            Выберите файл
          </el-button>
          <p class="upload-hint">
            Поддерживаются C/C++ файлы (.c, .cpp, .h, .hpp)
          </p>
        </div>

        <div v-else class="selected-file-preview">
          <el-icon size="48"><Document /></el-icon>
          <div class="file-info">
            <h4>{{ selectedFile.name }}</h4>
            <p>{{ formatSize(selectedFile.size) }}</p>
          </div>
          <el-button @click="removeFile" type="danger" plain>
            Удалить
          </el-button>
        </div>
      </div>

      <div v-if="selectedFile" class="upload-controls">
        <div class="format-selector">
          <el-radio-group v-model="responseFormat">
            <el-radio label="json">JSON</el-radio>
            <el-radio label="protobuf">Protobuf</el-radio>
          </el-radio-group>
        </div>

        <el-button
          type="primary"
          size="large"
          :loading="isUploading"
          @click="uploadFile"
          class="upload-button"
        >
          <template #icon>
            <el-icon><Upload /></el-icon>
          </template>
          Загрузить и проанализировать
        </el-button>
      </div>

      <el-progress
        v-if="uploadProgress > 0"
        :percentage="uploadProgress"
        :status="uploadStatus"
        :stroke-width="6"
        style="margin-top: 20px"
      />

      <div v-if="uploadResult" class="upload-result">
        <el-alert
          :title="uploadResult.success ? 'Файл загружен!' : 'Ошибка'"
          :type="uploadResult.success ? 'success' : 'error'"
          :closable="false"
        >
          <template v-if="uploadResult.success">
            <p>ID файла: {{ uploadResult.file_id }}</p>
            <el-button
              type="primary"
              @click="analyzeFile(uploadResult.file_id)"
            >
              <el-icon><DataAnalysis /></el-icon>
              Перейти к анализу
            </el-button>
          </template>
          <template v-else>
            <p>{{ uploadResult.error }}</p>
          </template>
        </el-alert>
      </div>
    </el-card>

    <div class="recent-files" v-if="recentFiles.length > 0">
      <h3>
        <el-icon><Clock /></el-icon> Недавние файлы
      </h3>
      <el-row :gutter="20">
        <el-col v-for="file in recentFiles" :key="file.id" :span="8">
          <el-card class="recent-file-card">
            <template #header>
              <div class="recent-header">
                <el-icon><Document /></el-icon>
                <span>{{ file.name }}</span>
              </div>
            </template>
            <div class="recent-info">
              <p>
                <el-icon><Calendar /></el-icon> {{ formatDate(file.modified) }}
              </p>
              <p :class="file.is_c ? 'c-file' : 'other-file'">
                <el-icon><Files /></el-icon>
                {{ file.is_c ? "C/C++ файл" : "Другой файл" }}
              </p>
            </div>
            <template #footer>
              <el-button @click="loadFile(file.id)" type="text" size="small">
                Анализировать
              </el-button>
            </template>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";
import {
  UploadFilled,
  FolderOpened,
  Document,
  Upload,
  DataAnalysis,
  Clock,
  Calendar,
  Files,
} from "@element-plus/icons-vue";

const router = useRouter();
const fileInput = ref(null);
const isDragging = ref(false);
const selectedFile = ref(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref("");
const uploadResult = ref(null);
const recentFiles = ref([]);
const responseFormat = ref("json");

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    uploadResult.value = null;
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragging.value = false;

  const file = event.dataTransfer.files[0];
  if (file) {
    selectedFile.value = file;
    uploadResult.value = null;
  }
};

const formatSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const removeFile = () => {
  selectedFile.value = null;
  uploadResult.value = null;
  uploadProgress.value = 0;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) {
    ElMessage.warning("Выберите файл для загрузки");
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;

  const formData = new FormData();
  formData.append("file", selectedFile.value);

  try {
    const response = await axios.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
        }
      },
    });

    uploadResult.value = response.data;
    uploadStatus.value = "success";

    if (response.data.success) {
      ElMessage.success("Файл успешно загружен");
      loadRecentFiles();
      analyzeFile(response.data.file_id);
    }
  } catch (error) {
    uploadResult.value = {
      success: false,
      error: error.message,
    };
    uploadStatus.value = "exception";
    ElMessage.error("Ошибка при загрузке файла");
  } finally {
    isUploading.value = false;
  }
};

const analyzeFile = (fileId) => {
  emit("file-selected", fileId);
  router.push({
    path: "/analyze",
    query: { file: fileId, format: responseFormat.value },
  });
};

const loadFile = (fileId) => {
  analyzeFile(fileId);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const loadRecentFiles = async () => {
  try {
    const response = await axios.get("/api/files");
    if (response.data.success) {
      recentFiles.value = response.data.files.slice(0, 3);
    }
  } catch (error) {
    console.error("Ошибка загрузки файлов:", error);
  }
};

onMounted(() => {
  loadRecentFiles();
});
</script>

<style scoped>
.file-upload-container {
  max-width: 1200px;
  margin: 0 auto;
}

.upload-card {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 600;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.upload-area:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.upload-area.drag-over {
  border-color: #67c23a;
  background: #f0f9eb;
}

.upload-placeholder {
  color: #909399;
}

.upload-placeholder .el-icon {
  margin-bottom: 20px;
}

.upload-hint {
  font-size: 0.9rem;
  color: #909399;
  margin-top: 20px;
}

.selected-file-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.file-info {
  text-align: left;
}

.file-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.file-info p {
  margin: 0;
  color: #909399;
  font-size: 0.9rem;
}

.upload-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.format-selector {
  display: flex;
  gap: 20px;
}

.upload-button {
  min-width: 200px;
}

.upload-result {
  margin-top: 20px;
}

.recent-files {
  margin-top: 40px;
}

.recent-files h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #303133;
  margin-bottom: 20px;
}

.recent-file-card {
  height: 100%;
  transition: transform 0.3s ease;
}

.recent-file-card:hover {
  transform: translateY(-5px);
}

.recent-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.recent-info {
  font-size: 0.9rem;
  color: #606266;
}

.recent-info p {
  margin: 5px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.c-file {
  color: #67c23a;
}

.other-file {
  color: #e6a23c;
}
</style>

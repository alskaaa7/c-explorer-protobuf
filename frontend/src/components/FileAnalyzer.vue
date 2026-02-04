<template>
  <div class="analyzer-container">
    <!-- Загрузка -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else>
      <el-card class="file-header-card">
        <div class="header-content">
          <div class="file-info">
            <el-icon
              size="48"
              :color="fileInfo.is_c_file ? '#67c23a' : '#e6a23c'"
            >
              <Document />
            </el-icon>
            <div class="file-details">
              <h2>{{ fileInfo.name }}</h2>
              <div class="file-meta">
                <el-tag :type="fileInfo.is_c_file ? 'success' : 'warning'">
                  {{ fileInfo.is_c_file ? "C/C++ файл" : "Текстовый файл" }}
                </el-tag>
                <span
                  ><el-icon><Cpu /></el-icon>
                  {{ formatSize(fileInfo.size) }}</span
                >
                <span
                  ><el-icon><Calendar /></el-icon>
                  {{ formatDate(fileInfo.modified) }}</span
                >
              </div>
            </div>
          </div>

          <div class="header-actions">
            <el-button-group>
              <el-button @click="refreshAnalysis" type="primary" plain>
                <el-icon><Refresh /></el-icon>
                Обновить
              </el-button>
              <el-button @click="downloadFile" type="success" plain>
                <el-icon><Download /></el-icon>
                Скачать
              </el-button>
              <el-button @click="deleteFile" type="danger" plain>
                <el-icon><Delete /></el-icon>
                Удалить
              </el-button>
            </el-button-group>
          </div>
        </div>
      </el-card>

      <el-alert
        v-if="!fileInfo.is_c_file && analysis"
        :title="analysis.warning || 'Это не C/C++ файл'"
        type="warning"
        :closable="false"
        show-icon
        class="warning-alert"
      />

      <div v-if="fileInfo.is_c_file && analysis" class="analysis-section">
        <div class="stats-grid">
          <el-statistic title="Всего строк" :value="analysis.total_lines || 0">
            <template #prefix>
              <el-icon><Document /></el-icon>
            </template>
          </el-statistic>

          <el-statistic title="Строк кода" :value="analysis.code_lines || 0">
            <template #prefix>
              <el-icon><Memo /></el-icon>
            </template>
          </el-statistic>

          <el-statistic
            title="Комментарии"
            :value="analysis.comment_lines || 0"
          >
            <template #prefix>
              <el-icon><ChatDotRound /></el-icon>
            </template>
          </el-statistic>

          <el-statistic
            title="Пустые строки"
            :value="analysis.empty_lines || 0"
          >
            <template #prefix>
              <el-icon><Close /></el-icon>
            </template>
          </el-statistic>
        </div>

        <el-tabs v-model="activeTab" class="analysis-tabs">
          <el-tab-pane
            label="Функции"
            name="functions"
            v-if="analysis.functions?.length > 0"
          >
            <el-table :data="analysis.functions" stripe>
              <el-table-column prop="name" label="Функция" width="300">
                <template #default="scope">
                  <code>{{ scope.row }}</code>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane
            label="Include"
            name="includes"
            v-if="analysis.includes?.length > 0"
          >
            <el-table :data="analysis.includes" stripe>
              <el-table-column prop="name" label="Файл">
                <template #default="scope">
                  <code>{{ scope.row }}</code>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="Содержимое" name="content">
            <div class="file-content">
              <div class="content-header">
                <el-button @click="copyContent" type="primary" size="small">
                  <el-icon><CopyDocument /></el-icon>
                  Копировать
                </el-button>
                <span class="lines-count"
                  >Строк: {{ analysis.total_lines || 0 }}</span
                >
              </div>
              <pre
                class="code-content"
              ><code>{{ analysis.content_preview }}</code></pre>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div
        v-else-if="analysis && analysis.content_preview"
        class="text-content-section"
      >
        <el-card>
          <template #header>
            <div class="content-header">
              <h3>Содержимое файла</h3>
              <div class="header-actions">
                <el-button @click="copyContent" type="primary" size="small">
                  <el-icon><CopyDocument /></el-icon>
                  Копировать
                </el-button>
              </div>
            </div>
          </template>
          <pre class="text-content">{{ analysis.content_preview }}</pre>
        </el-card>
      </div>

      <div v-if="analysis" class="protobuf-info">
        <el-alert
          :title="
            analysis.protobuf_used
              ? 'Анализ выполнен с использованием Protobuf'
              : 'Protobuf не использовался'
          "
          :type="analysis.protobuf_used ? 'success' : 'info'"
          :closable="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Document,
  Cpu,
  Calendar,
  Refresh,
  Download,
  Delete,
  Memo,
  ChatDotRound,
  Close,
  CopyDocument,
} from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref(null);
const fileInfo = ref({});
const analysis = ref(null);
const activeTab = ref("functions");

const fileId = computed(() => route.query.file);
const responseFormat = computed(() => route.query.format || "json");

const loadAnalysis = async () => {
  if (!fileId.value) {
    error.value = "Файл не выбран";
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const response = await axios.get(
      `/api/analyze/${fileId.value}?format=${responseFormat.value}`,
    );

    if (response.data.success) {
      analysis.value = response.data;
      fileInfo.value = {
        name: response.data.file_name,
        size: response.data.file_size,
        modified: new Date().toISOString(),
        is_c_file: response.data.is_c_file,
      };
    } else {
      error.value = response.data.error || "Ошибка при анализе";
    }
  } catch (err) {
    error.value = err.message || "Ошибка при загрузке";
  } finally {
    loading.value = false;
  }
};

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const copyContent = async () => {
  if (!analysis.value?.content_preview) return;

  try {
    await navigator.clipboard.writeText(analysis.value.content_preview);
    ElMessage.success("Содержимое скопировано");
  } catch (err) {
    ElMessage.error("Не удалось скопировать");
  }
};

const downloadFile = () => {
  if (fileId.value) {
    window.open(`/api/download/${fileId.value}`, "_blank");
  }
};

const deleteFile = async () => {
  try {
    await ElMessageBox.confirm("Удалить этот файл?", "Подтверждение", {
      type: "warning",
    });

    const response = await axios.delete(`/api/files/${fileId.value}`);

    if (response.data.success) {
      ElMessage.success("Файл удален");
      router.push("/files");
    }
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error("Ошибка при удалении");
    }
  }
};

const refreshAnalysis = () => {
  loadAnalysis();
};

onMounted(() => {
  loadAnalysis();
});

watch(fileId, (newId) => {
  if (newId) loadAnalysis();
});
</script>

<style scoped>
.analyzer-container {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-container {
  padding: 40px;
}

.file-header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
}

.file-info {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex: 1;
}

.file-details h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.file-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  color: #909399;
}

.file-meta .el-icon {
  margin-right: 5px;
}

.warning-alert {
  margin-bottom: 20px;
}

.analysis-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stats-grid :deep(.el-statistic) {
  text-align: center;
}

.stats-grid :deep(.el-statistic__head) {
  font-size: 0.9rem;
  color: #909399;
  margin-bottom: 10px;
}

.stats-grid :deep(.el-statistic__content) {
  font-size: 2rem;
  font-weight: bold;
}

.stats-grid :deep(.el-statistic__prefix) {
  margin-right: 8px;
  color: #409eff;
}

.analysis-tabs {
  margin-top: 20px;
}

.file-content,
.text-content-section {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.lines-count {
  color: #909399;
  font-size: 0.9rem;
}

.code-content,
.text-content {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 20px;
  border-radius: 6px;
  overflow-x: auto;
  font-family: "Courier New", monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.protobuf-info {
  margin-top: 20px;
}
</style>

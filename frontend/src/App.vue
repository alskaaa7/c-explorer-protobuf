<template>
  <div class="app">
    <header>
      <h1>📁 C/C++ File Analyzer (Protobuf Only)</h1>
      <p>Полностью на Protobuf - быстрая сериализация, компактные данные</p>
      <div class="server-status" :class="serverStatusClass">
        Сервер: {{ serverStatus }}
      </div>
    </header>

    <main>
      <div class="upload-section">
        <h2>Загрузка файла</h2>

        <div class="upload-area" @dragover.prevent @drop="handleDrop">
          <input
            type="file"
            ref="fileInput"
            @change="handleFileSelect"
            style="display: none"
          />

          <div v-if="!selectedFile" class="upload-placeholder">
            <div class="upload-icon">📤</div>
            <p>Перетащите файл сюда или</p>
            <button @click="triggerFileInput" class="btn-primary">
              Выберите файл
            </button>
            <p class="hint">
              Поддерживаются C/C++ файлы: .c, .cpp, .h, .hpp и др.
            </p>
          </div>

          <div v-else class="selected-file">
            <div class="file-icon">📄</div>
            <div class="file-details">
              <h3>{{ selectedFile.name }}</h3>
              <p>{{ formatSize(selectedFile.size) }}</p>
            </div>
            <button @click="removeFile" class="btn-danger">Удалить</button>
          </div>
        </div>

        <div v-if="selectedFile" class="upload-actions">
          <button
            @click="uploadFile"
            :disabled="uploading"
            class="btn-primary upload-btn"
          >
            {{ uploading ? "📤 Загрузка" : "📤 Загрузить файл" }}
          </button>
        </div>
      </div>

      <!-- результат загрузки -->
      <div v-if="uploadResult" class="result-section">
        <div v-if="uploadResult.success" class="success-card">
          <div class="success-icon">✅</div>
          <div class="success-content">
            <h3>Файл успешно загружен!</h3>
            <p>
              ID: <code>{{ uploadResult.file_id }}</code>
            </p>
            <button
              @click="analyzeFile(uploadResult.file_id)"
              class="btn-primary"
            >
              Анализировать
            </button>
          </div>
        </div>

        <div v-else class="error-card">
          <div class="error-icon">❌</div>
          <div class="error-content">
            <h3>Ошибка загрузки</h3>
            <p>{{ uploadResult.error }}</p>
          </div>
        </div>
      </div>

      <!-- результат анализа -->
      <div v-if="analysisResult" class="analysis-section">
        <h2>Результат анализа (Protobuf)</h2>

        <div class="file-header">
          <div class="file-info">
            <h3>{{ analysisResult.analysis.file_name }}</h3>
            <div class="file-meta">
              <span class="meta-item">
                <span class="meta-label">Размер:</span>
                {{ formatSize(analysisResult.analysis.file_size) }}
              </span>
              <span class="meta-item">
                <span class="meta-label">Тип:</span>
                <span
                  :class="
                    analysisResult.analysis.is_c_file ? 'c-file' : 'text-file'
                  "
                >
                  {{
                    analysisResult.analysis.is_c_file
                      ? "C/C++ файл"
                      : "Текстовый файл"
                  }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Предупреждение для не-C файлов -->
        <div v-if="!analysisResult.analysis.is_c_file" class="warning-card">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <h4>Это не C/C++ файл</h4>
            <p>
              Доступен только режим чтения. Для детального анализа загрузите
              файл с расширением .c, .cpp, .h и т.д.
            </p>
          </div>
        </div>

        <!-- Статистика -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">
              {{ analysisResult.analysis.total_lines || 0 }}
            </div>
            <div class="stat-label">Всего строк</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ analysisResult.analysis.code_lines || 0 }}
            </div>
            <div class="stat-label">Строк кода</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ analysisResult.analysis.comment_lines || 0 }}
            </div>
            <div class="stat-label">Комментарии</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">
              {{ analysisResult.analysis.functions?.length || 0 }}
            </div>
            <div class="stat-label">Функций</div>
          </div>
        </div>

        <!-- функции (только для C файлов) -->
        <div
          v-if="
            analysisResult.analysis.is_c_file &&
            analysisResult.analysis.functions?.length > 0
          "
          class="functions-section"
        >
          <h3>Функции</h3>
          <div class="functions-list">
            <div
              v-for="func in analysisResult.analysis.functions"
              :key="func.name"
              class="function-card"
            >
              <div class="function-header">
                <span class="function-name"
                  >{{ func.return_type || "void" }} {{ func.name }}</span
                >
                <span class="function-line">строка {{ func.line_number }}</span>
              </div>
              <div v-if="func.parameters?.length > 0" class="function-params">
                Параметры: {{ func.parameters.join(", ") }}
              </div>
              <div v-else class="function-params empty">Нет параметров</div>
            </div>
          </div>
        </div>

        <!-- include файлы -->
        <div
          v-if="analysisResult.analysis.includes?.length > 0"
          class="includes-section"
        >
          <h3>Include файлы</h3>
          <div class="includes-list">
            <span
              v-for="inc in analysisResult.analysis.includes"
              :key="inc"
              class="include-tag"
            >
              #include {{ inc }}
            </span>
          </div>
        </div>

        <!-- предупреждения -->
        <div
          v-if="analysisResult.analysis.warnings?.length > 0"
          class="warnings-section"
        >
          <h3>Предупреждения</h3>
          <div class="warnings-list">
            <div
              v-for="warning in analysisResult.analysis.warnings"
              :key="warning"
              class="warning-item"
            >
              ⚠️ {{ warning }}
            </div>
          </div>
        </div>

        <!-- cодержимое файла -->
        <div class="content-section">
          <div class="content-header">
            <h3>Содержимое файла</h3>
            <div class="content-actions">
              <button @click="copyContent" class="btn-secondary">
                Копировать
              </button>
              <span class="lines-count">
                Строк: {{ analysisResult.analysis.total_lines || 0 }}
              </span>
            </div>
          </div>
          <pre
            class="code-content"
          ><code>{{ analysisResult.analysis.content || 'Содержимое недоступно' }}</code></pre>
        </div>
      </div>

      <!-- Состояние загрузки -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Обработка Protobuf данных...</p>
      </div>
    </main>

    <footer>
      <p>
        C/C++ File Analyzer v3.0 • Protobuf Only •
        <a href="http://localhost:8000" target="_blank">API</a>
      </p>
      <p class="tech-info">Используется: FastAPI + Protobuf + Vue 3</p>
    </footer>
  </div>
</template>

<script>
import protobufClient from "./utils/protobufClient";

export default {
  name: "App",
  data() {
    return {
      selectedFile: null,
      uploading: false,
      uploadResult: null,
      analyzing: false,
      analysisResult: null,
      loading: false,
      serverStatus: "Проверка...",
      serverStatusClass: "checking",
    };
  },
  async mounted() {
    await this.checkServerHealth();
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileSelect(event) {
      this.selectedFile = event.target.files[0];
      this.uploadResult = null;
      this.analysisResult = null;
    },

    handleDrop(event) {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        this.selectedFile = file;
        this.uploadResult = null;
        this.analysisResult = null;
      }
    },

    removeFile() {
      this.selectedFile = null;
      this.uploadResult = null;
      this.analysisResult = null;
      this.$refs.fileInput.value = "";
    },

    formatSize(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },

    async checkServerHealth() {
      try {
        const health = await protobufClient.checkHealth();
        this.serverStatus = "Онлайн";
        this.serverStatusClass = "online";
      } catch (error) {
        this.serverStatus = "Оффлайн";
        this.serverStatusClass = "offline";
      }
    },

    async uploadFile() {
      if (!this.selectedFile) return;

      this.uploading = true;
      this.uploadResult = null;
      this.analysisResult = null;

      try {
        const result = await protobufClient.uploadFile(this.selectedFile);
        this.uploadResult = result;

        if (result.success) {
          // автоматический анализ после загрузки
          await this.analyzeFile(result.file_id);
        }
      } catch (error) {
        this.uploadResult = {
          success: false,
          error: error.message,
        };
      } finally {
        this.uploading = false;
      }
    },

    async analyzeFile(fileId) {
      this.analyzing = true;
      this.loading = true;

      try {
        const result = await protobufClient.analyzeFile(fileId);
        this.analysisResult = result;
      } catch (error) {
        alert("Ошибка анализа: " + error.message);
      } finally {
        this.analyzing = false;
        this.loading = false;
      }
    },

    async copyContent() {
      if (!this.analysisResult?.analysis?.content) return;

      try {
        await navigator.clipboard.writeText(
          this.analysisResult.analysis.content,
        );
        alert("Содержимое скопировано в буфер обмена");
      } catch (err) {
        alert("Не удалось скопировать содержимое");
      }
    },
  },
};
</script>

<style scoped>
.app {
  font-family: "Segoe UI", system-ui, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: #333;
}

header {
  text-align: center;
  padding: 30px 0;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 30px;
  position: relative;
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #2c3e50;
}

header p {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.server-status {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.server-status.online {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.server-status.offline {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.server-status.checking {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.upload-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 40px;
  margin-bottom: 30px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.upload-section h2 {
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.8rem;
}

.upload-area {
  border: 3px dashed rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 20px;
}

.upload-area:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
}

.upload-placeholder .upload-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.selected-file {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.file-icon {
  font-size: 36px;
}

.file-details h3 {
  margin: 0 0 5px 0;
}

.file-details p {
  margin: 0;
  opacity: 0.9;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-secondary {
  background: #2196f3;
  color: white;
}

.btn-secondary:hover {
  background: #1976d2;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}

.upload-btn {
  font-size: 18px;
  padding: 15px 30px;
}

.result-section,
.analysis-section {
  background: white;
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
}

.success-card,
.error-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 25px;
  border-radius: 10px;
}

.success-card {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.error-card {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.success-icon,
.error-icon {
  font-size: 40px;
}

.success-content h3,
.error-content h3 {
  margin: 0 0 10px 0;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.file-icon-large {
  font-size: 48px;
}

.file-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.file-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  gap: 5px;
  align-items: center;
}

.meta-label {
  font-weight: 600;
  color: #666;
}

.c-file {
  color: #4caf50;
  font-weight: 600;
}

.text-file {
  color: #ff9800;
  font-weight: 600;
}

.warning-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 25px;
}

.warning-icon {
  font-size: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.functions-section,
.includes-section,
.warnings-section,
.content-section {
  margin: 30px 0;
}

.functions-list {
  display: grid;
  gap: 15px;
}

.function-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s ease;
}

.function-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0 0.1);
}

.function-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.function-name {
  font-family: "Courier New", monospace;
  font-weight: 600;
  color: #2c3e50;
}

.function-line {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.9rem;
}

.function-params {
  font-family: "Courier New", monospace;
  color: #666;
  font-size: 0.95rem;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #4caf50;
}

.function-params.empty {
  color: #999;
  font-style: italic;
  border-left-color: #ccc;
}

.includes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.include-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 8px 15px;
  border-radius: 20px;
  font-family: "Courier New", monospace;
  font-size: 0.9rem;
  border: 1px solid #bbdefb;
}

.warnings-list {
  margin-top: 15px;
}

.warning-item {
  background: #fff3cd;
  color: #856404;
  padding: 12px 20px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid #ffc107;
  display: flex;
  align-items: center;
  gap: 10px;
}

.content-section {
  margin-top: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.content-header h3 {
  margin: 0;
}

.content-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.lines-count {
  color: #666;
  font-size: 0.9rem;
}

.code-content {
  margin: 0;
  padding: 25px;
  background: #2d2d2d;
  color: #f8f8f2;
  font-family: "Courier New", monospace;
  font-size: 14px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 500px;
  overflow-y: auto;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  font-size: 18px;
  color: #667eea;
  font-weight: 500;
}

footer {
  text-align: center;
  padding: 25px 0;
  margin-top: 40px;
  border-top: 1px solid #e0e0e0;
  color: #666;
}

footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

footer a:hover {
  text-decoration: underline;
}

.tech-info {
  font-size: 0.9rem;
  color: #999;
  margin-top: 5px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .app {
    padding: 15px;
  }

  header h1 {
    font-size: 2rem;
  }

  .upload-section {
    padding: 25px;
  }

  .selected-file {
    flex-direction: column;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .server-status {
    position: static;
    margin-top: 15px;
    display: inline-block;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .file-meta {
    flex-direction: column;
    gap: 10px;
  }

  .function-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

@media (prefers-color-scheme: dark) {
  .app {
    background: #1a1a1a;
    color: #e0e0e0;
  }

  header {
    border-bottom-color: #333;
  }

  header h1 {
    color: #e0e0e0;
  }

  .result-section,
  .analysis-section {
    background: #2a2a2a;
    border-color: #333;
  }

  .code-content {
    background: #1e1e1e;
  }

  .function-card {
    background: #2a2a2a;
    border-color: #333;
  }

  .include-tag {
    background: #2a3b4d;
    border-color: #3a4b5d;
  }

  footer {
    border-top-color: #333;
  }
}

/* индикатор Protobuf */
.protobuf-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 10px;
  vertical-align: middle;
}

/* информация о размере данных */
.data-size-info {
  display: flex;
  justify-content: space-around;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
}

.size-item {
  text-align: center;
}

.size-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.size-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
}

/* сравнение */
.compare-btn {
  background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 20px 0;
}

.compare-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 126, 95, 0.3);
}

/* результаты сравнения */
.comparison-results {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin: 25px 0;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.comparison-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.comparison-stat {
  text-align: center;
  padding: 20px;
  border-radius: 10px;
  background: #f8f9fa;
}

.comparison-stat.protobuf {
  border: 2px solid #667eea;
}

.comparison-stat.json {
  border: 2px solid #4caf50;
}

.comparison-value {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 10px;
}

.comparison-label {
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.protobuf .comparison-value {
  color: #667eea;
}

.json .comparison-value {
  color: #4caf50;
}

/* индикатор эффективности */
.efficiency-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #d4edda;
  color: #155724;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  margin: 10px 0;
}

.efficiency-badge.high {
  background: #d4edda;
  color: #155724;
}

.efficiency-badge.medium {
  background: #fff3cd;
  color: #856404;
}

.efficiency-badge.low {
  background: #f8d7da;
  color: #721c24;
}
</style>

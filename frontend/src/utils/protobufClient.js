import protobuf from 'protobufjs';

class ProtobufClient {
  constructor() {
    this.root = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      //загрузка схемы protobuf
      this.root = await protobuf.load('/proto/schema.proto');
      this.initialized = true;
      console.log('Protobuf инициализирован');
    } catch (error) {
      console.error('Ошибка инициализации Protobuf:', error);
      throw error;
    }
  }

  async decodeResponse(buffer, messageType) {
    await this.initialize();
    
    try {
      const Message = this.root.lookupType(`analyzer.${messageType}`);
      const message = Message.decode(new Uint8Array(buffer));
      
      //конвертация в обычный объект
      const result = Message.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true,
        arrays: true,
        objects: true,
      });
      
      return result;
    } catch (error) {
      console.error(`Ошибка декодирования ${messageType}:`, error);
      throw error;
    }
  }

  //методы API
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    return this.decodeResponse(buffer, 'UploadResponse');
  }

  async analyzeFile(fileId) {
    const response = await fetch(`/api/analyze/${fileId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    return this.decodeResponse(buffer, 'AnalysisResponse');
  }

  async listFiles() {
    const response = await fetch('/api/files');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    return this.decodeResponse(buffer, 'FileListResponse');
  }

  async checkHealth() {
    const response = await fetch('/api/health');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    return this.decodeResponse(buffer, 'HealthResponse');
  }

  //для сравнения Protobuf и JSON
  async benchmarkComparison(fileId) {
    const startProtobuf = performance.now();
    const protobufResponse = await this.analyzeFile(fileId);
    const protobufTime = performance.now() - startProtobuf;
    
    const startJson = performance.now();
    const jsonResponse = await fetch(`/api/analyze/${fileId}?format=json`);
    const jsonData = await jsonResponse.json();
    const jsonTime = performance.now() - startJson;
    
    //сравнение размеров
    const protobufSize = new Blob([JSON.stringify(protobufResponse)]).size;
    const jsonSize = new Blob([JSON.stringify(jsonData)]).size;
    
    return {
      protobuf: {
        time: protobufTime,
        size: protobufSize,
        data: protobufResponse
      },
      json: {
        time: jsonTime,
        size: jsonSize,
        data: jsonData
      },
      comparison: {
        timeDifference: jsonTime - protobufTime,
        sizeDifference: jsonSize - protobufSize,
        timeRatio: (protobufTime / jsonTime).toFixed(2),
        sizeRatio: (protobufSize / jsonSize).toFixed(2)
      }
    };
  }
}

//экспорт синглтона
const protobufClient = new ProtobufClient();
export default protobufClient;
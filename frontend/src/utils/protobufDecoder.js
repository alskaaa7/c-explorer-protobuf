import protobuf from 'protobufjs';

//реализация без генерации кода
class ProtobufDecoder {
  static async decodeAnalysisResponse(buffer) {
    try {
      const root = await protobuf.load('/proto/schema.proto');
      const AnalysisResponse = root.lookupType('analyzer.AnalysisResponse');
      
      const message = AnalysisResponse.decode(new Uint8Array(buffer));
      const object = AnalysisResponse.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
      });
      
      return object;
    } catch (error) {
      console.error('Protobuf decode error:', error);
      throw error;
    }
  }
  
  static async encodeAnalysisRequest(data) {
    try {
      const root = await protobuf.load('/proto/schema.proto');
      const AnalysisRequest = root.lookupType('analyzer.AnalysisRequest');
      
      const message = AnalysisRequest.create(data);
      const buffer = AnalysisRequest.encode(message).finish();
      
      return buffer;
    } catch (error) {
      console.error('Protobuf encode error:', error);
      throw error;
    }
  }
}

export default ProtobufDecoder;
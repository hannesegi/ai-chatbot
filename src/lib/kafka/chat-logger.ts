// lib/kafka/chat-logger.ts
import { Kafka, Producer, ProducerRecord } from "kafkajs";
import globalLogger from "logger";
import { colorize } from "consola/utils";

const logger = globalLogger.withDefaults({
  message: colorize("magentaBright", `Kafka Chat Logger: `),
});

const BOOTSTRAP_SERVERS =
  process.env.KAFKA_BOOTSTRAP_SERVERS || "172.16.100.249:9092";
const TOPIC_NAME = process.env.KAFKA_TOPIC_NAME || "log-chat-aiverse";

interface ChatLogPayload {
  timestamp: string;
  threadId: string;
  userId: string;
  messageId: string;
  role: "user" | "assistant";
  input: string;
  output?: string;
  agentId?: string;
  model?: string;
  toolCalls?: any[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metadata?: Record<string, any>;
  error?: string;
  status: "success" | "error";
}

class ChatKafkaProducer {
  private producer: Producer | null = null;
  private kafka: Kafka | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initProducer();
  }

  private initProducer() {
    try {
      this.kafka = new Kafka({
        clientId: "aiverse-chat-logger",
        brokers: BOOTSTRAP_SERVERS.split(","),
        retry: {
          retries: 3,
          initialRetryTime: 100,
          maxRetryTime: 30000,
        },
      });

      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000,
      });

      logger.info(`Kafka Producer initialized: ${BOOTSTRAP_SERVERS}`);
    } catch (error) {
      logger.error("Failed to initialize Kafka Producer:", error);
      this.producer = null;
    }
  }

  async connect() {
    if (!this.producer || this.isConnected) return;

    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.success("Kafka Producer connected successfully");
    } catch (error) {
      logger.error("Failed to connect Kafka Producer:", error);
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (!this.producer || !this.isConnected) return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info("Kafka Producer disconnected");
    } catch (error) {
      logger.error("Failed to disconnect Kafka Producer:", error);
    }
  }

  async sendChatLog(payload: ChatLogPayload): Promise<boolean> {
    if (!this.producer) {
      logger.warn("Kafka Producer not initialized. Skipping log.");
      return false;
    }

    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const message: ProducerRecord = {
        topic: TOPIC_NAME,
        messages: [
          {
            key: payload.threadId,
            value: JSON.stringify(payload),
            timestamp: Date.now().toString(),
          },
        ],
      };

      await this.producer.send(message);

      logger.success(
        `Chat log sent to Kafka - Thread: ${payload.threadId}, Message: ${payload.messageId}`,
      );

      return true;
    } catch (error) {
      logger.error("Failed to send chat log to Kafka:", error);
      return false;
    }
  }

  // Helper method untuk extract text dari message parts
  private extractTextFromParts(parts: any[]): string {
    return parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n");
  }

  // Helper method untuk extract tool calls dari message parts
  private extractToolCallsFromParts(parts: any[]): any[] {
    return parts
      .filter((part) => part.type === "tool-call")
      .map((part) => ({
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        args: part.args,
      }));
  }

  // Method untuk log user message
  async logUserMessage(
    threadId: string,
    userId: string,
    messageId: string,
    parts: any[],
    metadata?: Record<string, any>,
  ) {
    const payload: ChatLogPayload = {
      timestamp: new Date().toISOString(),
      threadId,
      userId,
      messageId,
      role: "user",
      input: this.extractTextFromParts(parts),
      metadata,
      status: "success",
    };

    return this.sendChatLog(payload);
  }

  // Method untuk log assistant message
  async logAssistantMessage(
    threadId: string,
    userId: string,
    messageId: string,
    inputParts: any[],
    outputParts: any[],
    metadata?: Record<string, any>,
  ) {
    const payload: ChatLogPayload = {
      timestamp: new Date().toISOString(),
      threadId,
      userId,
      messageId,
      role: "assistant",
      input: this.extractTextFromParts(inputParts),
      output: this.extractTextFromParts(outputParts),
      toolCalls: this.extractToolCallsFromParts(outputParts),
      agentId: metadata?.agentId,
      model: metadata?.chatModel
        ? `${metadata.chatModel.provider}/${metadata.chatModel.model}`
        : undefined,
      usage: metadata?.usage,
      metadata,
      status: "success",
    };

    return this.sendChatLog(payload);
  }

  // Method untuk log error
  async logError(
    threadId: string,
    userId: string,
    messageId: string,
    error: string,
    metadata?: Record<string, any>,
  ) {
    const payload: ChatLogPayload = {
      timestamp: new Date().toISOString(),
      threadId,
      userId,
      messageId,
      role: "assistant",
      input: "",
      error,
      metadata,
      status: "error",
    };

    return this.sendChatLog(payload);
  }
}

// Singleton instance
export const chatKafkaProducer = new ChatKafkaProducer();

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down Kafka Producer...");
  await chatKafkaProducer.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down Kafka Producer...");
  await chatKafkaProducer.disconnect();
  process.exit(0);
});

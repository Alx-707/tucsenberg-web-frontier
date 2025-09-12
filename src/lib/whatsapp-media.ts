/**
 * WhatsApp Business API 媒体处理服务
 * 提供媒体文件上传、下载和管理功能
 */

import { logger } from '@/lib/logger';

/**
 * WhatsApp 媒体处理类
 */
export class WhatsAppMediaService {
  private readonly baseUrl = 'https://graph.facebook.com/v18.0';
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  /**
   * 获取媒体文件URL
   */
  async getMediaUrl(mediaId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${mediaId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get media URL');
      }

      const data = await response.json();
      return data.url || null;
    } catch (error) {
      logger.error('Error getting media URL', {}, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * 下载媒体文件
   */
  async downloadMedia(mediaId: string): Promise<Buffer | null> {
    try {
      const mediaUrl = await this.getMediaUrl(mediaId);
      if (!mediaUrl) {
        return null;
      }

      const response = await fetch(mediaUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download media');
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error('Error downloading media', {}, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * 上传媒体文件
   */
  async uploadMedia(
    file: Buffer | Blob,
    type: 'image' | 'document' | 'audio' | 'video' | 'sticker',
    filename?: string,
  ): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', type);

      if (file instanceof Buffer) {
        formData.append(
          'file',
          new Blob([new Uint8Array(file)]),
          filename || 'file',
        );
      } else {
        formData.append('file', file as Blob, filename);
      }

      const response = await fetch(
        `${this.baseUrl}/${this.phoneNumberId}/media`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error('Failed to upload media');
      }

      const data = await response.json();
      return data.id || null;
    } catch (error) {
      logger.error('Error uploading media', {}, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * 删除媒体文件
   */
  async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${mediaId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      logger.error('Error deleting media', {}, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * 获取媒体文件信息
   */
  async getMediaInfo(mediaId: string): Promise<{
    id: string;
    url?: string;
    mime_type?: string;
    sha256?: string;
    file_size?: number;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${mediaId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get media info');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error getting media info', {}, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }
}

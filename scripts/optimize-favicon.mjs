#!/usr/bin/env node
/**
 * P2-1 Phase 2: Favicon 压缩脚本
 *
 * 将多分辨率 ICO (25KB) 压缩为仅包含 16x16 和 32x32 的优化版本 (≤10KB)
 *
 * 使用方法: node scripts/optimize-favicon.mjs
 *
 * 依赖: macOS sips (用于 ICO→PNG 转换) + sharp (用于图像处理)
 */
import { execSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const INPUT_FAVICON = join(projectRoot, 'src/app/favicon.ico');
const BACKUP_FAVICON = join(projectRoot, 'src/app/favicon.ico.backup');
const OUTPUT_FAVICON = join(projectRoot, 'src/app/favicon.ico');
const TEMP_PNG = '/tmp/favicon-source-temp.png';

/**
 * 创建 ICO 文件（使用 PNG 格式的图像数据）
 */
function createIcoFile(images) {
  // ICONDIR: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type (1 = ICO)
  header.writeUInt16LE(images.length, 4); // Image count

  // Calculate offsets
  const directorySize = 6 + images.length * 16;
  let currentOffset = directorySize;

  // ICONDIRENTRY for each image
  const entries = images.map((img) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0); // Width
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1); // Height
    entry.writeUInt8(0, 2); // Color palette (0 for truecolor)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.data.length, 8); // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset to image data

    currentOffset += img.data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map((img) => img.data)]);
}

async function main() {
  console.log('📦 P2-1 Phase 2: Favicon 压缩');
  console.log('');

  // 确保原始文件存在
  if (!existsSync(INPUT_FAVICON)) {
    throw new Error(`找不到 favicon: ${INPUT_FAVICON}`);
  }

  const originalSize = statSync(INPUT_FAVICON).size;
  console.log(`📄 原始文件: ${INPUT_FAVICON}`);
  console.log(
    `📊 原始大小: ${originalSize.toLocaleString()} bytes (${(originalSize / 1024).toFixed(1)} KB)`,
  );

  // 备份原始文件（如果备份不存在）
  if (!existsSync(BACKUP_FAVICON)) {
    copyFileSync(INPUT_FAVICON, BACKUP_FAVICON);
    console.log(`💾 已备份至: ${BACKUP_FAVICON}`);
  } else {
    console.log(`💾 使用已有备份: ${BACKUP_FAVICON}`);
  }

  // 使用 sips (macOS) 将 ICO 转换为 PNG
  console.log('🔄 使用 sips 转换 ICO → PNG...');
  try {
    execSync(`sips -s format png "${BACKUP_FAVICON}" --out "${TEMP_PNG}"`, {
      stdio: 'pipe',
    });
  } catch (err) {
    throw new Error('sips 转换失败 (需要 macOS 环境)');
  }

  // 检查转换结果
  const metadata = await sharp(TEMP_PNG).metadata();
  console.log(
    `🔍 源图像: ${metadata.width}x${metadata.height}, ${metadata.format} 格式`,
  );

  // 生成优化后的 PNG 图像
  const sizes = [16, 32];
  const optimizedImages = [];

  for (const size of sizes) {
    const pngBuffer = await sharp(TEMP_PNG)
      .resize(size, size, {
        kernel: sharp.kernel.lanczos3,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        compressionLevel: 9,
        palette: true, // 使用调色板以减小文件大小
      })
      .toBuffer();

    optimizedImages.push({
      width: size,
      height: size,
      data: pngBuffer,
    });

    console.log(
      `✅ 生成 ${size}x${size} PNG: ${pngBuffer.length.toLocaleString()} bytes`,
    );
  }

  // 清理临时文件
  if (existsSync(TEMP_PNG)) {
    unlinkSync(TEMP_PNG);
  }

  // 创建新的 ICO 文件
  // 按大小降序排列（ICO 惯例：较大尺寸在前）
  optimizedImages.sort((a, b) => b.width - a.width);
  const newIcoBuffer = createIcoFile(optimizedImages);

  // 写入优化后的 favicon
  writeFileSync(OUTPUT_FAVICON, newIcoBuffer);

  const newSize = newIcoBuffer.length;
  const savings = originalSize - newSize;
  const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

  console.log('');
  console.log(`✅ 优化完成!`);
  console.log(
    `📊 新文件大小: ${newSize.toLocaleString()} bytes (${(newSize / 1024).toFixed(1)} KB)`,
  );
  console.log(
    `💾 节省: ${savings.toLocaleString()} bytes (${savingsPercent}%)`,
  );

  if (newSize > 10240) {
    console.log('');
    console.log(`⚠️  注意: 文件仍大于 10KB，但已显著减小`);
  }
}

main().catch((err) => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});

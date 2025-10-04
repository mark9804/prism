# HSI Web Viewer Implementation Notes

## 已完成功能

### 1. 数据存储 (matrixStore.ts)

- 创建了专门的 HSI 数据存储
- **不持久化存储**以保证性能
- 支持 groundTruthData 和 reconstructedData

### 2. RGB 图像上传与显示 (RGBImageProvider.vue)

- ✅ 拖放上传 .mat 文件
- ✅ 点击上传 .mat 文件
- ✅ 自动解析 HSI 数据
- ✅ 自动检测波段数并匹配模板（28/31 bands）
- ✅ 显示 RGB 合成图像
- ✅ 加载状态指示
- ✅ 错误处理

### 3. Measurement 图像显示 (MeasurementImageProvider.vue)

- ✅ 拖放上传 mask.mat 文件
- ✅ 点击上传 mask.mat 文件
- ✅ 使用真实的 CASSI 算法计算 measurement（HSI \* mask）
- ✅ 使用伪彩色映射（hot colormap）
- ✅ 智能状态提示（需要先上传 GT，再上传 mask）
- ✅ 自动响应数据变化

### 4. 光谱曲线绘制 (CurveGraphProvider.vue)

- ✅ 使用 AntV G2 绘制光谱签名曲线
- ✅ 从图像中心 30x30 patch 计算平均光谱
- ✅ 交互式图表
- ✅ 自动响应数据变化

### 5. 布局 (ResultProvider.vue)

- ✅ 使用 CSS Grid 布局
- ✅ 响应式设计

## 需要安装的依赖

在运行项目前，请安装 AntV G2：

\`\`\`bash
pnpm add @antv/g2
\`\`\`

或者使用 npm：

\`\`\`bash
npm install @antv/g2
\`\`\`

## 测试步骤

1. 安装依赖：
   \`\`\`bash
   pnpm install
   pnpm add @antv/g2
   \`\`\`

2. 启动开发服务器：
   \`\`\`bash
   pnpm dev
   \`\`\`

3. 在浏览器中打开应用

4. **上传 Ground Truth**：
   - 将 \`test/Truth_scene01.mat\` 拖放到左上角的 RGB 图像区域
   - 或点击 "Click to upload" 按钮选择文件

5. **上传 Mask**：
   - 将 \`test/mask.mat\` 拖放到右上角的 Measurement 区域
   - 或点击 "Click to upload" 按钮选择文件

6. 验证：
   - ✅ RGB 图像正确显示
   - ✅ Measurement 使用真实 CASSI 算法计算并显示伪彩色图像
   - ✅ 光谱曲线正确绘制
   - ✅ 状态提示正确（上传顺序检查）

## 数据流程

\`\`\`
Step 1: Upload Ground Truth
User uploads GT .mat file → RGBImageProvider
↓
HSIUtils.loadMatFile() parses data
↓
Auto-detect bands & match template
↓
Store in matrixStore.groundTruthData (not persisted)
↓
Trigger reactive updates:
├── RGBImageProvider renders RGB
├── MeasurementImageProvider shows "Upload mask.mat" prompt
└── CurveGraphProvider plots spectral curve

Step 2: Upload Mask
User uploads mask.mat → MeasurementImageProvider
↓
HSIUtils.loadMatFile() parses mask
↓
Store in matrixStore.maskData (not persisted)
↓
Calculate CASSI measurement:
measurement = sum(GT \* mask, axis=bands)
↓
MeasurementImageProvider renders with hot colormap
\`\`\`

## 核心设计原则

### 数据结构清晰

- HSI 数据统一为 \`[H, W, C]\` 格式
- 使用标准 JavaScript 数组，避免复杂类型
- Store 不持久化，避免大数据序列化开销

### 简单直接的实现

- 每个组件职责单一
- 没有过度抽象
- 使用 Vue 3 Composition API
- 响应式数据自动触发更新

### 算法一致性

- RGB 转换算法与 Python 版本一致
- 波长到颜色映射与 visualize.py 完全相同
- 归一化逻辑统一

## 已知限制

1. **光谱曲线采样点**：固定使用图像中心 30x30 patch。未来可以添加交互式选择区域功能。

2. **Mask 格式**：目前假设 mask 数据与 HSI 数据维度完全匹配 `[H, W, C]`。

## 下一步计划

- [ ] 添加重建图像上传功能
- [ ] 实现重建结果与真值的对比
- [ ] 添加多个波段的可视化
- [ ] 添加 PSNR/SSIM 等质量指标计算
- [ ] 支持多文件批量处理
- [ ] 在光谱曲线上添加重建结果的对比曲线

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Pinia (State Management)
- AntV G2 (Charts)
- UnoCSS (Styling)
- mat-for-js (MATLAB file parsing)

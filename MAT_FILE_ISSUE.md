# MAT 文件读取问题诊断

## 当前问题

遇到错误：`First argument to DataView constructor must be an ArrayBuffer`

这是由于 `mat-for-js` (v1.1.0) 库在浏览器环境中存在兼容性问题。

## 问题原因

`mat-for-js` 库在内部使用 DataView 时，可能期望的是 Node.js 环境的 Buffer 对象，而不是浏览器的 Uint8Array 或 ArrayBuffer。

## 解决方案

### 方案 1：尝试当前的双重fallback机制

代码已添加了尝试两种方式读取的机制：

1. 先尝试 Uint8Array
2. 失败后尝试 ArrayBuffer

查看浏览器控制台的调试信息以了解具体失败原因。

### 方案 2：使用其他浏览器兼容的库

推荐替代方案：

#### A. 使用 `scipy-matread` (推荐)

```bash
pnpm remove mat-for-js
pnpm add scipy-matread
```

#### B. 使用 `mat4js` (注意不是 mat-for-js)

```bash
pnpm remove mat-for-js
pnpm add mat4js
```

#### C. 使用服务端处理

如果浏览器端库都有问题，可以：

1. 创建一个简单的 Node.js 服务
2. 在服务端解析 .mat 文件
3. 返回 JSON 数据给前端

### 方案 3：预处理 MAT 文件

使用 Python 脚本将 .mat 文件转换为 JSON：

```python
import scipy.io as scio
import json
import numpy as np

# 读取 mat 文件
mat_data = scio.loadmat('test/Truth_scene01.mat')

# 转换为 JSON 可序列化的格式
def convert_to_json_serializable(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_to_json_serializable(v) for k, v in obj.items()}
    else:
        return obj

json_data = convert_to_json_serializable({
    'img': mat_data.get('img'),
    'truth': mat_data.get('truth'),
})

# 保存为 JSON
with open('test/Truth_scene01.json', 'w') as f:
    json.dump(json_data, f)
```

然后在前端直接加载 JSON 文件（速度更快，兼容性更好）。

## 当前代码的调试

运行应用后，在浏览器控制台查看：

1. `Loading mat file: <filename> Size: <bytes>` - 文件是否正确加载
2. 是否有 `Failed with Uint8Array` 警告
3. 具体的错误信息

## 建议

**短期**：查看控制台日志，了解具体失败在哪一步

**长期**：考虑使用预处理方案（方案3），将 .mat 文件转换为 JSON，这样：

- 加载更快
- 兼容性更好
- 可以压缩（gzip）
- 不依赖可能有问题的第三方库

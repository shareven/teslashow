# Contributing to TeslaShow

感谢您对 TeslaShow 项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug 报告
- 💡 功能建议
- 📝 文档改进
- 🔧 代码贡献
- 🌐 翻译工作

## 🚀 快速开始

### 开发环境设置

1. **Fork 并克隆仓库**
   ```bash
   git clone https://github.com/shareven/teslashow.git
   cd teslashow
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.local.example .env.local
   # 编辑 .env.local 文件，填入您的配置
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

## 📋 贡献流程

### 1. 创建 Issue

在开始编码之前，请先创建一个 Issue 来描述您要解决的问题或添加的功能。这有助于：
- 避免重复工作
- 获得社区反馈
- 确保贡献符合项目方向

### 2. 分支管理

- 从 `main` 分支创建新的功能分支
- 使用描述性的分支名称，例如：
  - `feature/add-charging-statistics`
  - `fix/map-rendering-issue`
  - `docs/update-installation-guide`

```bash
git checkout -b feature/your-feature-name
```

### 3. 代码规范

#### TypeScript 和 React
- 使用 TypeScript 进行类型安全
- 遵循 React Hooks 最佳实践
- 使用函数式组件

#### 代码风格
- 使用 ESLint 和 Prettier 进行代码格式化
- 运行 `npm run lint` 检查代码风格
- 保持一致的命名约定

#### 提交信息
使用清晰的提交信息，遵循约定式提交规范：

```
type(scope): description

[optional body]

[optional footer]
```

类型包括：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(map): add trajectory clustering for better performance

- Implement trajectory point clustering algorithm
- Reduce map rendering load for large datasets
- Add configuration options for cluster sensitivity

Closes #123
```

### 4. 测试

- 确保所有现有测试通过
- 为新功能添加适当的测试
- 测试在不同设备和浏览器上的兼容性

```bash
npm run test
npm run build  # 确保构建成功
```

### 5. 提交 Pull Request

1. **推送分支到您的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **创建 Pull Request**
   - 提供清晰的标题和描述
   - 引用相关的 Issue
   - 添加截图或 GIF（如果是 UI 变更）
   - 列出测试步骤

3. **PR 模板**
   ```markdown
   ## 变更描述
   简要描述此 PR 的变更内容

   ## 相关 Issue
   Closes #issue_number

   ## 变更类型
   - [ ] Bug 修复
   - [ ] 新功能
   - [ ] 文档更新
   - [ ] 性能优化
   - [ ] 其他

   ## 测试
   - [ ] 本地测试通过
   - [ ] 添加了新的测试用例
   - [ ] 所有现有测试通过

   ## 截图
   （如果适用，请添加截图）

   ## 检查清单
   - [ ] 代码遵循项目规范
   - [ ] 自我审查了代码
   - [ ] 添加了必要的注释
   - [ ] 更新了相关文档
   ```

## 🐛 Bug 报告

提交 Bug 报告时，请包含：

1. **环境信息**
   - 操作系统
   - 浏览器版本
   - Node.js 版本
   - TeslaMate 版本

2. **重现步骤**
   - 详细的操作步骤
   - 预期行为
   - 实际行为

3. **附加信息**
   - 错误截图
   - 控制台错误信息
   - 相关日志

## 💡 功能建议

提交功能建议时，请包含：

1. **问题描述**
   - 当前的痛点或限制
   - 使用场景

2. **解决方案**
   - 建议的功能描述
   - 可能的实现方式

3. **替代方案**
   - 其他可能的解决方案
   - 为什么选择这个方案

## 📝 文档贡献

文档改进包括：
- README 更新
- API 文档完善
- 安装指南优化
- 故障排除指南
- 代码注释改进

## 🌐 国际化

我们欢迎翻译贡献：
- 添加新的语言支持
- 改进现有翻译
- 本地化文档

## 🎯 开发重点

当前项目的重点领域：

1. **性能优化**
   - 地图渲染性能
   - 大数据集处理
   - 移动端体验

2. **功能增强**
   - 更多统计图表
   - 数据导出功能
   - 高级过滤选项

3. **用户体验**
   - 响应式设计改进
   - 无障碍访问支持
   - 错误处理优化

## 📞 获取帮助

如果您在贡献过程中遇到问题：

- 查看现有的 [Issues](https://github.com/shareven/teslashow/issues)
- 参与 [Discussions](https://github.com/shareven/teslashow/discussions)
- 联系维护者

## 🏆 贡献者认可

我们重视每一个贡献，所有贡献者都会在项目中得到认可：
- README 中的贡献者列表
- 发布说明中的特别感谢
- 社区认可和推荐

## 📜 行为准则

请遵循我们的 [行为准则](CODE_OF_CONDUCT.md)，营造友好、包容的社区环境。

---

再次感谢您的贡献！每一个 PR、Issue 和建议都让 TeslaShow 变得更好。🚗⚡
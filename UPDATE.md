# 博客应用更新指南 / Blog Application Update Guide

## 🔄 更新选项 / Update Options

### 1. 本地Git更新 / Local Git Update

如果您使用Git克隆了仓库，可以使用本地更新脚本：

```bash
./update.sh
```

**功能特性：**
- ✅ 自动备份现有数据
- ✅ 从Git拉取最新代码
- ✅ 保留用户配置
- ✅ 重建并启动应用
- ✅ 健康检查
- ✅ 自动清理

### 2. 远程Docker Hub更新 / Remote Docker Hub Update

如果您想从Docker Hub获取最新版本：

```bash
# 下载并执行远程更新脚本
curl -sSL https://raw.githubusercontent.com/xuemian168/i18n_blog/main/update-from-hub.sh -o update-from-hub.sh && chmod +x update-from-hub.sh && ./update-from-hub.sh
```

**功能特性：**
- ✅ 自动备份现有数据
- ✅ 下载最新配置文件
- ✅ 拉取最新Docker镜像
- ✅ 保留用户配置
- ✅ 启动更新后的应用

## 🔙 回滚功能 / Rollback Feature

如果更新后出现问题，可以快速回滚到之前的版本：

```bash
./rollback.sh <backup_timestamp>
```

例如：
```bash
./rollback.sh 20250727_143052
```

## 📋 更新前准备 / Pre-Update Checklist

1. **备份重要数据** / Backup Important Data
   - 脚本会自动备份，但建议手动备份重要内容

2. **检查系统资源** / Check System Resources
   - 确保有足够的磁盘空间
   - 确保Docker正在运行

3. **记录当前配置** / Record Current Configuration
   - 记录当前的环境变量设置
   - 记录任何自定义配置

## 🛠 更新过程 / Update Process

### 自动执行的步骤：

1. **数据备份** / Data Backup
   - 数据库备份
   - 上传文件备份
   - 配置文件备份

2. **代码更新** / Code Update
   - Git拉取最新代码（本地更新）
   - 下载最新Docker镜像（远程更新）

3. **服务重启** / Service Restart
   - 停止旧服务
   - 构建新镜像
   - 启动新服务

4. **健康检查** / Health Check
   - 验证服务状态
   - 测试API连接
   - 确认应用正常运行

## 🗂 备份管理 / Backup Management

备份文件存储在 `./backups/` 目录下，按时间戳组织：

```
backups/
├── 20250727_143052/    # 更新前自动备份
├── 20240728_091234/    # 另一次更新的备份
└── pre_rollback_*/     # 回滚前的备份
```

### 备份内容包括：
- 数据库文件
- 上传的媒体文件
- 环境配置文件
- Docker Compose覆盖文件

## ⚠️ 注意事项 / Important Notes

1. **网络连接** / Network Connection
   - 确保网络连接稳定
   - 远程更新需要访问Docker Hub

2. **权限要求** / Permission Requirements
   - 脚本需要Docker操作权限
   - 文件系统写入权限

3. **服务中断** / Service Interruption
   - 更新过程中服务会短暂中断
   - 建议在低峰时段进行更新

4. **配置保留** / Configuration Preservation
   - `.env` 文件会被保留
   - 自定义Docker Compose设置会被保留

## 🆘 故障排除 / Troubleshooting

### 更新失败 / Update Failed

```bash
# 查看详细日志
docker-compose logs -f

# 重新启动服务
docker-compose restart

# 如果问题严重，回滚到之前版本
./rollback.sh <backup_timestamp>
```

### 服务无法启动 / Service Won't Start

```bash
# 检查Docker状态
docker info

# 检查端口占用
netstat -tlnp | grep :3000
netstat -tlnp | grep :8080

# 强制重新构建
docker-compose up --build --force-recreate
```

### 数据丢失 / Data Loss

```bash
# 检查备份
ls -la ./backups/

# 恢复最新备份
./rollback.sh <latest_backup_timestamp>
```

## 📞 获取帮助 / Getting Help

如果遇到问题，可以：

1. 查看应用日志：`docker-compose logs -f`
2. 检查备份文件：`ls -la ./backups/`
3. 在GitHub上提交Issue
4. 查看官方文档

## 🔄 定期更新建议 / Regular Update Recommendations

- 建议每月检查一次更新
- 重要安全更新应及时应用
- 在测试环境中先验证更新
- 保持至少3个最新备份

---

**注意：** 更新脚本会尽力保护您的数据，但建议在重要更新前手动备份关键数据。
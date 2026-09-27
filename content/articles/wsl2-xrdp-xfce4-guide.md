---
title: 记一次 Python Web 应用麒麟 V10 打包——基于 WSL2 与 Xvnc 的远程桌面验证实践
date: 2026-09-27
category: 技术
tags: WSL2, xrdp, Xvnc, Xfce4, Linux, 远程桌面, 麒麟, PyInstaller
slug: wsl2-xrdp-xfce4-guide
authors: 王前, GitHub Copilot
summary: 记录在 Windows WSL2 中通过 xrdp + TigerVNC + Xfce4 搭建 Linux 图形桌面，以完成 Python Web 应用在银河麒麟 V10 上的打包与可视化验证。重点分析了 root 账号锁定、.xsession 配置错误、Xorg 后端不可用等问题的排查与解决。本文在 AI 辅助下完成。
---

## 1 问题背景

将一个 Python Web 应用（`NJ_Oil_显示端`）用 PyInstaller 打包为 Linux 可执行文件，目标平台为**银河麒麟 V10**（glibc 2.28）。由于 glibc 向下兼容的限制，必须在 glibc ≤ 2.31 的 Linux 环境中编译打包。

打包完成后，还需在 Linux 桌面环境中实际运行程序，验证 GUI 启动、浏览器调用和页面渲染是否正常。仅通过 `--version` 检查不足以确认运行时行为的正确性。

WSLg 支持运行单个 GUI 窗口，但不提供完整桌面环境（[Microsoft 文档](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps)）。因此需要通过 xrdp 在 WSL2 中搭建完整的 Linux 桌面。

## 2 方案选型

### 为什么不选 Docker

Docker 在无头环境和 CI 场景下是合理选择，但在本场景中有两个问题：

1. **Docker Desktop on Windows 的运行时就是 WSL2**（[官方架构说明](https://docs.docker.com/desktop/features/linux/)），"不用 WSL 直接用 Docker"并未绕开 WSL2，只是多了一层 Docker Engine 抽象。

2. GUI 桌面场景下，容器缺少 systemd（需手动管理 dbus/xrdp 生命周期）、没有持久会话（重建容器后桌面配置丢失），且同样需要安装 VNC + 窗口管理器，复杂度与 WSL2 方案相当，但多了一层隔离开销。

### 选型对比

| 方案 | 评价 | 结论 |
|------|------|------|
| Docker | 底层仍是 WSL2，GUI 桌面需额外穿透 | ❌ |
| WSL2 直接导入 | 轻量，与 Windows 文件系统互通 | ✅ |
| Hyper-V 虚拟机 | 资源占用大 | 备选 |
| WSLg | 仅支持单窗口，非完整桌面 | ❌ |

## 3 环境信息

- Windows 11 Build 26200, Intel Core Ultra 5 125H, 32 GB RAM
- WSL 2 v2.7.14.0
- Ubuntu 20.04 (cloud image, glibc 2.31, Python 3.8.10)
- xrdp 0.9.12 + TigerVNC 1.10.1 + Xfce4

## 4 搭建步骤

### 4.1 导入 Ubuntu 20.04

> Ubuntu 18.04 的 Python 3.6 缺少 `ThreadingHTTPServer`，PyInstaller 打包会失败，须用 20.04。

```powershell
curl -LO https://cloud-images.ubuntu.com/releases/20.04/release/ubuntu-20.04-server-cloudimg-amd64-root.tar.xz
wsl --import Ubuntu2004 D:\WSL\Ubuntu2004 ubuntu-20.04-server-cloudimg-amd64-root.tar.xz
wsl --set-default Ubuntu2004
```

### 4.2 安装 xrdp + Xvnc + Xfce4

```bash
# 换源（阿里云镜像）
sed -i 's|http://archive.ubuntu.com|https://mirrors.aliyun.com|g' /etc/apt/sources.list
sed -i 's|http://security.ubuntu.com|https://mirrors.aliyun.com|g' /etc/apt/sources.list
apt update

apt install -y xfce4 xfce4-goodies xrdp tigervnc-standalone-server xorgxrdp
```

### 4.3 配置 xrdp

```bash
# 端口改为 3390，避免与 Windows RDP (3389) 冲突
sed -i 's/port=3389/port=3390/' /etc/xrdp/xrdp.ini

# 确认 sesman.ini 中 X11DisplayOffset=10（原因见 §5.3）
```

### 4.4 持久保活

WSL 在无进程运行时会自动终止，导致 xrdp 断连。通过 `sleep infinity` 保活：

```bash
cat > /usr/local/bin/start-desktop.sh << 'EOF'
#!/bin/sh
service dbus start
service xrdp-sesman start
service xrdp start
exec sleep infinity
EOF
chmod +x /usr/local/bin/start-desktop.sh
```

Windows 端在独立终端中运行：

```powershell
wsl -d Ubuntu2004 -- /usr/local/bin/start-desktop.sh
```

### 4.5 远程连接

```powershell
mstsc /v:localhost:3390
```

session 选择 **Xvnc**，username 填 `root`，password 填已设置的密码。

## 5 问题排查

上述步骤看似简单，实际部署中连续遇到四个问题，逐一记录如下。

### 5.1 `.xsession` 中 `unset DISPLAY` 导致会话退出

**现象**：xrdp 连接后立即闪退，日志显示 `login failed for display 0`。

**原因**：`/root/.xsession` 中包含 `unset DISPLAY`。xrdp 启动会话时通过 `DISPLAY` 环境变量将 X server 地址传递给窗口管理器，`unset DISPLAY` 删除该变量后，xfce4 无法连接 X server，会话直接退出。

**解决**：

```bash
echo '#!/bin/sh' > /root/.xsession
echo 'exec startxfce4' >> /root/.xsession
chmod +x /root/.xsession
```

> 参考：[xrdp wiki - Troubleshooting](https://github.com/neutrinolabs/xrdp/wiki/Troubleshooting)

### 5.2 Xorg 后端在 WSL2 中不可用

**现象**：选择 Xorg session 登录失败。

**原因**：WSL2 不提供 GPU 驱动的 DRM/KMS 接口，Xorg 无法初始化图形设备。即使安装了 `xorgxrdp` 驱动模块，`Xorg -config xrdp/xorg.conf` 仍无法启动。

**解决**：使用 **Xvnc session** 替代。Xvnc 为纯软件渲染的 VNC server，不依赖 GPU，在 WSL2 中可正常运行。

> 参考：[C-nergy: xrdp on Ubuntu 20.04](https://c-nergy.be/blog/?p=17310)，推荐 WSL2 下使用 Xvnc

### 5.3 WSLg 占用 :0 display

**现象**：`/tmp/.X11-unix/X0` 的 owner 为 `wsluser`，且位于只读文件系统，root 无法删除：

```bash
rm: cannot remove '/tmp/.X11-unix/X0': Read-only file system
```

**原因**：WSLg 将 `/tmp/.X11-unix/` 作为只读挂载点，其 X0 socket 不可移除。若 xrdp 的 `X11DisplayOffset` 设为 0，将与 WSLg 的 :0 冲突。

**解决**：`sesman.ini` 中设置 `X11DisplayOffset=10`，xrdp 使用 :10、:11 等编号，避免冲突。

### 5.4 root 账号被锁定（根本原因）

**现象**：修复上述三个问题后，仍然 `login failed for display 0`。sesman 日志仅显示连接进入后立即关闭，无任何 session 启动记录，即使日志级别设为 TRACE 亦然。

**排查**：检查 `/etc/shadow` 发现：

```bash
grep root /etc/shadow
# root:*:20264:0:99999:7:::
```

密码字段为 `*`，`passwd -S root` 输出 `root L`（L = Locked）。
```bash
passwd -S root
# root L 09/27/2026 0 99999 7 -1
```

**认证链路**：xrdp-sesman → PAM → 查 `/etc/shadow` → 密码为 `*` → 认证拒绝 → sesman 关闭连接 → xrdp 报 "login failed"。

Ubuntu cloud image 默认锁定 root 账号，这在云服务器场景下合理，但 xrdp 需要 PAM 认证通过才能建立会话。

**解决**：

```bash
echo 'root:YOUR_PASSWORD' | chpasswd
passwd -u root

# 验证：P 表示已设置密码且可用
passwd -S root
# root P 09/27/2026 0 99999 7 -1
```

### 5.5 其他问题

**SSL 密钥权限**：xrdp 以 `xrdp` 用户运行，无法读取 `/etc/ssl/private/ssl-cert-snakeoil.key`（属 `ssl-cert` 组），日志报 `Permission denied`：

```bash
usermod -aG ssl-cert xrdp
```

**tsusers 组缺失**：`sesman.ini` 配置了 `TerminalServerUsers=tsusers`，但 cloud image 中不存在该组。`AlwaysGroupCheck=false` 时理论上可放行，但建议显式创建：

```bash
groupadd tsusers
groupadd tsadmins
usermod -aG tsusers root
```

## 6 验证结果

![WSL2 + Xvnc 远程桌面成功连接](WSL2andXvnctoLinux.png)

## 7 配置清单

| 配置项 | 值 | 原因 |
|--------|-----|------|
| `xrdp.ini` → `port` | `3390` | 避开 Windows RDP 3389 |
| `sesman.ini` → `X11DisplayOffset` | `10` | 避开 WSLg 的 :0 |
| `sesman.ini` → `AllowRootLogin` | `true` | 允许 root 登录 |
| `/root/.xsession` | `exec startxfce4` | 不可含 `unset DISPLAY` |
| root 密码 | 已设置并解锁 | cloud image 默认锁定 |
| xrdp 用户 | 加入 `ssl-cert` 组 | 读取 SSL 私钥 |
| 连接 session | **Xvnc** | WSL2 无 GPU，Xorg 不可用 |

## 8 参考文献

1. [Microsoft: Run Linux GUI apps with WSL](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps) — WSLg 仅支持单窗口 GUI，不提供完整桌面
2. [Docker Desktop: Linux VM architecture](https://docs.docker.com/desktop/features/linux/) — Docker Desktop on Windows 基于 WSL2 运行
3. [xrdp Wiki: Tips and FAQ — Backend 选择](https://github.com/neutrinolabs/xrdp/wiki/Tips-and-FAQ#how-to-choose-backend-xorgxrdp-vs-xvnc) — Xvnc vs Xorgxrdp 后端对比
4. [TigerVNC: Xvnc man page](https://tigervnc.org/doc/Xvnc.html) — Xvnc 纯软件渲染 VNC server

## 9 小结

xrdp 的 `login failed for display 0` 错误信息具有误导性——它不区分 PAM 认证失败和 display 冲突，只笼统报 display 0 登录失败。排查此类问题时，建议按以下顺序检查：

1. `/etc/shadow` — 确认目标用户未被锁定
2. `.xsession` — 确认不含 `unset DISPLAY` 等破坏性操作
3. SSL 权限 — xrdp 用户能否读取私钥
4. WSL2 中应使用 Xvnc — Xorg 无 GPU 支持

此外，Ubuntu cloud image 默认锁定 root 账号，在 xrdp 场景下是一个容易忽略的坑点。建议 xrdp-sesman 在 PAM 认证失败时输出更明确的日志，以减少排查耗时。

---

*本文在 GitHub Copilot 辅助下完成。人工提出排查方向与决策，AI 执行了日志分析、配置检查、命令运行与文献检索，最终方案经人工实际验证确认。*

---
title: WSL2 + xrdp + Xvnc 实现完整 Linux GUI 桌面（踩坑全记录）
date: 2026-09-27
category: 技术
tags: WSL2, xrdp, Xvnc, Xfce4, Linux, 远程桌面, 踩坑
slug: wsl2-xrdp-xfce4-guide
authors: 王前
summary: 折腾了一整天才把 WSL2 里的 xrdp 远程桌面搞通，记录一下踩的坑——root 账号被锁、.xsession 里 unset DISPLAY、Xorg 在 WSL2 跑不起来……最终靠 Xvnc 方案搞定。
---

## 起因

最近在给一个 Python Web 应用（`NJ_Oil_显示端`）打 Linux 包，目标是**银河麒麟 V10**（glibc 2.28）。glibc 兼容性这事大家都懂——高编译的 binary 到低版本跑不了，所以得用 glibc ≤ 2.31 的环境打包。

打包倒是打出来了，但我心里不踏实——**没在 Linux 上实际跑过，谁知道能不能正常启动？浏览器弹不弹得出来？页面能不能渲染？** 光靠 `--version` 不返回错误就放心，那心太大了。

WSLg 倒是能跑 GUI 程序，但它只支持单窗口，我要的是**一个完整桌面**，能像虚拟机那样随便点来点去。

所以需求就变成了：WSL2 里搞一个完整的 Linux 桌面环境。

## 先说说为什么不用 Docker

我知道很多人第一反应是 Docker。Docker 很好，隔离干净、可复现、CI/CD 友好，这些我都认。但有两个问题：

1. **Docker Desktop on Windows 底层就是 WSL2**（[官方文档](https://docs.docker.com/desktop/features/linux/)写的），"不用 WSL 直接用 Docker"其实是个伪命题——你并没有绕开 WSL2，只是多套了一层 Docker Engine。

2. 对 GUI 桌面场景，Docker 不太合适：容器没 systemd，dbus 和 xrdp 的生命周期得手动管；容器没有持久会话，重建一下桌面配置全丢；要装 VNC + 窗口管理器，跟 WSL2 方案一样麻烦，还多一层隔离开销。

所以 Docker 适合无头打包和 CI，但我要的是**交互式 GUI 测试**，还是直接用 WSL2 吧。

| 方案 | 想法 | 结论 |
|------|------|------|
| Docker | 多一层抽象，GUI 不方便 | ❌ |
| WSL2 直接导入 | 轻量，跟 Windows 文件互通 | ✅ |
| Hyper-V 虚拟机 | 太重了 | 备选 |
| WSLg | 只能弹单个窗口，不是桌面 | ❌ |

## 环境信息

- Windows 11 Build 26200, Core Ultra 5 125H, 32G RAM
- WSL 2 v2.7.14.0
- Ubuntu 20.04 (cloud image, glibc 2.31, Python 3.8.10)
- xrdp 0.9.12 + TigerVNC 1.10.1 + Xfce4

## 搭建过程

### 1. 导入 Ubuntu 20.04

> ⚠️ 别用 18.04！Python 3.6 没有 `ThreadingHTTPServer`，PyInstaller 直接报错。我踩过这个坑了。

```powershell
# 下载 cloud image
curl -LO https://cloud-images.ubuntu.com/releases/20.04/release/ubuntu-20.04-server-cloudimg-amd64-root.tar.xz

# 导入 WSL
wsl --import Ubuntu2004 D:\WSL\Ubuntu2004 ubuntu-20.04-server-cloudimg-amd64-root.tar.xz
wsl --set-default Ubuntu2004
```

### 2. 装桌面和 xrdp

```bash
# 先换源，国内不然太慢
sed -i 's|http://archive.ubuntu.com|https://mirrors.aliyun.com|g' /etc/apt/sources.list
sed -i 's|http://security.ubuntu.com|https://mirrors.aliyun.com|g' /etc/apt/sources.list
apt update

# 一把装上
apt install -y xfce4 xfce4-goodies xrdp tigervnc-standalone-server xorgxrdp
```

### 3. 配置 xrdp

```bash
# 端口改成 3390，别跟 Windows 自带的 RDP 3389 撞了
sed -i 's/port=3389/port=3390/' /etc/xrdp/xrdp.ini

# sesman.ini 里确认 X11DisplayOffset=10
# 这个很重要，后面会讲为什么
```

### 4. 写个保活脚本

WSL 没有进程跑着就会自己关掉，xrdp 也就断了。用 `sleep infinity` 卡住：

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

Windows 端：

```powershell
wsl -d Ubuntu2004 -- /usr/local/bin/start-desktop.sh
```

### 5. 连接

```powershell
mstsc /v:localhost:3390
```

session 选 **Xvnc**，用户名 `root`，密码填你设的。进去就是 Xfce4 桌面。

---

## 踩坑记录

好，上面是"顺利的话"的流程。实际上我折腾了**一整天**，以下是所有坑。

### 坑 1：`.xsession` 里有个 `unset DISPLAY`

连上去直接闪退，日志报 `login failed for display 0`。

查了半天发现 `/root/.xsession` 里不知道什么时候被写了个 `unset DISPLAY`。这玩意儿太致命了——xrdp 启动会话时靠 `DISPLAY` 环境变量告诉窗口管理器"你连 :10 这个 X server"，结果 `.xsession` 一上来就把这个变量删了，xfce4 根本不知道往哪画，直接退出。

```bash
# 重写 .xsession，就两行，别多搞
echo '#!/bin/sh' > /root/.xsession
echo 'exec startxfce4' >> /root/.xsession
chmod +x /root/.xsession
```

> 参考：[xrdp wiki - Troubleshooting](https://github.com/neutrinolabs/xrdp/wiki/Troubleshooting)

### 坑 2：Xorg 在 WSL2 里跑不起来

登录界面如果选 Xorg session，必失败。

原因很简单：WSL2 没有真正的 GPU 驱动，Xorg 需要 DRM/KMS，WSL2 给不了。就算装了 `xorgxrdp` 驱动也没用，`Xorg -config xrdp/xorg.conf` 直接起不来。

**结论：WSL2 里永远用 Xvnc。** Xvnc 是纯软件渲染，不依赖 GPU，稳得很。

> 参考：[C-nergy 的 xrdp 安装指南](https://c-nergy.be/blog/?p=17310)，也是推荐 WSL2 下用 Xvnc

### 坑 3：WSLg 占着 :0 不放

`/tmp/.X11-unix/X0` 这个 socket 是 WSLg 创建的，被 `wsluser` 拥有。关键是这玩意儿在一个**只读文件系统**上，root 都删不掉：

```bash
rm: cannot remove '/tmp/.X11-unix/X0': Read-only file system
```

如果 xrdp 的 `X11DisplayOffset` 设成 0，就会跟 WSLg 抢 :0，抢不过就挂。

所以 sesman.ini 里 `X11DisplayOffset=10`，让 xrdp 用 :10、:11……绕开 :0。

### 坑 4：root 账号被锁（这才是真正的根因）

前面三个坑修完之后，还是 `login failed for display 0`。sesman 的日志只看到连接进来然后断开，没有任何 session 启动的痕迹，连 TRACE 级别都没用。

后来我灵机一动看了下 `/etc/shadow`：

```bash
grep root /etc/shadow
# root:*:20264:0:99999:7:::
```

密码字段是 `*`！`passwd -S root` 输出 `root L`，**L 就是 Locked**。

整个认证流程是这样的：xrdp-sesman 收到登录请求 → 调 PAM → PAM 查 `/etc/shadow` → 发现密码是 `*` → 直接拒绝 → sesman 断开 → xrdp 报 "login failed"。

Ubuntu cloud image 出于安全考虑**默认锁定 root**，这设计没毛病，但 xrdp 需要认证通过才行啊……

```bash
# 设密码 + 解锁
echo 'root:YOUR_PASSWORD' | chpasswd
passwd -u root

# 验证，P = 有密码可用
passwd -S root
# root P 09/27/2026 0 99999 7 -1
```

修完这个，终于连上了。一整天的坑，根因就这么一行。

### 顺带碰到的其他小坑

**SSL 密钥权限**：xrdp 以 `xrdp` 用户运行，读不了 `/etc/ssl/private/ssl-cert-snakeoil.key`（属于 `ssl-cert` 组），日志里 `Cannot read private key file: Permission denied`。加个组就行：

```bash
usermod -aG ssl-cert xrdp
```

**tsusers 组不存在**：sesman.ini 里写了 `TerminalServerUsers=tsusers`，但 cloud image 没这个组。虽然 `AlwaysGroupCheck=false` 理论上能过，还是建一下保险：

```bash
groupadd tsusers
groupadd tsadmins
usermod -aG tsusers root
```

## 成功截图

![终于连上了](WSL2andXvnctoLinux.png)

## 最后整理一下配置

| 配置项 | 值 | 为什么 |
|--------|-----|--------|
| `xrdp.ini` → `port` | `3390` | 避开 Windows 的 3389 |
| `sesman.ini` → `X11DisplayOffset` | `10` | 避开 WSLg 的 :0 |
| `sesman.ini` → `AllowRootLogin` | `true` | 要用 root 登录 |
| `/root/.xsession` | `exec startxfce4` | 别写 `unset DISPLAY`！ |
| root 密码 | 已设置并解锁 | cloud image 默认锁定 |
| xrdp 用户 | 加入 `ssl-cert` 组 | 要读 SSL 私钥 |
| 连接 session | **Xvnc** | WSL2 没有 GPU，Xorg 用不了 |

## 参考链接

1. [Microsoft WSLg 文档](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps) — 确认 WSLg 只支持单窗口
2. [xrdp GitHub Wiki](https://github.com/neutrinolabs/xrdp/wiki/Troubleshooting) — login failed 排查
3. [C-nergy: xrdp on Ubuntu 20.04](https://c-nergy.be/blog/?p=17310) — WSL2 下推荐 Xvnc
4. [Ubuntu Cloud Images](https://cloud-images.ubuntu.com/) — 默认锁定 root 的安全策略
5. [xrdp sesman.ini](https://github.com/neutrinolabs/xrdp/blob/sesman/sesman.ini) — 配置参考
6. [TigerVNC](https://tigervnc.org/) — 纯软件渲染 VNC server

## 一点感想

xrdp 报 `login failed for display 0` 这个错误信息真是够误导的——它只说 display 0 登录失败，完全不告诉你真正原因是 PAM 认证没过。如果你也在折腾这个，排查顺序建议：

1. 先看 `/etc/shadow`，确认用户没被锁
2. 再看 `.xsession`，确认没有 `unset DISPLAY` 这种破坏性操作
3. 检查 SSL 权限，xrdp 用户能不能读私钥
4. WSL2 里永远用 Xvnc，别折腾 Xorg

最后吐槽一句：Ubuntu cloud image 默认锁 root 这个设计，对云服务器确实合理，但对 xrdp 场景就是个坑。而且 xrdp 的日志真该改进一下，PAM 认证失败好歹记一条啊……

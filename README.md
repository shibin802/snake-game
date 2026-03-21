# 小宝贪吃蛇

一个纯前端的贪吃蛇小游戏，适合直接部署到 Cloudflare Pages。

## 功能

- 键盘方向键 / WASD 控制
- 手机触控按钮控制
- 当前分数 / 最高分
- 暂停 / 继续 / 重新开始
- 分数越高速度越快
- 本地保存最高分

## 本地运行

直接用任意静态文件服务打开即可，例如：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 部署到 Cloudflare Pages

构建输出目录就是项目根目录，无需额外 build。

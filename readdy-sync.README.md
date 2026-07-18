# 将 `D:\Desktop\maple` 同步到 Readdy（直接 API 上传）

这个目录里提供了一个可直接运行的脚本：`readdy-sync.mjs`，按你上传的《Readdy 项目代码上传通用手册》里的 **“直接 Readdy API 通道”**实现：  
`msg_list` 读取最新版本 -> `code_edit` 上传文件 -> `msg` 同步右侧历史版本卡片（不自动 Publish）。

## 前置条件

- 你的浏览器已经登录 Readdy（脚本默认从 **Edge** 的 Local Storage 里尝试确认读取 `readdy_access_token`）。
- 你知道目标 Readdy 项目的 `PROJECT_ID`（形如 uuid）。

## 最快运行方式

在当前目录（也就是 `D:\Desktop\maple`）打开 PowerShell：

```powershell
node .\readdy-sync.mjs --project <你的_READDY_PROJECT_ID>
```

脚本会提示输入 `yes` 才会真正上传（防止误操作）。  
如果你希望跳过确认，可加 `--yes`（不推荐，除非你非常确定 projectId 正确）。

## 先预演（推荐）

只查看将上传哪些文件、以及将基于哪个 parentVersionID：

```powershell
node .\readdy-sync.mjs --project <你的_READDY_PROJECT_ID> --dry-run
```

## 关键参数

- `--root <DIR>`：项目根目录（默认当前目录）。你这次就是 `D:\Desktop\maple`，所以一般不用填。
- `--include <PATTERN>`：上传包含规则（可多次填写）。
- `--exclude <PATTERN>`：排除规则（可多次填写）。
- `--parent-version <ID>`：手动指定父版本 `parentVersionID`（当 `msg_list` 取不到最新版本时用）。
- `--edge-profile <DIR>`：指定 Edge profile 路径（默认：`LOCALAPPDATA\Microsoft\Edge\User Data\Default`）。
- `--verbose`：输出更多信息（不会输出 token）。

脚本自带默认 include/exclude：

- include：`src/**`、`public/**`、SEO 构建脚本、`index.html`、`package.json`、`vite.config.*`、`tsconfig*.json` 等常见配置
- exclude：`node_modules/**`、`out/**`、`dist/**`、`.env*`、`**/*.log`、`maple.zip` 等

注意：Readdy 的 SEO Configuration 按网站版本独立保存。`code_edit` 生成新版本后，需要在该版本的 SEO Configuration 中重新点击 Generate，再重新发布域名。当前同步接口只上传文本源码；新增或替换的 PNG、JPG 等图片需要通过 Readdy Files 上传。

## 关于 token（安全说明）

脚本默认 **不会** 要你手动复制 token。它会尝试在 Edge profile 的 leveldb 文件里，围绕 `readdy_access_token` 键附近确认找到 JWT（只在内存中使用，不打印、不写文件）。  
如果你更想自己提供 token（例如在非 Edge 或 profile 不同的情况下），可以只在当前终端临时设置环境变量：

```powershell
$env:READDY_ACCESS_TOKEN = "<你的token>"
node .\readdy-sync.mjs --project <你的_READDY_PROJECT_ID>
Remove-Item Env:\READDY_ACCESS_TOKEN
```

注意：不要把 token 写进任何 `.env` 文件或代码仓库。

## 常见失败原因

- `未能确认找到 readdy_access_token`：通常是 Edge 没登录 Readdy，或你登录的不是默认 profile。用 `--edge-profile` 指到正确 profile。
- `projectId is required` / `X-Project-Id`：脚本已处理；如果仍出现，多半是 projectId 填错或权限不足。
- 上传后右侧没有新卡片：脚本会自动尝试 `msg` 同步；如果返回已存在，会跳过。

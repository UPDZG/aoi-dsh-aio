#!/usr/bin/env node
/**
 * AOI Workbench 一键发布脚本（CommonJS 版）
 *
 * 用法：
 *   node publish.cjs check     检查发布条件
 *   node publish.cjs pack      打包
 *   node publish.cjs github    推送到 GitHub
 *   node publish.cjs npm       发布到 npm（需先 npm login）
 *   node publish.cjs catalog   查看插件目录提交内容
 */

const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = __dirname;
const TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'UPDZG';
const REPO = 'aoi-dsh-aio';

function run(cmd, args = []) {
  try {
    const out = execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, err: (e.stderr || e.message || '').toString(), code: e.status };
  }
}

async function ghApi(path, opts = {}) {
  const r = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'aoi-publish',
      ...(opts.headers || {}),
    },
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, ok: r.ok, data };
}

(async () => {
  const CMD = process.argv[2];

  if (CMD === 'check') {
    console.log('='.repeat(60));
    console.log('  AOI Workbench 发布条件检查');
    console.log('='.repeat(60));
    console.log('');

    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    console.log('包名     :', pkg.name);
    console.log('版本     :', pkg.version);
    console.log('');

    // 1. GitHub 仓库
    const repo = await ghApi(`/repos/${OWNER}/${REPO}`);
    if (repo.ok) {
      const created = new Date(repo.data.created_at);
      const ageH = (Date.now() - created.getTime()) / 3600000;
      const ready = ageH >= 24;
      console.log('GitHub 仓库');
      console.log('  地址   :', repo.data.html_url);
      console.log('  创建   :', created.toLocaleString('zh-CN', { timeZone: 'Asia/Hong_Kong' }));
      console.log('  年龄   :', ageH.toFixed(1), '小时');
      console.log('  可提交 :', ready ? '是' : `否（还需 ${(24 - ageH).toFixed(1)} 小时）`);
      if (!ready) {
        const at = new Date(created.getTime() + 86400000);
        console.log('  解禁   :', at.toLocaleString('zh-CN', { timeZone: 'Asia/Hong_Kong' }));
      }
      console.log('  Topics :', (repo.data.topics || []).join(', '));
    } else {
      console.log('GitHub 仓库: 查询失败', repo.status);
    }

    // 2. npm
    console.log('');
    console.log('npm');
    const who = run('npm', ['whoami']);
    if (who.ok) {
      console.log('  登录   : 是（' + who.out.trim() + '）');
    } else {
      console.log('  登录   : 否 —— 需要先运行 npm login');
    }
    const view = run('npm', ['view', pkg.name, 'version']);
    console.log('  已发布 :', view.ok ? view.out.trim() : '未发布');

    // 3. 本地
    console.log('');
    console.log('本地');
    const status = run('git', ['status', '--porcelain']);
    const dirty = status.ok && status.out.trim().length > 0;
    console.log('  Git    :', dirty ? '有未提交改动' : '干净');
    if (dirty) {
      console.log('           ', status.out.trim().split('\n').slice(0, 5).join('\n            '));
    }
    const tarballs = require('node:fs').readdirSync(ROOT).filter(f => f.endsWith('.tgz'));
    console.log('  打包   :', tarballs.length ? tarballs.join(', ') : '未打包');
    console.log('');
    console.log('='.repeat(60));
    return;
  }

  if (CMD === 'pack') {
    console.log('打包中...');
    const r = run('npm', ['pack']);
    if (r.ok) console.log('完成:', r.out.trim());
    else { console.error('失败:', r.err); process.exit(1); }
    return;
  }

  if (CMD === 'github') {
    console.log('推送到 GitHub...');
    const add = run('git', ['add', '-A']);
    if (!add.ok) console.error('git add:', add.err);

    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    const commit = run('git', ['commit', '-m', `chore: release ${pkg.version}`]);
    if (commit.ok) console.log('提交:', commit.out.split('\n')[0]);
    else console.log('无新改动');

    const push = run('git', ['push']);
    if (push.ok) console.log('推送完成');
    else console.error('推送失败:', push.err);
    return;
  }

  if (CMD === 'npm') {
    console.log('发布到 npm...');
    const who = run('npm', ['whoami']);
    if (!who.ok) {
      console.error('未登录，请先运行: npm login');
      process.exit(1);
    }
    console.log('已登录:', who.out.trim());
    const pub = run('npm', ['publish', '--access', 'public']);
    if (pub.ok) {
      console.log('发布成功!');
      console.log(pub.out);
    } else {
      console.error('发布失败:', pub.err);
      process.exit(1);
    }
    return;
  }

  if (CMD === 'catalog') {
    const repo = await ghApi(`/repos/${OWNER}/${REPO}`);
    if (!repo.ok) { console.error('无法查询仓库'); process.exit(1); }

    const ageH = (Date.now() - new Date(repo.data.created_at).getTime()) / 3600000;
    if (ageH < 24) {
      console.error(`仓库仅存在 ${ageH.toFixed(1)} 小时，需满 24 小时`);
      const at = new Date(new Date(repo.data.created_at).getTime() + 86400000);
      console.error('解禁时间:', at.toLocaleString('zh-CN', { timeZone: 'Asia/Hong_Kong' }));
      process.exit(1);
    }

    console.log('仓库已满 24 小时，可以提交。');
    console.log('');
    console.log('步骤：');
    console.log('1. 打开 https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/fork');
    console.log('2. 新建文件 data/plugins/UPDZG__aoi-dsh-aio.yml');
    console.log('3. 粘贴以下内容：');
    console.log('');
    const entry = existsSync(join(ROOT, 'market-entry.yml'))
      ? readFileSync(join(ROOT, 'market-entry.yml'), 'utf8')
      : '# market-entry.yml 不存在';
    console.log(entry);
    console.log('4. 提交 PR');
    return;
  }

  console.log('用法: node publish.cjs <command>');
  console.log('');
  console.log('  check    检查发布条件');
  console.log('  pack     打包 tgz');
  console.log('  github   推送到 GitHub');
  console.log('  npm      发布到 npm（需先 npm login）');
  console.log('  catalog  查看插件目录提交内容');
})();
